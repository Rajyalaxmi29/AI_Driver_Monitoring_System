"""
╔══════════════════════════════════════════════════════════════════╗
║   AI DRIVER MONITORING SYSTEM  —  Streamlit Web Dashboard v3    ║
║   Uses st.camera_input  (browser-native webcam — no threads)    ║
║   Run:  streamlit run streamlit_app/app.py                      ║
╚══════════════════════════════════════════════════════════════════╝
"""

import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import cv2
import numpy as np
import streamlit as st
from streamlit_autorefresh import st_autorefresh
from collections import deque
from datetime import datetime
from pathlib import Path
from PIL import Image
import io

from streamlit_app.components.header        import render_header
from streamlit_app.components.metrics_panel import render_metrics
from streamlit_app.components.charts_panel  import render_charts
from streamlit_app.components.report_panel  import render_alerts, render_report_section
from streamlit_app.video_processor          import VideoProcessor

# ═══════════════════════════════════════════════════════════════════════════════
# PAGE CONFIG
# ═══════════════════════════════════════════════════════════════════════════════
st.set_page_config(
    page_title="AI Driver Monitoring System",
    page_icon="⬡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Inject dark base styles immediately
st.markdown("""
<style>
[data-testid="stApp"]           { background: #020c18 !important; }
[data-testid="stSidebar"]       { background: #010a14 !important;
                                   border-right: 1px solid #00d4ff22 !important; }
[data-testid="stSidebarContent"]{ background: #010a14 !important; }
body                            { background: #020c18 !important; }
/* Camera widget container */
[data-testid="stCameraInput"] video {
    border-radius: 12px !important;
    border: 1px solid #00d4ff33 !important;
}
[data-testid="stCameraInput"] > div {
    background: #010a14 !important;
    border: 1px solid #00d4ff22 !important;
    border-radius: 14px !important;
    padding: 8px !important;
}
/* Make camera button glow */
[data-testid="stCameraInput"] button {
    background: linear-gradient(135deg,#00d4ff22,#7b2fff22) !important;
    border: 2px solid #00d4ff !important;
    color: #00d4ff !important;
    font-weight: 700 !important;
    letter-spacing: 2px !important;
    border-radius: 8px !important;
    box-shadow: 0 0 14px rgba(0,212,255,0.3) !important;
}
</style>
""", unsafe_allow_html=True)

# Full CSS
css_path = Path(__file__).parent / "css" / "style.css"
with open(css_path) as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# SESSION STATE
# ═══════════════════════════════════════════════════════════════════════════════
HISTORY_LEN = 200

def _init():
    defaults = {
        "monitoring":    False,
        "processor":     None,
        "session_start": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "tab":           "dashboard",
        "alert_sound":   True,
        "history": {
            "ear":          deque(maxlen=HISTORY_LEN),
            "mar":          deque(maxlen=HISTORY_LEN),
            "yaw":          deque(maxlen=HISTORY_LEN),
            "pitch":        deque(maxlen=HISTORY_LEN),
            "fatigue":      deque(maxlen=HISTORY_LEN),
            "attention":    deque(maxlen=HISTORY_LEN),
            "safety":       deque(maxlen=HISTORY_LEN),
            "blink_events": deque(maxlen=HISTORY_LEN),
            "yawn_events":  deque(maxlen=HISTORY_LEN),
        },
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

_init()

# ═══════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ═══════════════════════════════════════════════════════════════════════════════
with st.sidebar:
    st.markdown("""
    <div style="text-align:center;padding:20px 0 12px;">
        <div style="font-family:Orbitron,monospace;font-size:22px;font-weight:900;
                    background:linear-gradient(90deg,#00d4ff,#7b2fff);
                    -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
            ⬡ AI-DMS
        </div>
        <div style="font-size:10px;color:#556677;letter-spacing:3px;margin-top:6px;">
            DRIVER MONITORING SYSTEM
        </div>
    </div>
    <hr style="border-color:#00d4ff22;">
    """, unsafe_allow_html=True)

    # Start / Stop
    if not st.session_state["monitoring"]:
        if st.button("▶  START MONITORING", type="primary", use_container_width=True):
            st.session_state["monitoring"]   = True
            st.session_state["processor"]    = VideoProcessor()
            st.session_state["session_start"]= datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            for dq in st.session_state["history"].values():
                dq.clear()
            st.rerun()
    else:
        if st.button("⏹  STOP MONITORING", type="secondary", use_container_width=True):
            if st.session_state["processor"]:
                st.session_state["processor"].release()
            st.session_state["monitoring"] = False
            st.session_state["processor"]  = None
            st.rerun()

    st.markdown("<hr style='border-color:#00d4ff18;'>", unsafe_allow_html=True)

    # Settings
    st.markdown('<p style="font-family:Orbitron,monospace;font-size:11px;color:#00d4ff;letter-spacing:2px;">⚙ SETTINGS</p>', unsafe_allow_html=True)
    st.session_state["alert_sound"] = st.toggle("🔊 Alert Sounds", value=st.session_state["alert_sound"])

    st.markdown("<hr style='border-color:#00d4ff18;'>", unsafe_allow_html=True)

    # Navigation
    st.markdown('<p style="font-family:Orbitron,monospace;font-size:11px;color:#00d4ff;letter-spacing:2px;">📋 NAVIGATION</p>', unsafe_allow_html=True)
    for key, label in [("dashboard","🖥  DASHBOARD"),("analytics","📊  ANALYTICS"),
                       ("alerts","🚨  ALERTS"),("report","📁  REPORT")]:
        if st.button(label, key=f"nav_{key}", use_container_width=True):
            st.session_state["tab"] = key

    st.markdown("<hr style='border-color:#00d4ff18;'>", unsafe_allow_html=True)

    # Status dot
    if st.session_state["monitoring"]:
        st.markdown("""
        <div style="text-align:center;padding:10px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#00ff88;
                        box-shadow:0 0 12px #00ff88;margin:0 auto 8px;"></div>
            <div style="font-family:Orbitron,monospace;font-size:10px;
                        color:#00ff88;letter-spacing:2px;">LIVE MONITORING</div>
        </div>""", unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="text-align:center;padding:10px;">
            <div style="font-family:Orbitron,monospace;font-size:10px;
                        color:#445566;letter-spacing:2px;">● STANDBY</div>
        </div>""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# HEADER
# ═══════════════════════════════════════════════════════════════════════════════
render_header(st.session_state["monitoring"])

# ═══════════════════════════════════════════════════════════════════════════════
# VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════
current_tab = st.session_state["tab"]
history     = st.session_state["history"]
telemetry   = {}
frame_rgb   = None

# ═══════════════════════════════════════════════════════════════════════════════
# TAB: DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════
if current_tab == "dashboard":
    vid_col, met_col = st.columns([3, 2], gap="medium")

    with vid_col:
        st.markdown('<div class="section-header">📷 LIVE CAMERA FEED</div>',
                    unsafe_allow_html=True)

        if not st.session_state["monitoring"]:
            # ── NOT monitoring: show placeholder + big start button ──────────
            st.markdown("""
            <div style="background:linear-gradient(135deg,#010e1a,#011a2e);
                        border:1px dashed #00d4ff44;border-radius:16px;
                        height:300px;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;gap:14px;">
                <div style="font-size:56px;">📷</div>
                <div style="font-family:Orbitron,monospace;font-size:15px;
                            color:#00d4ff;letter-spacing:3px;">CAMERA FEED INACTIVE</div>
                <div style="font-size:11px;color:#445566;">
                    Click START MONITORING to activate your webcam
                </div>
            </div>""", unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)
            c_l, c_m, c_r = st.columns([1, 2, 1])
            with c_m:
                if st.button("▶  START MONITORING", type="primary",
                             use_container_width=True, key="main_start"):
                    st.session_state["monitoring"]   = True
                    st.session_state["processor"]    = VideoProcessor()
                    st.session_state["session_start"]= datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    for dq in st.session_state["history"].values():
                        dq.clear()
                    st.rerun()

        else:
            # ── MONITORING: show browser camera widget ───────────────────────
            st.markdown("""
            <div style="font-size:11px;color:#445566;margin-bottom:8px;
                        font-family:Orbitron,monospace;letter-spacing:1px;">
                📸 Allow camera access in browser → click the capture button below
            </div>""", unsafe_allow_html=True)

            # st.camera_input captures a frame each time user clicks shutter
            # We use it in a loop via autorefresh
            img_file = st.camera_input(
                label="",
                key="cam_feed",
                label_visibility="collapsed",
            )

            if img_file is not None:
                # Convert uploaded image bytes → numpy BGR
                pil_img = Image.open(img_file)
                frame_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

                # Run AI processing
                processor = st.session_state["processor"]
                if processor:
                    frame_rgb, telemetry = processor.process_frame(frame_bgr)

                    # Push to history
                    h = history
                    h["ear"].append(telemetry.get("ear", 0.3))
                    h["mar"].append(telemetry.get("mar", 0.1))
                    h["yaw"].append(telemetry.get("yaw", 0.0))
                    h["pitch"].append(telemetry.get("pitch", 0.0))
                    h["fatigue"].append(telemetry.get("fatigue_score", 0.0))
                    h["attention"].append(telemetry.get("attention_score", 100.0))
                    h["safety"].append(telemetry.get("safety_score", 100.0))
                    h["blink_events"].append(telemetry.get("blink_count", 0))
                    h["yawn_events"].append(telemetry.get("yawn_count", 0))

                    # Sound alert
                    if st.session_state["alert_sound"] and telemetry.get("current_alert"):
                        try:
                            import winsound, threading
                            threading.Thread(
                                target=lambda: winsound.Beep(880, 200), daemon=True
                            ).start()
                        except Exception:
                            pass

                    # Show AI-processed frame below camera widget
                    if frame_rgb is not None:
                        st.markdown('<div style="margin-top:8px;"></div>', unsafe_allow_html=True)
                        st.image(frame_rgb, channels="RGB",
                                 caption="AI-Processed Frame with HUD",
                                 use_container_width=True)

                    # Alert banner
                    alert = telemetry.get("current_alert", "")
                    if alert:
                        lvl = telemetry.get("fatigue_level", "WARNING")
                        bc  = "badge-critical" if lvl == "CRITICAL" else "badge-warning"
                        st.markdown(f"""
                        <div style="text-align:center;margin-top:10px;">
                            <span class="badge {bc}"
                                  style="font-size:15px;padding:10px 28px;letter-spacing:3px;">
                                {alert}
                            </span>
                        </div>""", unsafe_allow_html=True)

            else:
                st.markdown("""
                <div style="background:#010a14;border:1px solid #00d4ff22;
                            border-radius:12px;padding:18px;text-align:center;
                            font-family:Orbitron,monospace;font-size:11px;color:#445566;">
                    ☝ Click the 📷 camera button above to capture a frame for AI analysis
                </div>""", unsafe_allow_html=True)

            # Quick stats
            if telemetry:
                st.markdown("<br>", unsafe_allow_html=True)
                q1,q2,q3,q4 = st.columns(4)
                def _qcard(col, lbl, val, col_hex="#00d4ff"):
                    col.markdown(f"""
                    <div class="metric-card" style="text-align:center;padding:12px;">
                        <div class="metric-label">{lbl}</div>
                        <div class="metric-value"
                             style="font-size:22px;color:{col_hex};">{val}</div>
                    </div>""", unsafe_allow_html=True)

                ear  = telemetry.get("ear", 0.0)
                mar  = telemetry.get("mar", 0.0)
                blk  = telemetry.get("blink_count", 0)
                ywn  = telemetry.get("yawn_count",  0)
                _qcard(q1,"EAR",    f"{ear:.3f}", "#00ff88" if ear>=0.22 else "#ff3232")
                _qcard(q2,"MAR",    f"{mar:.3f}", "#ffa500" if mar>0.52  else "#00ff88")
                _qcard(q3,"BLINKS", str(blk),     "#00d4ff")
                _qcard(q4,"YAWNS",  str(ywn),     "#ffa500" if ywn>0 else "#00ff88")

    with met_col:
        if telemetry:
            render_metrics(telemetry)
        else:
            st.markdown("""
            <div style="text-align:center;padding:80px 20px;
                        font-family:Orbitron,monospace;font-size:12px;
                        color:#334455;letter-spacing:2px;">
                <div style="font-size:40px;margin-bottom:16px;opacity:0.2;">📊</div>
                AI METRICS WILL APPEAR<br>AFTER FIRST CAPTURED FRAME
            </div>""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB: ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════
elif current_tab == "analytics":
    if any(len(v) > 2 for v in history.values()):
        render_charts(history)
    else:
        st.markdown("""
        <div style="text-align:center;padding:80px 20px;
                    font-family:Orbitron,monospace;font-size:14px;
                    color:#334455;letter-spacing:2px;">
            <div style="font-size:52px;margin-bottom:20px;opacity:0.2;">📈</div>
            START MONITORING & CAPTURE FRAMES TO SEE ANALYTICS
        </div>""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB: ALERTS
# ═══════════════════════════════════════════════════════════════════════════════
elif current_tab == "alerts":
    proc = st.session_state.get("processor")
    render_alerts(proc.get_alerts() if proc else [])

# ═══════════════════════════════════════════════════════════════════════════════
# TAB: REPORT
# ═══════════════════════════════════════════════════════════════════════════════
elif current_tab == "report":
    proc   = st.session_state.get("processor")
    alerts = proc.get_alerts() if proc else []
    render_report_section(
        alerts=alerts,
        history=history,
        session_start=st.session_state["session_start"],
        safety_score=telemetry.get("safety_score", 100.0),
    )

# ── Footer ────────────────────────────────────────────────────────────────────
st.markdown("""
<div style="text-align:center;padding:18px;margin-top:20px;
            border-top:1px solid #00d4ff11;font-size:10px;
            color:#334455;font-family:Orbitron,monospace;letter-spacing:2px;">
    AI DRIVER MONITORING SYSTEM  ·  MEDIAPIPE + OPENCV + STREAMLIT  ·  v3.0
</div>""", unsafe_allow_html=True)
