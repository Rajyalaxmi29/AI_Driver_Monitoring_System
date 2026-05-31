import sys
# Disable tensorflow to bypass broken native DLL loading on Python 3.13
sys.modules['tensorflow'] = None

import cv2
import numpy as np
import time
import os
from PyQt5.QtCore import QThread, pyqtSignal
from PyQt5.QtGui import QImage
import mediapipe as mp

# Wrap YOLOv8 imports to handle environment PyTorch DLL load failures gracefully
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception as e:
    YOLO_AVAILABLE = False
    print("Warning: YOLOv8 / PyTorch failed to load. Mobile phone detection will be disabled.", flush=True)

# Import MediaPipe tasks directly to avoid __init__ naming collisions
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

# Import custom modules
from utils.face_mesh_utils import calculate_ear, calculate_mar, draw_hud_contours, LEFT_EYE_INDICES, RIGHT_EYE_INDICES
from utils.head_pose import estimate_head_pose, draw_pose_axes
from utils.night_mode import apply_night_mode_enhancement
from analytics.fatigue_calculator import FatigueCalculator
from analytics.database_manager import DatabaseManager
from alerts.voice_assistant import speak

# --- Config & Thresholds ---
EAR_THRESHOLD_DEFAULT = 0.22  # Default Eye Aspect Ratio threshold
MAR_THRESHOLD = 0.52          # Mouth Aspect Ratio threshold for yawning
YAW_THRESHOLD_DEFAULT = 20.0  # Horizontal distraction (degrees)
PITCH_THRESHOLD_DEFAULT = 15.0 # Vertical distraction (degrees)

# Time duration requirements (seconds)
DROWSY_TIME_LIMIT = 1.5
YAWN_TIME_LIMIT = 2.5
DISTRACT_TIME_LIMIT = 1.5

class VideoThread(QThread):
    # Signals to communicate with the main dashboard UI
    frame_ready = pyqtSignal(QImage)
    telemetry_ready = pyqtSignal(dict)
    alert_triggered = pyqtSignal(str, str) # alert_type, message

    def __init__(self, session_id, driver_name):
        super().__init__()
        self.session_id = session_id
        self.driver_name = driver_name
        self.running = True
        
        # Load logic utilities
        self.calculator = FatigueCalculator()
        self.db = DatabaseManager()
        
        # Initialize YOLOv8 Model (downloads automatically if not cached)
        if YOLO_AVAILABLE:
            try:
                self.yolo_model = YOLO("yolov8n.pt")
            except Exception as e:
                self.yolo_model = None
                print("Warning: YOLOv8 model initialization failed.", flush=True)
        else:
            self.yolo_model = None
        
        # Calibration baseline placeholders
        self.is_calibrating = False
        self.calibration_frames = 0
        self.calibration_ear_sum = 0.0
        self.calibration_yaw_sum = 0.0
        self.calibration_pitch_sum = 0.0
        
        self.baseline_ear = 0.28
        self.baseline_yaw = 0.0
        self.baseline_pitch = 0.0
        self.calibrated = False
        
        # Face recognition signature database (landmark ratios)
        # Ratio 1: Inner eye distance / outer eye distance
        # Ratio 2: Eye to mouth / Face height
        self.authorized_signature = None # Tuple of ratios
        self.driver_authenticated = False
        
        # Counters
        self.blink_count = 0
        self.yawn_count = 0
        
        # Tracking states
        self.eyes_closed_frames = 0
        self.mouth_open_frames = 0
        self.distracted_frames = 0
        self.phone_frames = 0
        
        # Timers
        self.drowsy_start_time = None
        self.distract_start_time = None
        self.yawn_start_time = None
        self.phone_start_time = None
        
        # Voice alert rate limit timers
        self.last_drowsy_voice = 0
        self.last_distract_voice = 0
        self.last_yawn_voice = 0
        self.last_phone_voice = 0
        
        # Optimization: run YOLO every N frames
        self.frame_counter = 0
        self.phone_detected = False
        self.phone_box = None
        self.phone_confirm_count = 0      # consecutive YOLO windows with phone
        self.PHONE_CONFIRM_NEEDED = 3     # must see phone 3 times in a row

    def run(self):
        # Open default webcam
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            self.alert_triggered.emit("CAMERA_ERROR", "Could not open webcam.")
            return
            
        # Initialize MediaPipe Landmarker Tasks API
        # Model path relative to workspace
        model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "face_landmarker.task")
        if not os.path.exists(model_path):
            self.alert_triggered.emit("MODEL_ERROR", "face_landmarker.task file is missing.")
            cap.release()
            return
        
        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.FaceLandmarkerOptions(
            base_options=base_options,
            num_faces=1,
            running_mode=mp_vision.RunningMode.VIDEO
        )
        detector = mp_vision.FaceLandmarker.create_from_options(options)
        
        # Record start of session in database
        self.db.start_session(self.session_id, self.driver_name)
        
        # Timing metrics for FPS calculation
        prev_time = time.time()
        telemetry_log_timer = time.time()
        
        # Drowsiness detection parameters (configured from defaults)
        ear_threshold = EAR_THRESHOLD_DEFAULT
        yaw_threshold = YAW_THRESHOLD_DEFAULT
        pitch_threshold = PITCH_THRESHOLD_DEFAULT
        
        while self.running:
            success, frame = cap.read()
            if not success:
                continue
                
            self.frame_counter += 1
            frame = cv2.flip(frame, 1)
            h, w, c = frame.shape
            
            # --- 1. Night Mode Enhancement ---
            frame, night_mode_active = apply_night_mode_enhancement(frame, brightness_threshold=65)
            
            # --- 2. YOLOv8 Mobile Phone Detection (Every 6 frames to keep GUI lag-free) ---
            if self.yolo_model is not None and self.frame_counter % 6 == 0:
                phone_detected_this_frame = False
                try:
                    yolo_results = self.yolo_model(frame, verbose=False)
                    for r in yolo_results:
                        for box in r.boxes:
                            cls_idx = int(box.cls[0])
                            conf = float(box.conf[0])
                            # COCO class 67 is 'cell phone' — high threshold to cut false positives
                            if cls_idx == 67 and conf > 0.70:
                                phone_detected_this_frame = True
                                self.phone_frames += 1
                                x1, y1, x2, y2 = map(int, box.xyxy[0])
                                self.phone_box = (x1, y1, x2, y2, conf)
                                break
                except Exception as e:
                    print("Warning: YOLOv8 inference failed.", flush=True)

                # Require PHONE_CONFIRM_NEEDED consecutive detections before alerting
                if phone_detected_this_frame:
                    self.phone_confirm_count = min(
                        self.phone_confirm_count + 1, self.PHONE_CONFIRM_NEEDED
                    )
                else:
                    self.phone_confirm_count = 0
                    self.phone_box = None   # clear stale box

                self.phone_detected = (self.phone_confirm_count >= self.PHONE_CONFIRM_NEEDED)

            # Draw phone bounding box on intermediate frames if detected
            if self.phone_detected and self.phone_box is not None:
                x1, y1, x2, y2, conf = self.phone_box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, f"PHONE: {conf:.2f}", (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            
            # --- 3. Face Mesh Landmark Processing ---
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int(time.time() * 1000)
            result = detector.detect_for_video(mp_image, timestamp_ms)
            
            # State evaluation flags
            is_drowsy_alert = False
            is_distract_alert = False
            is_yawn_alert = False
            is_phone_alert = False
            
            avg_ear = 0.30
            mar = 0.10
            adj_yaw = 0.0
            adj_pitch = 0.0
            adj_roll = 0.0
            emotion = "NEUTRAL"
            stress_score = 0.0
            stress_level = "LOW"
            steering_angle = 0.0
            
            if result.face_landmarks:
                landmarks = result.face_landmarks[0]
                
                # --- Face Recognition & Driver Verification ---
                # Calculate simple geometric ratios for authentication signature
                eye_dist = np.linalg.norm(np.array([landmarks[33].x, landmarks[33].y]) - np.array([landmarks[263].x, landmarks[263].y]))
                face_height = np.linalg.norm(np.array([landmarks[10].x, landmarks[10].y]) - np.array([landmarks[152].x, landmarks[152].y]))
                mouth_to_nose = np.linalg.norm(np.array([landmarks[1].x, landmarks[1].y]) - np.array([landmarks[13].x, landmarks[13].y]))
                
                current_signature = (eye_dist / face_height, mouth_to_nose / face_height)
                
                if self.authorized_signature is None:
                    # Enrolling driver for first time
                    self.authorized_signature = current_signature
                    self.driver_authenticated = True
                else:
                    # Compare ratios
                    diff1 = abs(current_signature[0] - self.authorized_signature[0])
                    diff2 = abs(current_signature[1] - self.authorized_signature[1])
                    # If facial ratios are close, they are verified
                    if diff1 < 0.04 and diff2 < 0.04:
                        self.driver_authenticated = True
                    else:
                        self.driver_authenticated = False
                
                # Draw facial contours on HUD
                draw_hud_contours(frame, landmarks, w, h)
                
                # Calculate EAR and MAR
                ear_l = calculate_ear(landmarks, LEFT_EYE_INDICES, w, h)
                ear_r = calculate_ear(landmarks, RIGHT_EYE_INDICES, w, h)
                avg_ear = (ear_l + ear_r) / 2.0
                
                mar = calculate_mar(landmarks, w, h)
                
                # Head pose estimation
                success_pnp, pitch, yaw, roll, rvec, tvec, cam_mat = estimate_head_pose(landmarks, w, h)
                if success_pnp:
                    adj_yaw = yaw - self.baseline_yaw
                    adj_pitch = pitch - self.baseline_pitch
                    adj_roll = roll
                    draw_pose_axes(frame, rvec, tvec, cam_mat, landmarks, w, h)
                    
                # Fatigue analysis helpers
                emotion = self.calculator.detect_emotion(landmarks)
                
                # Dynamic blink calculator
                if avg_ear < ear_threshold:
                    self.eyes_closed_frames += 1
                else:
                    if self.eyes_closed_frames >= 2 and self.eyes_closed_frames < 20:
                        self.blink_count += 1
                    self.eyes_closed_frames = 0
                    
                # Yawn counter logic
                if mar > 0.50:
                    self.mouth_open_frames += 1
                else:
                    if self.mouth_open_frames >= 25: # approx 1 second
                        self.yawn_count += 1
                    self.mouth_open_frames = 0
                
                # Compute stress index based on hypothetical blink frequency
                blink_rate_est = self.blink_count * (60.0 / max(1.0, (time.time() - stats_start_time if 'stats_start_time' in locals() else 1.0)))
                stress_score, stress_level = self.calculator.estimate_stress_level(landmarks, adj_yaw, adj_pitch, adj_roll, blink_rate_est)
                
                # --- Calibration Mode ---
                if self.is_calibrating:
                    self.calibration_frames += 1
                    self.calibration_ear_sum += avg_ear
                    self.calibration_yaw_sum += yaw
                    self.calibration_pitch_sum += pitch
                    
                    if self.calibration_frames >= 60:
                        self.baseline_ear = self.calibration_ear_sum / 60.0
                        self.baseline_yaw = self.calibration_yaw_sum / 60.0
                        self.baseline_pitch = self.calibration_pitch_sum / 60.0
                        ear_threshold = max(0.16, min(self.baseline_ear * 0.75, 0.23))
                        self.is_calibrating = False
                        self.calibrated = True
                        speak("Calibration complete.")
                        self.db.log_alert(self.session_id, "INFO", "Baseline Calibration complete.")
                        
                else:
                    # --- Alert State Monitoring ---
                    current_time = time.time()
                    
                    # 1. Drowsiness Evaluation
                    if avg_ear < ear_threshold:
                        if self.drowsy_start_time is None:
                            self.drowsy_start_time = current_time
                        elif current_time - self.drowsy_start_time > DROWSY_TIME_LIMIT:
                            is_drowsy_alert = True
                            if current_time - self.last_drowsy_voice > 4.0:
                                speak("Driver is drowsy. Take a break immediately.")
                                self.last_drowsy_voice = current_time
                                self.db.log_alert(self.session_id, "DROWSY", f"Severe drowsiness detected. EAR: {avg_ear:.3f}")
                    else:
                        self.drowsy_start_time = None
                    
                    # 2. Distraction Evaluation
                    if abs(adj_yaw) > yaw_threshold or abs(adj_pitch) > pitch_threshold:
                        if self.distract_start_time is None:
                            self.distract_start_time = current_time
                        elif current_time - self.distract_start_time > DISTRACT_TIME_LIMIT:
                            is_distract_alert = True
                            if current_time - self.last_distract_voice > 4.0:
                                speak("Please focus on the road.")
                                self.last_distract_voice = current_time
                                self.db.log_alert(self.session_id, "DISTRACTED", f"Driver looking away. Yaw: {adj_yaw:+.1f}, Pitch: {adj_pitch:+.1f}")
                    else:
                        self.distract_start_time = None
                        
                    # 3. Yawning Evaluation
                    if mar > MAR_THRESHOLD:
                        if self.yawn_start_time is None:
                            self.yawn_start_time = current_time
                        elif current_time - self.yawn_start_time > YAWN_TIME_LIMIT:
                            is_yawn_alert = True
                            if current_time - self.last_yawn_voice > 10.0:
                                speak("Yawning detected. Consider a break.")
                                self.last_yawn_voice = current_time
                                self.db.log_alert(self.session_id, "YAWN", f"Driver fatigued and yawning. MAR: {mar:.3f}")
                    else:
                        self.yawn_start_time = None
                        
                    # 4. Mobile Phone Evaluation
                    if self.phone_detected:
                        if self.phone_start_time is None:
                            self.phone_start_time = current_time
                        elif current_time - self.phone_start_time > 1.0: # alert after 1 second of phone presence
                            is_phone_alert = True
                            if current_time - self.last_phone_voice > 4.0:
                                speak("Do not use your mobile phone while driving.")
                                self.last_phone_voice = current_time
                                self.db.log_alert(self.session_id, "PHONE", "Mobile phone usage detected.")
                    else:
                        self.phone_start_time = None
                        
            else:
                # Face out of frame
                self.drowsy_start_time = None
                self.distract_start_time = None
                self.yawn_start_time = None
                self.phone_start_time = None
                
            # Initialize stats_start_time on first loop
            if 'stats_start_time' not in locals():
                stats_start_time = time.time()
                
            # --- 4. Analytics Calculations ---
            drowsy_duration = (time.time() - self.drowsy_start_time) if self.drowsy_start_time else 0.0
            
            # Fatigue and Attention scoring
            attention_score = self.calculator.calculate_attention_score(
                avg_ear, is_drowsy_alert, adj_yaw, adj_pitch, self.phone_detected
            )
            fatigue_pct, fatigue_level = self.calculator.calculate_fatigue_score(
                drowsy_duration, self.yawn_count
            )
            
            # Steering simulation drift angle
            steering_angle = self.calculator.simulate_steering_drift(attention_score)
            
            # Database telemetry logging (once per second / 30 frames)
            if time.time() - telemetry_log_timer > 1.0:
                self.db.log_telemetry(
                    self.session_id, avg_ear, mar, adj_yaw, adj_pitch, fatigue_pct, attention_score
                )
                telemetry_log_timer = time.time()
                
            # --- 5. Frame rate FPS calculation ---
            current_time_fps = time.time()
            fps = 1.0 / (current_time_fps - prev_time)
            prev_time = current_time_fps
            
            # Compile telemetry dictionary
            telemetry_data = {
                "ear": avg_ear,
                "mar": mar,
                "yaw": adj_yaw,
                "pitch": adj_pitch,
                "roll": adj_roll,
                "fatigue_score": fatigue_pct,
                "fatigue_level": fatigue_level,
                "attention_score": attention_score,
                "blink_count": self.blink_count,
                "yawn_count": self.yawn_count,
                "stress_score": stress_score,
                "stress_level": stress_level,
                "emotion": emotion,
                "steering_angle": steering_angle,
                "fps": fps,
                "is_drowsy": is_drowsy_alert,
                "is_distracted": is_distract_alert,
                "is_yawning": is_yawn_alert,
                "is_phone_used": is_phone_alert,
                "night_mode": night_mode_active,
                "authenticated": self.driver_authenticated
            }
            
            # Emit processed telemetry data to dashboard
            self.telemetry_ready.emit(telemetry_data)
            
            # Convert frame format from BGR to RGB for Qt display
            rgb_qt_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            qt_h, qt_w, qt_ch = rgb_qt_image.shape
            bytes_per_line = qt_ch * qt_w
            q_image = QImage(rgb_qt_image.data, qt_w, qt_h, bytes_per_line, QImage.Format_RGB888)
            
            self.frame_ready.emit(q_image)
            
            # Slight sleep to release thread lock
            time.sleep(0.01)
            
        cap.release()
        detector.close()

    def stop(self):
        """Halts the processing thread loop and releases the camera."""
        self.running = False
        self.wait()
