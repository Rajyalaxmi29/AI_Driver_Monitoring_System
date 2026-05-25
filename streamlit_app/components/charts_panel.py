"""
Charts panel component for AI-DMS Streamlit dashboard.
Renders animated Plotly charts for real-time analytics.
"""
import plotly.graph_objects as go
import plotly.express as px
import streamlit as st
from collections import deque


# ── Shared cyberpunk plotly layout ────────────────────────────────────────────
PLOTLY_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(1,10,20,0.7)",
    font=dict(family="Orbitron, monospace", color="#8899bb", size=10),
    margin=dict(l=40, r=10, t=30, b=30),
    xaxis=dict(
        showgrid=True, gridcolor="#00d4ff11",
        zeroline=False, color="#445566",
        tickfont=dict(size=9),
    ),
    yaxis=dict(
        showgrid=True, gridcolor="#00d4ff11",
        zeroline=False, color="#445566",
        tickfont=dict(size=9),
    ),
    legend=dict(
        bgcolor="rgba(0,0,0,0.4)", bordercolor="#00d4ff22",
        borderwidth=1, font=dict(size=9),
    ),
    hovermode="x unified",
)


def _line_fig(title: str, history: dict, colors: dict, y_range=None):
    """Build an animated Plotly line chart from history deques."""
    fig = go.Figure()
    for key, vals in history.items():
        x = list(range(len(vals)))
        fig.add_trace(go.Scatter(
            x=x, y=list(vals),
            name=key,
            mode="lines",
            line=dict(color=colors.get(key, "#00d4ff"), width=2),
            fill="tozeroy",
            fillcolor=f"rgba({_hex_to_rgb(colors.get(key,'#00d4ff'))},0.05)",
        ))
    layout = {**PLOTLY_LAYOUT, "title": dict(text=title, font=dict(size=11, color="#00d4ff"), x=0.02, xanchor="left")}
    if y_range:
        layout["yaxis"] = {**layout.get("yaxis", {}), "range": y_range}
    fig.update_layout(**layout)
    fig.update_xaxes(showticklabels=False)
    return fig


def _hex_to_rgb(hex_color: str) -> str:
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    return f"{r},{g},{b}"


def render_charts(history: dict):
    """
    Renders all real-time Plotly charts.
    Args:
        history: dict of deque objects from session_state['history']
    """
    st.markdown('<div class="section-header">📊 REAL-TIME AI ANALYTICS</div>', unsafe_allow_html=True)

    # Row 1 – EAR + MAR
    c1, c2 = st.columns(2)
    with c1:
        fig = _line_fig(
            "EYE ASPECT RATIO (EAR)",
            {"EAR": history["ear"]},
            {"EAR": "#00d4ff"},
            y_range=[0.0, 0.5],
        )
        # Danger threshold line
        fig.add_hline(y=0.22, line_dash="dot", line_color="#ff3232", opacity=0.6, annotation_text="DROWSY", annotation_font_color="#ff3232")
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    with c2:
        fig = _line_fig(
            "MOUTH ASPECT RATIO (MAR)",
            {"MAR": history["mar"]},
            {"MAR": "#ffa500"},
            y_range=[0.0, 1.0],
        )
        fig.add_hline(y=0.52, line_dash="dot", line_color="#ff3232", opacity=0.6, annotation_text="YAWN", annotation_font_color="#ff3232")
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    # Row 2 – Fatigue + Attention
    c3, c4 = st.columns(2)
    with c3:
        fig = _line_fig(
            "FATIGUE SCORE (%)",
            {"Fatigue": history["fatigue"]},
            {"Fatigue": "#ff3232"},
            y_range=[0, 100],
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    with c4:
        fig = _line_fig(
            "ATTENTION SCORE (%)",
            {"Attention": history["attention"]},
            {"Attention": "#00ff88"},
            y_range=[0, 100],
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    # Row 3 – Head Pose (Yaw + Pitch combined)
    fig = _line_fig(
        "HEAD POSE — YAW & PITCH (degrees)",
        {"Yaw": history["yaw"], "Pitch": history["pitch"]},
        {"Yaw": "#7b2fff", "Pitch": "#00d4ff"},
        y_range=[-45, 45],
    )
    fig.add_hline(y=15, line_dash="dot", line_color="#ffa50066")
    fig.add_hline(y=-15, line_dash="dot", line_color="#ffa50066")
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    # Row 4 – Gauge: Safety Score
    safety = list(history["safety"])[-1] if history["safety"] else 100
    fig_gauge = go.Figure(go.Indicator(
        mode="gauge+number",
        value=safety,
        title={"text": "SAFETY SCORE", "font": {"family": "Orbitron", "size": 13, "color": "#00d4ff"}},
        number={"font": {"family": "Orbitron", "color": "#00d4ff", "size": 36}, "suffix": "%"},
        gauge={
            "axis": {"range": [0, 100], "tickcolor": "#445566", "tickfont": {"color": "#445566", "size": 9}},
            "bar": {"color": "#00d4ff", "thickness": 0.25},
            "bgcolor": "rgba(1,10,20,0.8)",
            "borderwidth": 0,
            "steps": [
                {"range": [0, 40], "color": "rgba(255,50,50,0.25)"},
                {"range": [40, 70], "color": "rgba(255,165,0,0.20)"},
                {"range": [70, 100], "color": "rgba(0,255,136,0.15)"},
            ],
            "threshold": {
                "line": {"color": "#ff3232", "width": 3},
                "thickness": 0.8,
                "value": 60,
            },
        },
    ))
    fig_gauge.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Orbitron", color="#8899bb"),
        margin=dict(l=40, r=40, t=40, b=10),
        height=220,
    )
    c5, c6 = st.columns([1, 2])
    with c5:
        st.plotly_chart(fig_gauge, use_container_width=True, config={"displayModeBar": False})

    # Blink / Yawn event counts bar
    with c6:
        blinks = list(history.get("blink_events", []))
        yawns  = list(history.get("yawn_events", []))
        x_vals = list(range(max(len(blinks), len(yawns), 1)))
        fig_bar = go.Figure()
        if blinks:
            fig_bar.add_trace(go.Bar(name="Blink Events", x=x_vals[:len(blinks)], y=blinks, marker_color="#00d4ff", opacity=0.7))
        if yawns:
            fig_bar.add_trace(go.Bar(name="Yawn Events", x=x_vals[:len(yawns)], y=yawns, marker_color="#ffa500", opacity=0.7))
        bar_layout = {**PLOTLY_LAYOUT, "barmode": "group", "title": dict(text="EVENT TIMELINE", font=dict(size=11, color="#00d4ff"), x=0.02)}
        fig_bar.update_layout(**bar_layout)
        fig_bar.update_xaxes(showticklabels=False)
        st.plotly_chart(fig_bar, use_container_width=True, config={"displayModeBar": False})
