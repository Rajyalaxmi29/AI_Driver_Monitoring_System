"""
Report panel component for AI-DMS Streamlit dashboard.
Renders alert history, session summary, and downloadable report.
"""
import streamlit as st
import pandas as pd
from datetime import datetime
import json
import io


def render_alerts(alerts: list):
    """Renders recent alert log cards and a table."""
    st.markdown('<div class="section-header">🚨 LIVE ALERT LOG</div>', unsafe_allow_html=True)

    if not alerts:
        st.markdown("""
        <div class="alert-card alert-card-info">
            ✅ &nbsp; No alerts detected this session. Drive safely!
        </div>
        """, unsafe_allow_html=True)
        return

    # Show last 10 alerts as HTML cards
    for alert in reversed(alerts[-10:]):
        ts       = alert.get("time", "")
        atype    = alert.get("type", "INFO")
        msg      = alert.get("message", "")
        level    = alert.get("level", "INFO")
        css = {
            "DROWSINESS": "alert-card",
            "YAWNING":    "alert-card alert-card-yawn",
            "DISTRACTED": "alert-card",
            "INFO":       "alert-card alert-card-info",
        }.get(atype, "alert-card alert-card-info")
        icon = {"DROWSINESS": "💤", "YAWNING": "🥱", "DISTRACTED": "👀", "INFO": "ℹ️"}.get(atype, "⚠️")
        st.markdown(f"""
        <div class="{css}">
            <span style="font-size:16px;">{icon}</span>
            <span><b>{ts}</b> — {msg}</span>
        </div>
        """, unsafe_allow_html=True)


def render_report_section(alerts: list, history: dict, session_start: str, safety_score: float):
    """Renders session summary and CSV/JSON download buttons."""
    st.markdown('<div class="section-header">📁 SESSION REPORT</div>', unsafe_allow_html=True)

    total_alerts = len(alerts)
    drowsy_count = sum(1 for a in alerts if a.get("type") == "DROWSINESS")
    yawn_count   = sum(1 for a in alerts if a.get("type") == "YAWNING")
    dist_count   = sum(1 for a in alerts if a.get("type") == "DISTRACTED")

    st.markdown(f"""
    <div class="session-banner">
        <div class="session-stat">
            <div class="session-stat-value">{total_alerts}</div>
            <div class="session-stat-label">Total Alerts</div>
        </div>
        <div class="session-stat">
            <div class="session-stat-value">{drowsy_count}</div>
            <div class="session-stat-label">Drowsy Events</div>
        </div>
        <div class="session-stat">
            <div class="session-stat-value">{yawn_count}</div>
            <div class="session-stat-label">Yawn Events</div>
        </div>
        <div class="session-stat">
            <div class="session-stat-value">{dist_count}</div>
            <div class="session-stat-label">Distraction</div>
        </div>
        <div class="session-stat">
            <div class="session-stat-value">{safety_score:.0f}%</div>
            <div class="session-stat-label">Final Safety</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Download CSV
    if alerts:
        df = pd.DataFrame(alerts)
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="⬇ DOWNLOAD ALERT LOG (CSV)",
            data=csv_bytes,
            file_name=f"dms_alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv",
            type="primary",
        )

    # Download JSON session history
    ear_list = list(history.get("ear", []))
    json_data = {
        "session_start": session_start,
        "safety_score": safety_score,
        "alerts": alerts,
        "ear_history": ear_list,
        "fatigue_history": list(history.get("fatigue", [])),
        "attention_history": list(history.get("attention", [])),
    }
    json_bytes = json.dumps(json_data, indent=2).encode("utf-8")
    st.download_button(
        label="⬇ EXPORT FULL SESSION DATA (JSON)",
        data=json_bytes,
        file_name=f"dms_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        mime="application/json",
    )
