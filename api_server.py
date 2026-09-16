"""
api_server.py  –  Add this to your project or merge into driver_monitor.py
Runs a simple Flask server that the Next.js frontend polls every second.

Install: pip install flask flask-cors
Run:     python api_server.py
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time

app = Flask(__name__)
CORS(app)  # Allow frontend (localhost:3000) to fetch from here

# Import alert module (graceful fallback if twilio not installed)
try:
    from emergency_alerts import send_family_sms, reset_alert_state
    ALERTS_AVAILABLE = True
except ImportError:
    ALERTS_AVAILABLE = False
    def send_family_sms(**kwargs): return {"success": False, "reason": "module_not_found"}
    def reset_alert_state(): pass

# ── Shared state (updated by your driver_monitor.py loop) ─────────
state_lock = threading.Lock()

driver_state = {
    "status": "SAFE",              # "SAFE" | "WARNING" | "DROWSY" | "DISTRACTED"
    "drowsiness_level": 0,         # 0–100
    "attention_score": 100,        # 0–100
    "blink_rate": 15,              # blinks per minute
    "eyes_open": True,
    "yawn_count": 0,
    "safety_score": 100,           # 0–100
    "face_detected": False,
    "session_seconds": 0,
    "alerts": [],                  # list of { time, type, message }
    "pitch": 0.0,
    "yaw": 0.0,
    "roll": 0.0,
    "stress_level": 15,            # 0-100
    "phone_detected": False,
    "accident_detected": False,
    "emotion": "NEUTRAL",          # "NEUTRAL" | "HAPPY" | "TIRED" | "DISTRACTED"
}

session_start = time.time()

# ── API endpoint ──────────────────────────────────────────────────
@app.route("/api/status", methods=["GET", "POST"])
def get_status():
    global session_start
    try:
        if request.method == "POST":
            data = request.get_json(force=True, silent=True) or {}
            with state_lock:
                if "status" in data:
                    driver_state["status"] = str(data["status"])
                if "drowsiness_level" in data or "drowsinessLevel" in data:
                    val = data.get("drowsiness_level", data.get("drowsinessLevel", 0))
                    driver_state["drowsiness_level"] = int(round(float(val)))
                if "attention_score" in data or "attentionScore" in data:
                    val = data.get("attention_score", data.get("attentionScore", 100))
                    driver_state["attention_score"] = int(round(float(val)))
                if "blink_rate" in data or "blinkRate" in data:
                    val = data.get("blink_rate", data.get("blinkRate", 15))
                    driver_state["blink_rate"] = int(round(float(val)))
                if "eyes_open" in data or "eyesOpen" in data:
                    driver_state["eyes_open"] = bool(data.get("eyes_open", data.get("eyesOpen", True)))
                if "yawn_count" in data or "yawnCount" in data:
                    driver_state["yawn_count"] = int(data.get("yawn_count", data.get("yawnCount", 0)))
                if "safety_score" in data or "safetyScore" in data:
                    val = data.get("safety_score", data.get("safetyScore", 100))
                    driver_state["safety_score"] = int(round(float(val)))
                if "face_detected" in data or "faceDetected" in data:
                    driver_state["face_detected"] = bool(data.get("face_detected", data.get("faceDetected", False)))
                if "pitch" in data:
                    driver_state["pitch"] = float(data["pitch"])
                if "yaw" in data:
                    driver_state["yaw"] = float(data["yaw"])
                if "roll" in data:
                    driver_state["roll"] = float(data["roll"])
                if "stress_level" in data or "stressLevel" in data:
                    val = data.get("stress_level", data.get("stressLevel", 15))
                    driver_state["stress_level"] = int(round(float(val)))
                if "phone_detected" in data or "phoneDetected" in data:
                    driver_state["phone_detected"] = bool(data.get("phone_detected", data.get("phoneDetected", False)))
                if "accident_detected" in data or "accidentDetected" in data:
                    driver_state["accident_detected"] = bool(data.get("accident_detected", data.get("accidentDetected", False)))
                if "emotion" in data:
                    driver_state["emotion"] = str(data["emotion"])
                if "new_alert" in data or "newAlert" in data:
                    alert = data.get("new_alert", data.get("newAlert"))
                    if alert and isinstance(alert, dict):
                        driver_state["alerts"].insert(0, alert)
                        driver_state["alerts"] = driver_state["alerts"][:50]

                driver_state["session_seconds"] = int(time.time() - session_start)
                return jsonify({"ok": True, "state": driver_state.copy()})

        with state_lock:
            driver_state["session_seconds"] = int(time.time() - session_start)
            return jsonify(driver_state.copy())
    except Exception as e:
        print(f"[API Error] /api/status error: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


@app.route("/api/emergency", methods=["POST"])
def trigger_emergency():
    """Called by frontend when crash is confirmed. Sends real SMS alerts."""
    body = request.get_json(force=True, silent=True) or {}
    lat          = body.get("lat", 0.0)
    lng          = body.get("lng", 0.0)
    family_phone = body.get("familyPhone", "").strip()
    family_name  = body.get("familyName",  "Family Member")

    # Fall back to .env FAMILY_PHONE if frontend didn't send one
    if not family_phone:
        import os
        family_phone = os.getenv("FAMILY_PHONE", "")
        print(f"[API] Using FAMILY_PHONE from .env: {family_phone}", flush=True)

    print(f"[API] /api/emergency called — lat={lat}, lng={lng}, to={family_name}", flush=True)

    # Only SMS to family member for now (hospital & police: coming later)
    results = send_family_sms(
        family_phone=family_phone,
        family_name=family_name,
        lat=lat,
        lng=lng,
    )

    # Also flag accident in shared driver state
    with state_lock:
        driver_state["accident_detected"] = True
        driver_state["alerts"].insert(0, {
            "time": time.strftime("%H:%M:%S"),
            "type": "danger",
            "message": "💥 CRASH DETECTED — Emergency alerts dispatched!"
        })

    return jsonify({"ok": True, "results": results})


@app.route("/api/reset-emergency", methods=["POST"])
def reset_emergency():
    """Resets the alert state so future crashes can trigger again."""
    with state_lock:
        driver_state["accident_detected"] = False
    reset_alert_state()
    return jsonify({"ok": True})

# ── Call this from your driver_monitor.py to update state ─────────
def update_driver_state(
    status: str,
    drowsiness_level: float,
    attention_score: float,
    blink_rate: float,
    eyes_open: bool,
    yawn_count: int,
    safety_score: float,
    face_detected: bool,
    pitch: float = 0.0,
    yaw: float = 0.0,
    roll: float = 0.0,
    stress_level: float = 15.0,
    phone_detected: bool = False,
    accident_detected: bool = False,
    emotion: str = "NEUTRAL",
    new_alert: dict | None = None,
):
    """
    Call this function from your detection loop to push data to the frontend.
    """
    with state_lock:
        driver_state["status"] = str(status)
        driver_state["drowsiness_level"] = int(round(float(drowsiness_level)))
        driver_state["attention_score"] = int(round(float(attention_score)))
        driver_state["blink_rate"] = int(round(float(blink_rate)))
        driver_state["eyes_open"] = bool(eyes_open)
        driver_state["yawn_count"] = int(yawn_count)
        driver_state["safety_score"] = int(round(float(safety_score)))
        driver_state["face_detected"] = bool(face_detected)
        driver_state["pitch"] = float(pitch)
        driver_state["yaw"] = float(yaw)
        driver_state["roll"] = float(roll)
        driver_state["stress_level"] = int(round(float(stress_level)))
        driver_state["phone_detected"] = bool(phone_detected)
        driver_state["accident_detected"] = bool(accident_detected)
        driver_state["emotion"] = str(emotion)

        if new_alert:
            driver_state["alerts"].insert(0, new_alert)
            # Keep only last 50 alerts
            driver_state["alerts"] = driver_state["alerts"][:50]

    global last_sync_timestamp
    if not is_local_server:
        now = time.time()
        if new_alert or (now - last_sync_timestamp > 0.1):
            last_sync_timestamp = now
            threading.Thread(target=_sync_remote, args=(driver_state.copy(),), daemon=True).start()


is_local_server = False
last_sync_timestamp = 0.0


def _sync_remote(data):
    """Sync driver state to an existing standalone server process."""
    try:
        import requests
        requests.post("http://127.0.0.1:5005/api/status", json=data, timeout=0.3)
    except Exception:
        pass


def run_server():
    """Run Flask in a background thread (non-blocking)."""
    try:
        app.run(host="0.0.0.0", port=5005, debug=False, use_reloader=False)
    except Exception as e:
        print(f"[API] Flask server exception: {e}", flush=True)


def is_port_in_use(port=5005):
    """Check if port is already listening."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def start_api_server():
    """Call this at the start of your driver_monitor.py"""
    global is_local_server
    if is_port_in_use(5005):
        print("[API] Server already listening at http://localhost:5005/api/status (external process sync active)")
        is_local_server = False
        return
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    is_local_server = True
    print("[API] Server started at http://localhost:5005/api/status")


if __name__ == "__main__":
    is_local_server = True
    print("Starting API server standalone (for testing)...")
    app.run(host="0.0.0.0", port=5005, debug=True)
