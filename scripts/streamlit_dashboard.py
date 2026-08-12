"""Streamlit fallback dashboard for railway monitoring."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

from railway_ai_system.config import DATABASE_PATH
from railway_ai_system.services.monitoring import OperatorMonitor, build_journey_map


st.set_page_config(page_title="Railway Live Dashboard", page_icon="🚆", layout="wide")

st.title("Railway Live Dashboard")
st.caption("Streamlit fallback dashboard reading live data from SQLite.")

monitor = OperatorMonitor(DATABASE_PATH)

with st.sidebar:
    st.header("Controls")
    obstacle_limit = st.slider("Recent obstacles", min_value=5, max_value=100, value=25, step=5)
    log_limit = st.slider("Recent logs", min_value=20, max_value=300, value=80, step=20)
    if st.button("Refresh data"):
        st.rerun()

stats = monitor.get_journey_stats()
obstacles = monitor.get_recent_obstacles(obstacle_limit)
logs = monitor.get_recent_logs(log_limit)
positions = monitor.get_journey_path()

col1, col2, col3 = st.columns(3)
col1.metric("Total Obstacles", stats.get("total_obstacles", 0))
col2.metric("Status", stats.get("status", "UNKNOWN"))
col3.metric("Last Update", str(stats.get("last_update") or "N/A"))

st.subheader("Journey Map")
map_path = build_journey_map(positions, monitor.get_recent_obstacles(100))
map_html = Path(map_path).read_text(encoding="utf-8")
components.html(map_html, height=520, scrolling=False)

st.subheader("Recent Obstacles")
if obstacles:
    st.dataframe(pd.DataFrame(obstacles), use_container_width=True)
else:
    st.info("No obstacle records found yet.")

st.subheader("Recent Logs")
if logs:
    st.dataframe(pd.DataFrame(logs), use_container_width=True)
else:
    st.info("No journey logs found yet.")
