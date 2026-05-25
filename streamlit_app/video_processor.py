"""
AI Video Processor — MediaPipe 0.10+ Tasks API version
────────────────────────────────────────────────────────
Uses:
  - mediapipe.tasks.python.vision.FaceLandmarker  (new Tasks API)
  - OpenCV for frame capture and HUD drawing
  - face_landmarker.task model already in the project root

Features:
  - Eye Aspect Ratio (EAR) → Drowsiness detection
  - Mouth Aspect Ratio (MAR) → Yawn detection
  - Head Pose (SolvePnP Yaw/Pitch) → Distraction detection
  - Fatigue, Attention, Safety Scores
  - Cyberpunk HUD overlay
"""

import cv2
import numpy as np
import time
import os
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

# ── Model path ────────────────────────────────────────────────────────────────
# face_landmarker.task sits in the project root (one level above streamlit_app/)
_HERE       = os.path.dirname(os.path.abspath(__file__))
_MODEL_PATH = os.path.join(_HERE, "..", "face_landmarker.task")

# ── Landmark indices (MediaPipe 478-landmark face mesh) ───────────────────────
LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]

# Mouth vertical / horizontal points
MOUTH_TOP    = 13
MOUTH_BOTTOM = 14
MOUTH_LEFT   = 78
MOUTH_RIGHT  = 308
MOUTH_V1, MOUTH_V2 = 82, 87
MOUTH_V3, MOUTH_V4 = 312, 317

# Head-pose reference indices (nose, L-eye, R-eye, L-mouth, R-mouth, chin)
HEAD_POSE_IDX = [1, 33, 263, 61, 291, 199]

# ── Thresholds ────────────────────────────────────────────────────────────────
EAR_THRESHOLD     = 0.22
EAR_CONSEC_FRAMES = 15
MAR_THRESHOLD     = 0.52
MAR_CONSEC_FRAMES = 20
YAW_THRESHOLD     = 25.0
PITCH_THRESHOLD   = 20.0

# ── BGR draw colours ──────────────────────────────────────────────────────────
C_SAFE   = (0, 255, 136)
C_WARN   = (0, 165, 255)
C_CRIT   = (0, 50,  255)
C_CYAN   = (255, 210, 0)
C_PURPLE = (200, 50,  255)


# ══════════════════════════════════════════════════════════════════════════════
# Geometry helpers
# ══════════════════════════════════════════════════════════════════════════════
def _lm_xy(landmarks, idx, w, h):
    """Return pixel (x, y) for a single landmark index."""
    lm = landmarks[idx]
    return np.array([lm.x * w, lm.y * h])


def _ear(landmarks, indices, w, h):
    """Eye Aspect Ratio = (v1 + v2) / (2 * horizontal)."""
    pts = np.array([_lm_xy(landmarks, i, w, h) for i in indices])
    v1  = np.linalg.norm(pts[1] - pts[5])
    v2  = np.linalg.norm(pts[2] - pts[4])
    hz  = np.linalg.norm(pts[0] - pts[3]) + 1e-6
    return (v1 + v2) / (2.0 * hz)


def _mar(landmarks, w, h):
    """Mouth Aspect Ratio — average of 3 vertical distances / horizontal."""
    p  = lambda i: _lm_xy(landmarks, i, w, h)
    v1 = np.linalg.norm(p(MOUTH_TOP)    - p(MOUTH_BOTTOM))
    v2 = np.linalg.norm(p(MOUTH_V1)     - p(MOUTH_V4))
    v3 = np.linalg.norm(p(MOUTH_V2)     - p(MOUTH_V3))
    hz = np.linalg.norm(p(MOUTH_LEFT)   - p(MOUTH_RIGHT)) + 1e-6
    return (v1 + v2 + v3) / (3.0 * hz)


def _head_pose(landmarks, w, h):
    """SolvePnP yaw & pitch from 6 facial landmarks. Returns (yaw°, pitch°)."""
    model_3d = np.array([
        [ 0.0,   0.0,   0.0 ],   # nose tip
        [-30.0, -30.0, -30.0],   # L eye corner
        [ 30.0, -30.0, -30.0],   # R eye corner
        [-25.0,  30.0, -30.0],   # L mouth corner
        [ 25.0,  30.0, -30.0],   # R mouth corner
        [ 0.0,   75.0, -50.0],   # chin
    ], dtype=np.float64)

    img_pts = np.array([
        _lm_xy(landmarks, i, w, h) for i in HEAD_POSE_IDX
    ], dtype=np.float64)

    focal  = float(w)
    cam    = np.array([[focal,0,w/2],[0,focal,h/2],[0,0,1]], dtype=np.float64)
    dist   = np.zeros((4,1))
    ok, rv, tv = cv2.solvePnP(model_3d, img_pts, cam, dist,
                               flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return 0.0, 0.0
    rmat, _ = cv2.Rodrigues(rv)
    angles, *_ = cv2.RQDecomp3x3(rmat)
    return angles[1] * 10, angles[0] * 10   # yaw, pitch


# ══════════════════════════════════════════════════════════════════════════════
# HUD drawing
# ══════════════════════════════════════════════════════════════════════════════
def _corner(frame, origin, pos, color, size=20, t=2):
    x, y = origin
    pts  = {
        "tl": [(x,y+size),(x,y),(x+size,y)],
        "tr": [(x-size,y),(x,y),(x,y+size)],
        "bl": [(x,y-size),(x,y),(x+size,y)],
        "br": [(x-size,y),(x,y),(x,y-size)],
    }[pos]
    for i in range(len(pts)-1):
        cv2.line(frame, pts[i], pts[i+1], color, t, cv2.LINE_AA)


def _draw_hud(frame, tel, w, h):
    ear    = tel.get("ear", 0.3)
    mar    = tel.get("mar", 0.1)
    yaw    = tel.get("yaw", 0.0)
    pitch  = tel.get("pitch", 0.0)
    fat    = tel.get("fatigue_score", 0.0)
    alert  = tel.get("current_alert", "")

    # top bar
    ov = frame.copy()
    cv2.rectangle(ov, (0,0), (w,44), (0,0,0), -1)
    cv2.addWeighted(ov, 0.55, frame, 0.45, 0, frame)
    cv2.putText(frame, "AI-DMS  v2.0", (10,28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, C_CYAN, 1, cv2.LINE_AA)
    cv2.putText(frame, f"FPS:{tel.get('fps',0):.0f}", (w-90,28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, C_CYAN, 1, cv2.LINE_AA)

    # bottom metrics
    ear_c = C_SAFE if ear >= EAR_THRESHOLD else C_CRIT
    mar_c = C_WARN if mar > MAR_THRESHOLD  else C_SAFE
    pose_c = C_SAFE if (abs(yaw)<YAW_THRESHOLD and abs(pitch)<PITCH_THRESHOLD) else C_WARN

    cv2.putText(frame, f"EAR:{ear:.3f}", (10,h-80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, ear_c,  1, cv2.LINE_AA)
    cv2.putText(frame, f"MAR:{mar:.3f}", (10,h-60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, mar_c,  1, cv2.LINE_AA)
    cv2.putText(frame, f"YAW:{yaw:+.1f} PITCH:{pitch:+.1f}", (10,h-40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, pose_c, 1, cv2.LINE_AA)

    # fatigue bar
    bw = 150; bx = w-bw-10; by = h-30
    cv2.rectangle(frame, (bx,by), (bx+bw,by+14), (30,30,30), -1)
    fill = int(bw * fat/100)
    bc   = C_SAFE if fat<40 else (C_WARN if fat<70 else C_CRIT)
    cv2.rectangle(frame, (bx,by), (bx+fill,by+14), bc, -1)
    cv2.rectangle(frame, (bx,by), (bx+bw,by+14),  (60,60,80), 1)
    cv2.putText(frame, f"FATIGUE {fat:.0f}%", (bx,by-5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, bc, 1, cv2.LINE_AA)

    # flashing alert
    if alert and int(time.time()) % 2 == 0:
        ts, _ = cv2.getTextSize(alert, cv2.FONT_HERSHEY_SIMPLEX, 0.85, 2)
        tx = (w-ts[0])//2
        cv2.rectangle(frame, (tx-12,h//2-38), (tx+ts[0]+12,h//2+8), (0,0,160), -1)
        cv2.putText(frame, alert, (tx,h//2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255,255,255), 2, cv2.LINE_AA)

    # corner brackets
    _corner(frame, (0,44),  "tl", C_CYAN)
    _corner(frame, (w,44),  "tr", C_CYAN)
    _corner(frame, (0,h),   "bl", C_PURPLE)
    _corner(frame, (w,h),   "br", C_PURPLE)


# ══════════════════════════════════════════════════════════════════════════════
# VideoProcessor
# ══════════════════════════════════════════════════════════════════════════════
class VideoProcessor:
    """
    Real-time AI driver monitoring using MediaPipe FaceLandmarker (Tasks API).
    Call process_frame(bgr_frame) every camera tick.
    """

    def __init__(self):
        # ── Build FaceLandmarker ───────────────────────────────────────────
        base_opts = mp_python.BaseOptions(model_asset_path=_MODEL_PATH)
        opts = mp_vision.FaceLandmarkerOptions(
            base_options=base_opts,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
            min_face_detection_confidence=0.55,
            min_face_presence_confidence=0.55,
            min_tracking_confidence=0.55,
            running_mode=mp_vision.RunningMode.IMAGE,   # synchronous per-frame
        )
        self.detector = mp_vision.FaceLandmarker.create_from_options(opts)

        # ── State ──────────────────────────────────────────────────────────
        self.ear_consec      = 0
        self.mar_consec      = 0
        self.blink_count     = 0
        self.yawn_count      = 0
        self.session_start   = time.time()
        self.last_t          = time.time()
        self.fps             = 0.0
        self.current_alert   = ""
        self.alerts          = []
        self.safety_score    = 100.0
        self.night_mode      = False

        # Smoothed signals
        self._ear   = 0.30
        self._mar   = 0.10
        self._yaw   = 0.0
        self._pitch = 0.0
        self._fat   = 0.0
        self._att   = 100.0
        self._drift = 0.0

        self._emotion_timer = time.time()

    # ── Public API ────────────────────────────────────────────────────────
    def process_frame(self, bgr: np.ndarray):
        """
        Process one BGR camera frame.
        Returns: (rgb_annotated_frame, telemetry_dict)
        """
        if bgr is None or bgr.size == 0:
            return None, {}

        now = time.time()
        dt  = max(now - self.last_t, 1e-6)
        self.fps = 0.9 * self.fps + 0.1 / dt
        self.last_t = now

        h, w = bgr.shape[:2]

        # Night-mode brightness boost
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        self.night_mode = gray.mean() < 60
        if self.night_mode:
            bgr = cv2.convertScaleAbs(bgr, alpha=1.6, beta=30)

        # Convert to RGB for MediaPipe
        rgb  = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        result       = self.detector.detect(mp_img)
        face_detected = bool(result.face_landmarks)

        ear, mar, yaw, pitch = self._ear, self._mar, self._yaw, self._pitch

        if face_detected:
            lm = result.face_landmarks[0]   # list of NormalizedLandmark

            # ── Draw a simple dot mesh so face is visible ──────────────────
            for lmk in lm:
                px = int(lmk.x * w)
                py = int(lmk.y * h)
                cv2.circle(bgr, (px, py), 1, (0, 210, 255), -1)

            # ── EAR / MAR / Pose ───────────────────────────────────────────
            raw_ear  = (_ear(lm, LEFT_EYE,  w, h) + _ear(lm, RIGHT_EYE, w, h)) / 2
            raw_mar  = _mar(lm, w, h)
            raw_yaw, raw_pitch = _head_pose(lm, w, h)

            # Exponential smoothing
            a = 0.25
            self._ear   = a * raw_ear   + (1-a) * self._ear
            self._mar   = a * raw_mar   + (1-a) * self._mar
            self._yaw   = a * raw_yaw   + (1-a) * self._yaw
            self._pitch = a * raw_pitch + (1-a) * self._pitch

            ear, mar, yaw, pitch = self._ear, self._mar, self._yaw, self._pitch

            # ── Drowsiness ────────────────────────────────────────────────
            if ear < EAR_THRESHOLD:
                self.ear_consec += 1
                if self.ear_consec == EAR_CONSEC_FRAMES:
                    self.blink_count += 1
                if self.ear_consec >= EAR_CONSEC_FRAMES + 10:
                    self.current_alert = "⚠ DROWSY — WAKE UP!"
                    self._log("DROWSINESS", "Prolonged eye closure", "CRITICAL")
                    self.safety_score = max(0, self.safety_score - 0.3)
            else:
                self.ear_consec = 0
                if self.current_alert == "⚠ DROWSY — WAKE UP!":
                    self.current_alert = ""

            # ── Yawning ──────────────────────────────────────────────────
            if mar > MAR_THRESHOLD:
                self.mar_consec += 1
                if self.mar_consec == MAR_CONSEC_FRAMES:
                    self.yawn_count += 1
                    self.current_alert = "⚠ YAWNING DETECTED"
                    self._log("YAWNING", "Yawn detected — consider a break", "WARNING")
                    self.safety_score = max(0, self.safety_score - 0.5)
            else:
                self.mar_consec = 0
                if self.current_alert == "⚠ YAWNING DETECTED":
                    self.current_alert = ""

            # ── Distraction ───────────────────────────────────────────────
            if abs(yaw) > YAW_THRESHOLD or abs(pitch) > PITCH_THRESHOLD:
                self.current_alert = "⚠ EYES ON ROAD!"
                self._log("DISTRACTED", f"Head turned Yaw={yaw:.1f}° Pitch={pitch:.1f}°", "WARNING")
                self.safety_score = max(0, self.safety_score - 0.1)
        else:
            self.current_alert = "⚠ DRIVER NOT VISIBLE"

        # ── Derived scores ─────────────────────────────────────────────────
        ear_factor  = max(0, (EAR_THRESHOLD - ear) / EAR_THRESHOLD) * 60
        yawn_factor = min(40, self.yawn_count * 5)
        raw_fat     = min(100, ear_factor + yawn_factor)
        self._fat   = 0.95 * self._fat + 0.05 * raw_fat

        pose_pen = min(50, abs(yaw)/YAW_THRESHOLD*25 + abs(pitch)/PITCH_THRESHOLD*25)
        raw_att  = max(0, 100 - self._fat * 0.5 - pose_pen)
        self._att = 0.92 * self._att + 0.08 * raw_att

        # Steering drift simulation
        drift_amp  = (self._fat / 100) * 12.0
        self._drift = self._drift * 0.9 + np.random.uniform(-drift_amp, drift_amp) * 0.1

        # Slow safety recovery when calm
        if not self.current_alert and face_detected:
            self.safety_score = min(100, self.safety_score + 0.02)

        # Emotion / stress
        emotion = self._emotion()
        stress  = "HIGH" if (self._fat>65 or self.safety_score<60) else \
                  "MEDIUM" if (self._fat>35 or self.safety_score<80) else "LOW"
        fat_lvl = "SAFE" if self._fat<40 else ("WARNING" if self._fat<70 else "CRITICAL")

        telemetry = {
            "ear":             ear,
            "mar":             mar,
            "yaw":             yaw,
            "pitch":           pitch,
            "fatigue_score":   self._fat,
            "fatigue_level":   fat_lvl,
            "attention_score": self._att,
            "blink_count":     self.blink_count,
            "yawn_count":      self.yawn_count,
            "safety_score":    self.safety_score,
            "current_alert":   self.current_alert,
            "fps":             self.fps,
            "session_duration":int(now - self.session_start),
            "night_mode":      self.night_mode,
            "emotion":         emotion,
            "stress_level":    stress,
            "steering_angle":  self._drift,
            "face_detected":   face_detected,
        }

        _draw_hud(bgr, telemetry, w, h)
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), telemetry

    # ── Helpers ────────────────────────────────────────────────────────────
    def _emotion(self):
        f, a = self._fat, self._att
        if f > 60: return "TIRED"
        if f > 30: return "DROWSY"
        if a > 80: return "FOCUSED"
        if a > 55: return "NEUTRAL"
        return "DISTRACTED"

    def _log(self, atype, msg, level):
        """Append alert, suppressing duplicates within 5 s."""
        now = time.time()
        if self.alerts:
            last = self.alerts[-1]
            if last.get("type") == atype and (now - last.get("_ts", 0)) < 5:
                return
        self.alerts.append({
            "time":    time.strftime("%H:%M:%S"),
            "type":    atype,
            "message": msg,
            "level":   level,
            "_ts":     now,
        })

    def get_alerts(self):
        return self.alerts

    def release(self):
        self.detector.close()
