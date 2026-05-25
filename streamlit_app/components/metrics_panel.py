"""
Metrics panel component for AI-DMS Streamlit dashboard.
Renders real-time AI analytics cards on the right panel.
"""
import streamlit as st


def _badge(text: str, level: str) -> str:
    """Returns HTML badge based on alert level."""
    css_class = {"SAFE": "badge-safe", "WARNING": "badge-warning", "CRITICAL": "badge-critical"}.get(level, "badge-info")
    return f'<span class="badge {css_class}">{text}</span>'


def render_metrics(data: dict):
    """
    Renders the live AI telemetry panel.
    Args:
        data: dict of current telemetry values from VideoProcessor
    """
    ear          = data.get("ear", 0.30)
    mar          = data.get("mar", 0.10)
    yaw          = data.get("yaw", 0.0)
    pitch        = data.get("pitch", 0.0)
    fatigue_pct  = data.get("fatigue_score", 0.0)
    fatigue_lvl  = data.get("fatigue_level", "SAFE")
    attention    = data.get("attention_score", 100.0)
    blinks       = data.get("blink_count", 0)
    yawns        = data.get("yawn_count", 0)
    stress_lvl   = data.get("stress_level", "LOW")
    emotion      = data.get("emotion", "NEUTRAL")
    steering     = data.get("steering_angle", 0.0)
    fps          = data.get("fps", 0.0)
    safety_score = data.get("safety_score", 100.0)
    session_dur  = data.get("session_duration", 0)
    night_mode   = data.get("night_mode", False)

    # ── Session stats banner ──────────────────────────────────────────
    h, m, s = session_dur // 3600, (session_dur % 3600) // 60, session_dur % 60
    st.markdown(f"""
    <div class="session-banner">
        <div class="session-stat">
            <div class="session-stat-value">{h:02d}:{m:02d}:{s:02d}</div>
            <div class="session-stat-label">Session Time</div>
        </div>
        <div class="session-stat">
            <div class="session-stat-value">{fps:.0f}</div>
            <div class="session-stat-label">FPS</div>
        </div>
        <div class="session-stat">
            <div class="session-stat-value">{safety_score:.0f}%</div>
            <div class="session-stat-label">Safety Score</div>
        </div>
        <div class="session-stat">
            <div class="session-stat-value">{"🌙" if night_mode else "☀️"}</div>
            <div class="session-stat-label">{"Night Mode" if night_mode else "Day Mode"}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Driver Status + Fatigue ───────────────────────────────────────
    st.markdown('<div class="section-header">⚡ DRIVER AI STATUS</div>', unsafe_allow_html=True)

    fatigue_color_map = {"SAFE": "#00ff88", "WARNING": "#ffa500", "CRITICAL": "#ff3232"}
    fc = fatigue_color_map.get(fatigue_lvl, "#00ff88")

    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">FATIGUE LEVEL</div>
        <div class="metric-value" style="color:{fc}; text-shadow:0 0 14px {fc}88;">{fatigue_pct:.0f}%</div>
        <div style="margin-top:8px;">{_badge(fatigue_lvl, fatigue_lvl)}</div>
    </div>
    """, unsafe_allow_html=True)
    st.progress(int(fatigue_pct))

    # Attention
    att_color = "#00ff88" if attention > 70 else ("#ffa500" if attention > 40 else "#ff3232")
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">ATTENTION SCORE</div>
        <div class="metric-value" style="color:{att_color}; text-shadow:0 0 14px {att_color}88;">{attention:.0f}%</div>
        <div class="metric-sub">Head pose + Eye state composite</div>
    </div>
    """, unsafe_allow_html=True)
    st.progress(int(attention))

    # Safety Score
    ss_color = "#00ff88" if safety_score >= 80 else ("#ffa500" if safety_score >= 55 else "#ff3232")
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">SAFETY SCORE</div>
        <div class="metric-value" style="color:{ss_color};">{safety_score:.0f}%</div>
        <div class="metric-sub">Deducted for each alert event</div>
    </div>
    """, unsafe_allow_html=True)
    st.progress(int(safety_score))

    # ── Eye / Mouth Metrics ───────────────────────────────────────────
    st.markdown('<div class="section-header">👁 EYE & MOUTH METRICS</div>', unsafe_allow_html=True)

    col1, col2 = st.columns(2)
    with col1:
        ear_color = "#00ff88" if ear >= 0.22 else "#ff3232"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">EAR</div>
            <div class="metric-value" style="color:{ear_color};">{ear:.3f}</div>
            <div class="metric-sub">Eye Aspect Ratio</div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        mar_color = "#ffa500" if mar > 0.52 else "#00ff88"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">MAR</div>
            <div class="metric-value" style="color:{mar_color};">{mar:.3f}</div>
            <div class="metric-sub">Mouth Aspect Ratio</div>
        </div>
        """, unsafe_allow_html=True)

    col3, col4 = st.columns(2)
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">BLINKS</div>
            <div class="metric-value">{blinks}</div>
            <div class="metric-sub">Total this session</div>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        y_color = "#ffa500" if yawns > 0 else "#00ff88"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">YAWNS</div>
            <div class="metric-value" style="color:{y_color};">{yawns}</div>
            <div class="metric-sub">Total this session</div>
        </div>
        """, unsafe_allow_html=True)

    # ── Head Pose ─────────────────────────────────────────────────────
    st.markdown('<div class="section-header">🧭 HEAD POSE</div>', unsafe_allow_html=True)

    yaw_level  = "SAFE" if abs(yaw) < 15 else ("WARNING" if abs(yaw) < 25 else "CRITICAL")
    pitch_level= "SAFE" if abs(pitch) < 12 else ("WARNING" if abs(pitch) < 22 else "CRITICAL")
    yaw_color  = {"SAFE":"#00ff88","WARNING":"#ffa500","CRITICAL":"#ff3232"}[yaw_level]
    pitch_color= {"SAFE":"#00ff88","WARNING":"#ffa500","CRITICAL":"#ff3232"}[pitch_level]

    col5, col6 = st.columns(2)
    with col5:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">YAW (L/R)</div>
            <div class="metric-value" style="color:{yaw_color};">{yaw:+.1f}°</div>
        </div>
        """, unsafe_allow_html=True)
    with col6:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">PITCH (U/D)</div>
            <div class="metric-value" style="color:{pitch_color};">{pitch:+.1f}°</div>
        </div>
        """, unsafe_allow_html=True)

    # ── Emotion & Stress ─────────────────────────────────────────────
    st.markdown('<div class="section-header">🧠 AI EMOTION ANALYSIS</div>', unsafe_allow_html=True)

    stress_color_map = {"LOW": "#00ff88", "MEDIUM": "#ffa500", "HIGH": "#ff3232"}
    sc = stress_color_map.get(stress_level, "#00ff88")

    col7, col8 = st.columns(2)
    with col7:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">EMOTION</div>
            <div class="metric-value" style="font-size:16px;">{emotion}</div>
        </div>
        """, unsafe_allow_html=True)
    with col8:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-label">STRESS</div>
            <div class="metric-value" style="color:{sc}; font-size:16px;">{stress_level}</div>
        </div>
        """, unsafe_allow_html=True)

    # ── Steering Simulation ───────────────────────────────────────────
    st.markdown(f"""
    <div class="metric-card" style="margin-top:4px;">
        <div class="metric-label">STEERING DRIFT SIMULATION</div>
        <div class="metric-value" style="font-size:18px;">{steering:+.1f}°</div>
        <div class="metric-sub">Virtual wheel offset based on attention decay</div>
    </div>
    """, unsafe_allow_html=True)
