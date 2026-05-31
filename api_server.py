"""
api_server.py  –  Add this to your project or merge into driver_monitor.py
Runs a simple Flask server that the Next.js frontend polls every second.

Install: pip install flask flask-cors
Run:     python api_server.py
"""

from flask import Flask, jsonify
from flask_cors import CORS
import threading
import time

app = Flask(__name__)
CORS(app)  # Allow frontend (localhost:3000) to fetch from here

# ── Shared state (updated by your driver_monitor.py loop) ─────────
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
@app.route("/api/status")
def get_status():
    driver_state["session_seconds"] = int(time.time() - session_start)
    return jsonify(driver_state)

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


def run_server():
    """Run Flask in a background thread (non-blocking)."""
    app.run(host="0.0.0.0", port=5005, debug=False, use_reloader=False)


def start_api_server():
    """Call this at the start of your driver_monitor.py"""
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    print("[API] Server started at http://localhost:5005/api/status")


if __name__ == "__main__":
    print("Starting API server standalone (for testing)...")
    app.run(host="0.0.0.0", port=5005, debug=True)
