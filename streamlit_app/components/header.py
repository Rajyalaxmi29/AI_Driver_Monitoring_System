"""
Header component for the AI-DMS Streamlit dashboard.
Renders the top banner with title, live time, and system status.
"""
import streamlit as st
from datetime import datetime


def render_header(is_monitoring: bool):
    """Renders the full-width top header bar with animated gradient title."""
    status_dot_color = "#00ff88" if is_monitoring else "#ff4444"
    status_text = "MONITORING ACTIVE" if is_monitoring else "STANDBY"
    now = datetime.now().strftime("%Y-%m-%d  %H:%M:%S")

    st.markdown(f"""
    <div class="dms-header">
        <div class="header-title">
            ⬡ AI DRIVER MONITORING SYSTEM
        </div>
        <div class="header-status">
            <div class="header-time">🕐 {now}</div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div class="status-dot" style="background:{status_dot_color}; box-shadow:0 0 8px {status_dot_color};"></div>
                <span class="status-text" style="color:{status_dot_color};">{status_text}</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
