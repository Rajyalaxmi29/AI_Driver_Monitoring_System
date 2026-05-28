import cv2
import numpy as np
import time
import threading
import subprocess
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from api_server import start_api_server, update_driver_state

# --- Config & Thresholds ---
# Default thresholds (will be adjusted if calibrated)
EAR_THRESHOLD = 0.22  # Eye Aspect Ratio threshold for drowsiness
MAR_THRESHOLD = 0.55  # Mouth Aspect Ratio threshold for yawning
YAW_THRESHOLD = 20.0  # Horizontal distraction (degrees)
PITCH_THRESHOLD = 15.0 # Vertical distraction (degrees)

# Time duration requirements (seconds)
DROWSY_TIME_LIMIT = 1.5
YAWN_TIME_LIMIT = 2.5
DISTRACT_TIME_LIMIT = 1.5

# MediaPipe Landmark Indices
# Left Eye
LEFT_EYE_INDICES = [362, 263, 385, 380, 387, 373] # [corner_inner, corner_outer, v1_t, v1_b, v2_t, v2_b]
# Right Eye
RIGHT_EYE_INDICES = [33, 133, 160, 144, 158, 153] # [corner_outer, corner_inner, v1_t, v1_b, v2_t, v2_b]

# SolvePnP 3D Model Points (generic 3D facial coordinate model)
# X points right (from viewer), Y points up, Z points out towards viewer
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),             # Nose tip (index 1)
    (0.0, -330.0, -65.0),        # Chin (index 152)
    (-225.0, 170.0, -135.0),     # Right eye corner (index 33)
    (225.0, 170.0, -135.0),      # Left eye corner (index 263)
    (-150.0, -150.0, -125.0),    # Right mouth corner (index 61)
    (150.0, -150.0, -125.0)      # Left mouth corner (index 291)
], dtype=np.float32)

# --- Voice Assistant Function ---
def speak(text):
    """Speaks the text asynchronously using Windows native System.Speech via PowerShell."""
    def run_speech():
        # Escape single quotes for PowerShell safety
        safe_text = text.replace("'", "''")
        cmd = f"Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('{safe_text}')"
        subprocess.run(["powershell", "-Command", cmd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Run in a daemon thread so it doesn't block the main GUI loop
    threading.Thread(target=run_speech, daemon=True).start()

# --- Helper Functions ---
def get_distance(p1, p2):
    return np.linalg.norm(p1 - p2)

def calculate_ear(landmarks, eye_indices, w, h):
    """Calculates the Eye Aspect Ratio (EAR) for a single eye."""
    # Convert normalized landmarks to pixel coords
    p = [np.array([landmarks[idx].x * w, landmarks[idx].y * h]) for idx in eye_indices]
    
    # Vertical distances
    v1 = get_distance(p[2], p[3])
    v2 = get_distance(p[4], p[5])
    # Horizontal distance
    h1 = get_distance(p[0], p[1])
    
    if h1 == 0:
        return 0.0
    return (v1 + v2) / (2.0 * h1)

def calculate_mar(landmarks, w, h):
    """Calculates the Mouth Aspect Ratio (MAR) for yawning detection."""
    # Inner mouth landmarks
    # 78, 308 (corners), 13, 14 (top/bottom lips)
    p_78 = np.array([landmarks[78].x * w, landmarks[78].y * h])
    p_308 = np.array([landmarks[308].x * w, landmarks[308].y * h])
    p_13 = np.array([landmarks[13].x * w, landmarks[13].y * h])
    p_14 = np.array([landmarks[14].x * w, landmarks[14].y * h])
    
    dist_v = get_distance(p_13, p_14)
    dist_h = get_distance(p_78, p_308)
    
    if dist_h == 0:
        return 0.0
    return dist_v / dist_h

def draw_overlay(img, x, y, w, h, color, alpha=0.5):
    """Draws a semi-transparent card background."""
    overlay = img.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), color, -1)
    cv2.addWeighted(overlay, alpha, img, 1.0 - alpha, 0, img)

def draw_progress_bar(img, x, y, w, h, val, max_val, label, bar_color, bg_color=(40, 40, 40)):
    """Draws a premium styled progress bar."""
    cv2.putText(img, label, (x, y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1, cv2.LINE_AA)
    # BG Bar
    cv2.rectangle(img, (x, y), (x + w, y + h), bg_color, -1)
    # Fill Bar
    fill_w = int((val / max_val) * w)
    fill_w = max(0, min(fill_w, w))
    cv2.rectangle(img, (x, y), (x + fill_w, y + h), bar_color, -1)
    # Border
    cv2.rectangle(img, (x, y), (x + w, y + h), (100, 100, 100), 1)

def draw_contour(image, landmarks, indices, color, w, h, is_closed=True):
    """Draws connected contour lines between landmarks using OpenCV polylines."""
    points = []
    for idx in indices:
        if idx < len(landmarks):
            pt = landmarks[idx]
            points.append((int(pt.x * w), int(pt.y * h)))
    if points:
        points = np.array(points, dtype=np.int32)
        cv2.polylines(image, [points], is_closed, color, 1, cv2.LINE_AA)

def main():
    global EAR_THRESHOLD, YAW_THRESHOLD, PITCH_THRESHOLD
    
    # Initialize Camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not access the webcam.", flush=True)
        return

    print("Camera initialized.", flush=True)

    # Initialize MediaPipe Face Landmarker via Tasks API
    print("Initializing MediaPipe Face Landmarker...", flush=True)
    base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        num_faces=1,
        running_mode=vision.RunningMode.VIDEO
    )
    detector = vision.FaceLandmarker.create_from_options(options)
    print("MediaPipe Face Landmarker initialized.", flush=True)

    # State variables for warning timers
    drowsy_start_time = None
    yawn_start_time = None
    distract_start_time = None
    
    is_drowsy_alert = False
    is_yawn_alert = False
    is_distract_alert = False

    # API tracking variables
    total_yawns = 0
    was_yawning = False
    was_eyes_closed = False
    blink_history = []
    
    print("Starting API Server...", flush=True)
    start_api_server()

    # Voice alert rate limit timers
    last_drowsy_voice_time = 0.0
    last_distract_voice_time = 0.0
    last_yawn_voice_time = 0.0

    # Calibration variables
    is_calibrating = False
    calibration_frames = 0
    calibration_ear_sum = 0.0
    calibration_yaw_sum = 0.0
    calibration_pitch_sum = 0.0
    
    baseline_ear = 0.28
    baseline_yaw = 0.0
    baseline_pitch = 0.0
    calibrated = False

    print("\n=========================================", flush=True)
    print("      Driver Monitoring System (DMS)     ", flush=True)
    print("=========================================", flush=True)
    print("Controls:", flush=True)
    print("  Press 'c' to Calibrate baseline face pose.", flush=True)
    print("  Press 'q' to Quit the program.", flush=True)
    print("=========================================\n", flush=True)

    # Speak introductory notification
    speak("Driver monitoring system active.")

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("Ignoring empty camera frame. (Please ensure webcam is connected and not in use)", flush=True)
            continue
        
        # Mirror image for natural user preview
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Perform detection
        timestamp_ms = int(time.time() * 1000)
        result = detector.detect_for_video(mp_image, timestamp_ms)
        
        # HUD overlay defaults
        status_text = "STATUS: ACTIVE"
        status_color = (0, 200, 0) # Green
        api_new_alert = None
        
        if result.face_landmarks:
            face_landmarks = result.face_landmarks[0]
            
            # --- Draw Premium HUD Face Contours manually ---
            # Face silhouette
            draw_contour(frame, face_landmarks, [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109], (200, 200, 200), w, h, is_closed=True)
            # Left Eye
            draw_contour(frame, face_landmarks, [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398], (0, 255, 0), w, h, is_closed=True)
            # Right Eye
            draw_contour(frame, face_landmarks, [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], (0, 255, 0), w, h, is_closed=True)
            # Inner Lips
            draw_contour(frame, face_landmarks, [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95], (0, 255, 255), w, h, is_closed=True)
            # Eyebrows
            draw_contour(frame, face_landmarks, [276, 283, 282, 295, 285, 300, 293, 334, 296, 336], (150, 150, 150), w, h, is_closed=False)
            draw_contour(frame, face_landmarks, [46, 53, 52, 65, 55, 70, 63, 105, 66, 107], (150, 150, 150), w, h, is_closed=False)
            
            # --- 1. Compute EAR (Eye Openness) ---
            ear_l = calculate_ear(face_landmarks, LEFT_EYE_INDICES, w, h)
            ear_r = calculate_ear(face_landmarks, RIGHT_EYE_INDICES, w, h)
            avg_ear = (ear_l + ear_r) / 2.0
            
            # --- 2. Compute MAR (Mouth Openness) ---
            mar = calculate_mar(face_landmarks, w, h)
            
            # --- 3. Compute Head Pose (Distraction) ---
            # Extract key landmarks for solvePnP
            p_nose = face_landmarks[1]
            p_chin = face_landmarks[152]
            p_reye = face_landmarks[33]
            p_leye = face_landmarks[263]
            p_rmouth = face_landmarks[61]
            p_lmouth = face_landmarks[291]
            
            image_points = np.array([
                (p_nose.x * w, p_nose.y * h),
                (p_chin.x * w, p_chin.y * h),
                (p_reye.x * w, p_reye.y * h),
                (p_leye.x * w, p_leye.y * h),
                (p_rmouth.x * w, p_rmouth.y * h),
                (p_lmouth.x * w, p_lmouth.y * h)
            ], dtype=np.float32)
            
            # Approximate camera intrinsic matrix
            focal_length = w
            center = (w / 2.0, h / 2.0)
            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float32)
            dist_coeffs = np.zeros((4, 1))
            
            success_pnp, rvec, tvec = cv2.solvePnP(
                MODEL_POINTS, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
            )
            
            yaw, pitch, roll = 0.0, 0.0, 0.0
            if success_pnp:
                # Get rotation matrix from vector
                rmat, _ = cv2.Rodrigues(rvec)
                proj_matrix = np.hstack((rmat, tvec))
                # Decompose projection matrix to extract angles
                euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)[6]
                pitch = euler_angles[0, 0]
                yaw = euler_angles[1, 0]
                roll = euler_angles[2, 0]
                
                # --- Normalize Pitch ---
                # Since standard model Y-axis points up, pitch is returned around -180 deg.
                # Adding/subtracting 180 normalizes it to ~0 deg when looking straight forward.
                if pitch < 0:
                    pitch = pitch + 180.0
                else:
                    pitch = pitch - 180.0
                
                # Apply calibration adjustment if calibrated
                adj_yaw = yaw - baseline_yaw
                adj_pitch = pitch - baseline_pitch
                
                # Draw 3D Nose Axis
                axis_3d = np.array([
                    (100.0, 0.0, 0.0),  # X axis (Red)
                    (0.0, 100.0, 0.0),  # Y axis (Green)
                    (0.0, 0.0, 100.0)   # Z axis (Blue)
                ], dtype=np.float32)
                
                img_pts, _ = cv2.projectPoints(axis_3d, rvec, tvec, camera_matrix, dist_coeffs)
                pt_nose_2d = (int(image_points[0][0]), int(image_points[0][1]))
                pt_x_2d = (int(img_pts[0][0][0]), int(img_pts[0][0][1]))
                pt_y_2d = (int(img_pts[1][0][0]), int(img_pts[1][0][1]))
                pt_z_2d = (int(img_pts[2][0][0]), int(img_pts[2][0][1]))
                
                # Draw X, Y, Z coordinates vector
                cv2.line(frame, pt_nose_2d, pt_x_2d, (0, 0, 255), 2)  # Red: Yaw
                cv2.line(frame, pt_nose_2d, pt_y_2d, (0, 255, 0), 2)  # Green: Pitch
                cv2.line(frame, pt_nose_2d, pt_z_2d, (255, 0, 0), 2)  # Blue: Roll
            else:
                adj_yaw = yaw
                adj_pitch = pitch
            
            # --- Calibration Logic ---
            if is_calibrating:
                calibration_frames += 1
                calibration_ear_sum += avg_ear
                calibration_yaw_sum += yaw
                calibration_pitch_sum += pitch
                
                # Draw calibration overlay progress
                draw_overlay(frame, 50, h // 2 - 40, w - 100, 80, (0, 0, 0), 0.7)
                progress = int((calibration_frames / 60) * 100)
                cv2.putText(frame, f"CALIBRATING BASELINE: {progress}%", (80, h // 2 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2, cv2.LINE_AA)
                cv2.putText(frame, "Please look straight and keep eyes open.", (80, h // 2 + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
                
                if calibration_frames >= 60:
                    baseline_ear = calibration_ear_sum / 60.0
                    baseline_yaw = calibration_yaw_sum / 60.0
                    baseline_pitch = calibration_pitch_sum / 60.0
                    
                    # Adaptively set EAR threshold based on user's baseline
                    EAR_THRESHOLD = max(0.16, min(baseline_ear * 0.75, 0.23))
                    
                    is_calibrating = False
                    calibrated = True
                    speak("Calibration complete.")
                    print(f"[Calibrated] Baseline EAR: {baseline_ear:.3f} | Threshold Set: {EAR_THRESHOLD:.3f}", flush=True)
                    print(f"[Calibrated] Yaw Offset: {baseline_yaw:.1f} | Pitch Offset: {baseline_pitch:.1f}", flush=True)
                
                # Pause evaluation during calibration
                drowsy_start_time = None
                yawn_start_time = None
                distract_start_time = None
                
            else:
                # --- Evaluation & Alerts ---
                
                # 1. Drowsiness Evaluation
                if avg_ear < EAR_THRESHOLD:
                    if drowsy_start_time is None:
                        drowsy_start_time = time.time()
                    elif time.time() - drowsy_start_time > DROWSY_TIME_LIMIT:
                        is_drowsy_alert = True
                else:
                    drowsy_start_time = None
                    is_drowsy_alert = False
                
                # 2. Distraction Evaluation
                if abs(adj_yaw) > YAW_THRESHOLD or abs(adj_pitch) > PITCH_THRESHOLD:
                    if distract_start_time is None:
                        distract_start_time = time.time()
                    elif time.time() - distract_start_time > DISTRACT_TIME_LIMIT:
                        is_distract_alert = True
                else:
                    distract_start_time = None
                    is_distract_alert = False

                # 3. Yawning Evaluation
                if mar > MAR_THRESHOLD:
                    if yawn_start_time is None:
                        yawn_start_time = time.time()
                    elif time.time() - yawn_start_time > YAWN_TIME_LIMIT:
                        is_yawn_alert = True
                else:
                    yawn_start_time = None
                    is_yawn_alert = False

            # --- HUD Sidebar Panels (Metrics display) ---
            # Draw overlay card for telemetry data
            draw_overlay(frame, 15, 60, 220, 200, (20, 20, 20), 0.75)
            
            # Text metrics
            cv2.putText(frame, "TELEMETRY METRICS", (25, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
            cv2.line(frame, (25, 87), (215, 87), (60, 60, 60), 1)
            
            # EAR Gauge
            ear_color = (0, 255, 0) if avg_ear >= EAR_THRESHOLD else (0, 0, 255)
            draw_progress_bar(frame, 25, 115, 200, 12, avg_ear, 0.4, f"EAR: {avg_ear:.3f} (Limit: {EAR_THRESHOLD:.2f})", ear_color)
            
            # MAR Gauge
            mar_color = (0, 255, 0) if mar <= MAR_THRESHOLD else (0, 165, 255)
            draw_progress_bar(frame, 25, 160, 200, 12, mar, 1.0, f"MAR: {mar:.3f} (Limit: {MAR_THRESHOLD:.2f})", mar_color)
            
            # Head Pose Text (display normalized values)
            cv2.putText(frame, f"Yaw:   {adj_yaw:+.1f} deg", (25, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1, cv2.LINE_AA)
            cv2.putText(frame, f"Pitch: {adj_pitch:+.1f} deg", (25, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1, cv2.LINE_AA)
            
            # --- Alert Styling & Voice Assistant rate-limiting ---
            current_time = time.time()
            if is_drowsy_alert:
                status_text = "WARNING: DROWSINESS DETECTED"
                status_color = (0, 0, 255) # Bright Red
                
                # Speak warning every 4 seconds
                if current_time - last_drowsy_voice_time > 4.0:
                    speak("Drowsiness warning. Please stay alert.")
                    api_new_alert = {"time": time.strftime("%H:%M:%S"), "type": "danger", "message": "Drowsiness warning. Please stay alert."}
                    last_drowsy_voice_time = current_time
                
                # Full frame red flashing border
                if int(current_time * 4) % 2 == 0:
                    cv2.rectangle(frame, (0, 0), (w, h), (0, 0, 255), 12)
                    draw_overlay(frame, w // 2 - 160, h - 80, 320, 50, (0, 0, 255), 0.8)
                    cv2.putText(frame, "DROWSY WARNING! WAKE UP!", (w // 2 - 135, h - 50),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
                    
            elif is_distract_alert:
                status_text = "WARNING: DRIVER DISTRACTED"
                status_color = (0, 100, 255) # Orange
                
                # Speak warning every 4 seconds
                if current_time - last_distract_voice_time > 4.0:
                    speak("Please look at the road.")
                    api_new_alert = {"time": time.strftime("%H:%M:%S"), "type": "warning", "message": "Driver distracted. Look at the road."}
                    last_distract_voice_time = current_time
                
                # Full frame orange flashing border
                if int(current_time * 3) % 2 == 0:
                    cv2.rectangle(frame, (0, 0), (w, h), (0, 100, 255), 12)
                    draw_overlay(frame, w // 2 - 160, h - 80, 320, 50, (0, 100, 255), 0.8)
                    cv2.putText(frame, "DISTRACTED! LOOK AT ROAD!", (w // 2 - 138, h - 50),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
                    
            elif is_yawn_alert:
                status_text = "ALERT: DRIVER YAWNING"
                status_color = (0, 255, 255) # Yellow
                
                # Speak warning once every 10 seconds
                if current_time - last_yawn_voice_time > 10.0:
                    speak("Yawn detected. Consider taking a rest.")
                    api_new_alert = {"time": time.strftime("%H:%M:%S"), "type": "info", "message": "Yawn detected. Consider taking a rest."}
                    last_yawn_voice_time = current_time
                
                # Draw small status bar alert
                draw_overlay(frame, w // 2 - 130, h - 70, 260, 40, (0, 165, 255), 0.7)
                cv2.putText(frame, "YAWN DETECTED", (w // 2 - 70, h - 45),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)
            
            # --- API Metric Tracking ---
            eyes_open_now = avg_ear >= EAR_THRESHOLD
            
            # Track blinks
            if was_eyes_closed and eyes_open_now:
                blink_history.append(current_time)
            was_eyes_closed = not eyes_open_now
            
            # Clean up blinks older than 60s to get blinks per minute
            blink_history = [t for t in blink_history if current_time - t <= 60.0]
            current_blink_rate = len(blink_history)
            
            # Track yawns
            is_yawning_now = mar > MAR_THRESHOLD
            if is_yawning_now and not was_yawning:
                total_yawns += 1
            was_yawning = is_yawning_now
            
            # Calculate scales (0-100)
            if avg_ear >= baseline_ear:
                drowsiness_level = 0
            else:
                drowsiness_level = min(100, max(0, ((baseline_ear - avg_ear) / (baseline_ear - EAR_THRESHOLD)) * 65))
                
            yaw_penalty = min(50, abs(adj_yaw) / YAW_THRESHOLD * 50)
            pitch_penalty = min(50, abs(adj_pitch) / PITCH_THRESHOLD * 50)
            attention_score = int(max(0, 100 - (yaw_penalty + pitch_penalty)))
            
            api_face_detected = True
            # Derive phone active state (more sensitive: tilted head down OR low attention score)
            phone_active = True if (adj_pitch < -3.5 or attention_score < 65) else False

            api_status = "DROWSY" if is_drowsy_alert else "DISTRACTED" if (is_distract_alert or phone_active) else "WARNING" if (drowsiness_level > 40 or attention_score < 70) else "SAFE"
            api_safety_score = max(0, 100 - (drowsiness_level * 0.5) - ((100 - attention_score) * 0.3))
            
            # Derive stress level from drowsiness and distraction
            derived_stress = max(10, min(95, int(drowsiness_level * 0.6 + (100 - attention_score) * 0.4 + 10)))

            # Smile detection (Happiness emotion) using inner mouth and mouth corners
            p_13 = face_landmarks[13]
            p_14 = face_landmarks[14]
            p_61 = face_landmarks[61]
            p_291 = face_landmarks[291]
            smile_metric = ((p_13.y + p_14.y) / 2.0) - ((p_61.y + p_291.y) / 2.0)

            # Determine emotion
            if smile_metric > 0.010: # threshold for smile
                emotion_state = "HAPPY"
            elif drowsiness_level > 65:
                emotion_state = "TIRED"
            elif attention_score < 60:
                emotion_state = "DISTRACTED"
            else:
                emotion_state = "NEUTRAL"

            update_driver_state(
                status=api_status,
                drowsiness_level=int(drowsiness_level),
                attention_score=attention_score,
                blink_rate=current_blink_rate,
                eyes_open=eyes_open_now,
                yawn_count=total_yawns,
                safety_score=int(api_safety_score),
                face_detected=api_face_detected,
                pitch=float(adj_pitch),
                yaw=float(adj_yaw),
                roll=float(roll),
                stress_level=float(derived_stress),
                phone_detected=phone_active,
                accident_detected=False,
                emotion=emotion_state,
                new_alert=api_new_alert
            )

        else:
            # Face not detected
            status_text = "STATUS: NO FACE DETECTED"
            status_color = (0, 120, 255) # Amber/Light Orange
            
            # Reset alert timers
            drowsy_start_time = None
            yawn_start_time = None
            distract_start_time = None
            is_drowsy_alert = False
            is_yawn_alert = False
            is_distract_alert = False
            
            # Big Warning in Center
            draw_overlay(frame, w // 2 - 160, h // 2 - 30, 320, 60, (0, 0, 0), 0.6)
            cv2.putText(frame, "FACE OUT OF FRAME", (w // 2 - 110, h // 2 + 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2, cv2.LINE_AA)
            
            # API Update when no face
            update_driver_state(
                status="DISTRACTED",
                drowsiness_level=0,
                attention_score=0,
                blink_rate=0,
                eyes_open=False,
                yawn_count=total_yawns if 'total_yawns' in locals() else 0,
                safety_score=0,
                face_detected=False,
                pitch=0.0,
                yaw=0.0,
                roll=0.0,
                stress_level=0.0,
                phone_detected=False,
                accident_detected=False,
                emotion="NEUTRAL"
            )

        # --- Top HUD Header Bar ---
        draw_overlay(frame, 0, 0, w, 45, (15, 15, 15), 0.8)
        cv2.putText(frame, "AI DRIVER MONITORING SYSTEM", (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Draw status pill
        pill_w = 260 if "WARNING" in status_text else 220
        draw_overlay(frame, w - pill_w - 15, 8, pill_w, 28, status_color, 0.9)
        cv2.putText(frame, status_text, (w - pill_w - 5, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

        # Calibration Prompt (if not calibrated)
        if not calibrated and not is_calibrating:
            draw_overlay(frame, w - 240, h - 50, 225, 35, (10, 10, 10), 0.7)
            cv2.putText(frame, "Press 'C' to Calibrate Face", (w - 225, h - 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1, cv2.LINE_AA)
        elif calibrated:
            draw_overlay(frame, w - 170, h - 50, 155, 35, (10, 10, 10), 0.7)
            cv2.putText(frame, "Calibrated [Recal: C]", (w - 155, h - 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1, cv2.LINE_AA)

        # Display Frame
        cv2.imshow("AI Driver Monitoring System - HUD View", frame)
        
        # Key handlers
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            is_calibrating = True
            calibration_frames = 0
            calibration_ear_sum = 0.0
            calibration_yaw_sum = 0.0
            calibration_pitch_sum = 0.0

    # Cleanup
    detector.close()
    cap.release()
    cv2.destroyAllWindows()
    print("Application closed gracefully.", flush=True)

if __name__ == "__main__":
    main()
