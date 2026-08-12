"""Monitoring and persistence services for the dashboard."""

import json
import logging
import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import folium
from folium.plugins import HeatMap, MarkerCluster

from railway_ai_system.config import DASHBOARD_PATH_MAX_POINTS, DATABASE_PATH, STATIC_LOGS_DIR, STATIC_MAPS_DIR
from railway_ai_system.domain.route_config import ROUTE_DATA

logger = logging.getLogger(__name__)


class OperatorMonitor:
    """Read-only monitoring access to journey data stored in SQLite."""

    def __init__(self, db_path: Path | str = DATABASE_PATH):
        self.db_path = str(db_path)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get_journey_stats(self) -> Dict:
        """Return top-level dashboard statistics."""
        try:
            with closing(self._connect()) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM obstacles_log")
                obstacles = cursor.fetchone()[0]
                cursor.execute("SELECT MAX(timestamp) FROM journey_logs")
                last_update = cursor.fetchone()[0]
            return {
                "total_obstacles": obstacles,
                "last_update": last_update,
                "status": "ACTIVE" if last_update else "INACTIVE",
            }
        except Exception as exc:
            logger.error("Error getting journey stats: %s", exc)
            return {"total_obstacles": 0, "last_update": None, "status": "ERROR"}

    def get_recent_obstacles(self, limit: int = 10) -> List[Dict]:
        """Return recent obstacle detections with decoded metadata."""
        try:
            with closing(self._connect()) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT * FROM obstacles_log
                    ORDER BY timestamp DESC
                    LIMIT ?
                    """,
                    (limit,),
                )
                rows = cursor.fetchall()

            obstacles: List[Dict] = []
            for row in rows:
                obstacle = dict(row)
                metadata = obstacle.get("metadata")
                if metadata:
                    try:
                        obstacle.update(json.loads(metadata))
                    except json.JSONDecodeError:
                        logger.warning("Invalid obstacle metadata payload")
                obstacles.append(obstacle)
            return obstacles
        except Exception as exc:
            logger.error("Error getting recent obstacles: %s", exc)
            return []

    def get_journey_path(self, max_points: int = DASHBOARD_PATH_MAX_POINTS) -> List[Dict]:
        """Return the logged position history for map rendering."""
        try:
            with closing(self._connect()) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT * FROM journey_logs
                    WHERE event_type = 'POSITION_UPDATE'
                    ORDER BY timestamp DESC
                    LIMIT ?
                    """
                    ,
                    (max_points,)
                )
                rows = cursor.fetchall()

            path: List[Dict] = []
            for row in reversed(rows):
                try:
                    data = json.loads(row["data"])
                except (KeyError, TypeError, json.JSONDecodeError):
                    continue
                if "latitude" in data and "longitude" in data:
                    path.append({
                        "lat": data["latitude"],
                        "lon": data["longitude"],
                        "time": row["timestamp"],
                    })
            return path
        except Exception as exc:
            logger.error("Error getting journey path: %s", exc)
            return []

    def get_recent_logs(self, limit: int = 100) -> List[Dict]:
        """Return recent journey log events."""
        try:
            with closing(self._connect()) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT * FROM journey_logs
                    ORDER BY timestamp DESC
                    LIMIT ?
                    """,
                    (limit,),
                )
                return [dict(row) for row in cursor.fetchall()]
        except Exception as exc:
            logger.error("Error getting journey logs: %s", exc)
            return []

    def get_stats_breakdown(self) -> Dict:
        """Return aggregated event statistics."""
        try:
            with closing(self._connect()) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM obstacles_log")
                total_obstacles = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(DISTINCT event_type) FROM journey_logs")
                event_types = cursor.fetchone()[0]
                cursor.execute(
                    """
                    SELECT COUNT(*) as count, event_type
                    FROM journey_logs
                    GROUP BY event_type
                    """
                )
                event_counts = {row[1]: row[0] for row in cursor.fetchall()}
            return {
                "total_obstacles": total_obstacles,
                "event_types": event_types,
                "event_breakdown": event_counts,
            }
        except Exception as exc:
            logger.error("Error getting stats breakdown: %s", exc)
            raise

    def export_logs(self) -> Path:
        """Export current logs and obstacles to a JSON file."""
        try:
            with closing(self._connect()) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM journey_logs ORDER BY timestamp DESC")
                logs = [dict(row) for row in cursor.fetchall()]
                cursor.execute("SELECT * FROM obstacles_log ORDER BY timestamp DESC")
                obstacles = [dict(row) for row in cursor.fetchall()]

            export_data = {
                "export_time": datetime.now().isoformat(),
                "logs": logs,
                "obstacles": obstacles,
            }
            filename = f"journey_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            output_path = STATIC_LOGS_DIR / filename
            with open(output_path, "w", encoding="utf-8") as handle:
                json.dump(export_data, handle, indent=2)
            return output_path
        except Exception as exc:
            logger.error("Error exporting logs: %s", exc)
            raise


def build_journey_map(positions: List[Dict], obstacles: List[Dict], output_path: Path | str | None = None) -> Path:
    """Generate a static HTML map for the current journey and return its path."""
    if output_path is None:
        output_path = STATIC_MAPS_DIR / "journey_map.html"
    else:
        output_path = Path(output_path)

    if positions:
        center = [positions[0]["lat"], positions[0]["lon"]]
    else:
        center = [ROUTE_DATA["start"]["latitude"], ROUTE_DATA["start"]["longitude"]]

    map_view = folium.Map(location=center, zoom_start=8, tiles="OpenStreetMap")

    if len(positions) > 1:
        path_step = max(1, len(positions) // 500)
        reduced_positions = positions[::path_step]
        path_coords = [[pos["lat"], pos["lon"]] for pos in reduced_positions]
        folium.PolyLine(
            path_coords,
            color="blue",
            weight=3,
            opacity=0.8,
            popup="Journey Route",
        ).add_to(map_view)

    for index, pos in enumerate(positions[::max(1, len(positions) // 50)]):
        folium.CircleMarker(
            location=[pos["lat"], pos["lon"]],
            radius=5,
            popup=f"Position {index}<br>{pos['time']}",
            color="blue",
            fill=True,
            fillColor="blue",
            fillOpacity=0.7,
        ).add_to(map_view)

    if positions:
        folium.Marker(
            location=[positions[-1]["lat"], positions[-1]["lon"]],
            popup="Current Position",
            icon=folium.Icon(color="green", icon="train"),
        ).add_to(map_view)

    obstacle_cluster = MarkerCluster().add_to(map_view)
    for obstacle in obstacles:
        folium.Marker(
            location=[obstacle["latitude"], obstacle["longitude"]],
            popup=f"{obstacle['obstacle_type']}<br>Severity: {obstacle['severity']}",
            icon=folium.Icon(color="red", icon="exclamation"),
            cluster=True,
        ).add_to(obstacle_cluster)

    if len(obstacles) > 1:
        heat_data = [[obstacle["latitude"], obstacle["longitude"]] for obstacle in obstacles]
        HeatMap(heat_data).add_to(map_view)

    map_view.save(str(output_path))
    return output_path
