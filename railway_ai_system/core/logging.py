"""Advanced evidence capture and export utilities."""

import base64
import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import folium
from folium.plugins import HeatMap
from PIL import Image, ImageDraw

from railway_ai_system.config import JOURNEY_DATABASE_PATH, JOURNEY_LOG_DIR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _normalize_report_timestamp(value: str | None) -> str | None:
    if not value:
        return None
    return datetime.fromisoformat(value).strftime("%Y-%m-%d %H:%M:%S")


def _current_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class AdvancedJourneyLogger:
    """Advanced logging system with images, maps, and sharing."""

    def __init__(self, db_path: str | Path = JOURNEY_DATABASE_PATH):
        self.db_path = str(db_path)
        self.log_dir = JOURNEY_LOG_DIR
        self.image_dir = self.log_dir / "images"
        self.map_dir = self.log_dir / "maps"
        self.export_dir = self.log_dir / "exports"

        for dir_path in [self.log_dir, self.image_dir, self.map_dir, self.export_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

        self.setup_advanced_tables()

    def setup_advanced_tables(self):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS image_logs(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    latitude REAL,
                    longitude REAL,
                    image_path TEXT,
                    image_base64 TEXT,
                    description TEXT,
                    event_type TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS map_logs(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    map_path TEXT,
                    map_data TEXT,
                    waypoints_count INTEGER,
                    obstacles_count INTEGER
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS operator_notes(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    latitude REAL,
                    longitude REAL,
                    note TEXT,
                    severity TEXT,
                    attachments TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shared_logs(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    shared_with TEXT,
                    log_type TEXT,
                    log_content TEXT,
                    access_token TEXT
                )
            """)
            conn.commit()
            conn.close()
            logger.info("✅ Advanced logging tables created")
        except Exception as exc:
            logger.error("Error setting up tables: %s", exc)

    def capture_journey_screenshot(self, train_id: str, latitude: float, longitude: float, speed: float, temperature: float, obstacles_detected: int = 0) -> str:
        try:
            img_width, img_height = 800, 600
            image = Image.new("RGB", (img_width, img_height), color="white")
            draw = ImageDraw.Draw(image)
            for i in range(img_height):
                color = int(135 + (i / img_height) * 40)
                draw.line([(0, i), (img_width, i)], fill=(100, color, 150))

            draw.text((20, 20), f"🚂 Train Journey - {train_id}", fill="white")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            draw.text((20, 60), f"Timestamp: {timestamp}", fill="white")
            draw.text((20, 100), f"Location: ({latitude:.4f}, {longitude:.4f})", fill="white")
            draw.text((20, 140), f"Speed: {speed:.2f} km/h", fill="white")
            draw.text((20, 180), f"Temperature: {temperature:.2f} °C", fill="white")
            draw.text((20, 220), f"Obstacles Detected: {obstacles_detected}", fill="yellow" if obstacles_detected > 0 else "white")

            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            image_path = self.image_dir / f"journey_{train_id}_{timestamp_str}.png"
            image.save(image_path)
            logger.info("📸 Journey screenshot saved: %s", image_path)
            return str(image_path)
        except Exception as exc:
            logger.error("Error capturing screenshot: %s", exc)
            return None

    def log_image_with_details(self, train_id: str, latitude: float, longitude: float, image_path: str, description: str, event_type: str):
        try:
            with open(image_path, "rb") as handle:
                image_data = handle.read()
            image_base64 = base64.b64encode(image_data).decode("utf-8")
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO image_logs(timestamp, train_id, latitude, longitude, image_path,
                                       image_base64, description, event_type)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            """, (_current_timestamp(), train_id, latitude, longitude, image_path, image_base64, description, event_type))
            conn.commit()
            conn.close()
            logger.info("✅ Image logged: %s", image_path)
        except Exception as exc:
            logger.error("Error logging image: %s", exc)

    def generate_journey_map_with_images(self, train_id: str, positions: List[Dict], obstacles: List[Dict]) -> str:
        try:
            center = [50.1109, 8.6821] if not positions else [positions[0]["latitude"], positions[0]["longitude"]]
            map_view = folium.Map(location=center, zoom_start=8, tiles="OpenStreetMap")
            if len(positions) > 1:
                path_coords = [[p.get("latitude", 50), p.get("longitude", 8)] for p in positions]
                folium.PolyLine(path_coords, color="blue", weight=3, opacity=0.8, popup="Journey Route").add_to(map_view)
            for index, pos in enumerate(positions[::max(1, len(positions) // 20)]):
                folium.CircleMarker(
                    location=[pos.get("latitude", 50), pos.get("longitude", 8)],
                    radius=6,
                    popup=f"Position {index}<br>{pos.get('timestamp', 'N/A')}",
                    color="blue",
                    fill=True,
                    fillColor="blue",
                    fillOpacity=0.7,
                ).add_to(map_view)
            for obstacle in obstacles:
                severity_color = "red" if obstacle.get("severity") == "HIGH" else "orange"
                popup_text = f"{obstacle.get('obstacle_type', 'Unknown')}<br>Severity: {obstacle.get('severity', 'N/A')}"
                folium.Marker(
                    location=[obstacle.get("latitude", 50), obstacle.get("longitude", 8)],
                    popup=popup_text,
                    icon=folium.Icon(color=severity_color, icon="exclamation"),
                ).add_to(map_view)
            if len(obstacles) > 1:
                heat_data = [[obs.get("latitude", 50), obs.get("longitude", 8)] for obs in obstacles]
                HeatMap(heat_data).add_to(map_view)
            map_path = self.map_dir / f"journey_map_{train_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            map_view.save(str(map_path))
            logger.info("🗺️ Journey map created: %s", map_path)
            return str(map_path)
        except Exception as exc:
            logger.error("Error generating map: %s", exc)
            return None

    def add_operator_note(self, train_id: str, latitude: float, longitude: float, note: str, severity: str = "INFO", attachments: List[str] = None):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO operator_notes(timestamp, train_id, latitude, longitude, note,
                                           severity, attachments)
                VALUES(?, ?, ?, ?, ?, ?, ?)
            """, (_current_timestamp(), train_id, latitude, longitude, note, severity, json.dumps(attachments or [])))
            conn.commit()
            conn.close()
            logger.info("📝 Operator note added")
        except Exception as exc:
            logger.error("Error adding operator note: %s", exc)

    def _build_runtime_journey_logs(self, journey_snapshot: Dict) -> List[Dict]:
        journey_logs = []
        if journey_snapshot.get("start_time"):
            journey_logs.append({
                "timestamp": journey_snapshot["start_time"],
                "train_id": journey_snapshot.get("train_id"),
                "event_type": "JOURNEY_STARTED",
                "data": "Runtime session started",
            })
        for waypoint in journey_snapshot.get("waypoints_visited", []):
            journey_logs.append({
                "timestamp": waypoint.get("timestamp"),
                "train_id": journey_snapshot.get("train_id"),
                "event_type": "WAYPOINT_REACHED",
                "data": json.dumps(waypoint),
            })
        for event in journey_snapshot.get("emergency_actions", []):
            journey_logs.append({
                "timestamp": event.get("timestamp"),
                "train_id": journey_snapshot.get("train_id"),
                "event_type": event.get("action", "EMERGENCY_ACTION"),
                "data": json.dumps(event),
            })
        if journey_snapshot.get("end_time"):
            journey_logs.append({
                "timestamp": journey_snapshot["end_time"],
                "train_id": journey_snapshot.get("train_id"),
                "event_type": "JOURNEY_COMPLETED",
                "data": "Runtime session completed",
            })
        return journey_logs

    def generate_complete_report(self, train_id: str, start_time: str | None = None, end_time: str | None = None, journey_snapshot: Dict | None = None) -> Dict:
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            query = "SELECT * FROM {table} WHERE train_id = ?"
            params = [train_id]
            report_start = _normalize_report_timestamp(start_time)
            report_end = _normalize_report_timestamp(end_time)
            if report_start and report_end:
                query += " AND datetime(timestamp) BETWEEN datetime(?) AND datetime(?)"
                params.extend([report_start, report_end])
            query += " ORDER BY timestamp"

            cursor.execute(query.format(table="journey_logs"), params)
            journey_logs = [dict(row) for row in cursor.fetchall()]
            cursor.execute(query.format(table="obstacles_log"), params)
            obstacles = [dict(row) for row in cursor.fetchall()]
            cursor.execute(query.format(table="image_logs"), params)
            images = [dict(row) for row in cursor.fetchall()]
            cursor.execute(query.format(table="operator_notes"), params)
            notes = [dict(row) for row in cursor.fetchall()]
            conn.close()

            data_source = "database"
            if journey_snapshot and not journey_logs and not obstacles:
                journey_logs = self._build_runtime_journey_logs(journey_snapshot)
                obstacles = list(journey_snapshot.get("obstacles_detected", []))
                data_source = "runtime_snapshot_fallback"

            return {
                "train_id": train_id,
                "generated_at": datetime.now().isoformat(),
                "data_source": data_source,
                "report_window": {
                    "start_time": report_start,
                    "end_time": report_end,
                },
                "summary": {
                    "total_logs": len(journey_logs),
                    "total_obstacles": len(obstacles),
                    "total_images": len(images),
                    "operator_notes": len(notes),
                },
                "journey_logs": journey_logs,
                "obstacles": obstacles,
                "images": images,
                "operator_notes": notes,
                "runtime_snapshot": journey_snapshot,
            }
        except Exception as exc:
            logger.error("Error generating report: %s", exc)
            return {}

    def export_report_as_json(self, train_id: str, start_time: str | None = None, end_time: str | None = None, journey_snapshot: Dict | None = None, output_dir: str | Path | None = None) -> str:
        try:
            report = self.generate_complete_report(train_id, start_time=start_time, end_time=end_time, journey_snapshot=journey_snapshot)
            target_dir = Path(output_dir) if output_dir is not None else self.export_dir
            target_dir.mkdir(parents=True, exist_ok=True)
            filepath = target_dir / f"complete_report_{train_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filepath, "w", encoding="utf-8") as handle:
                json.dump(report, handle, indent=2, default=str)
            logger.info("✅ Report exported: %s", filepath)
            return str(filepath)
        except Exception as exc:
            logger.error("Error exporting report: %s", exc)
            return None

    def create_shareable_log(self, train_id: str, shared_with: str, log_type: str, log_content: Dict) -> str:
        try:
            import secrets

            access_token = secrets.token_urlsafe(32)
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO shared_logs(train_id, shared_with, log_type,
                                       log_content, access_token)
                VALUES(?, ?, ?, ?, ?)
            """, (train_id, shared_with, log_type, json.dumps(log_content), access_token))
            conn.commit()
            conn.close()
            logger.info("🔗 Shareable log created with token: %s", access_token)
            return access_token
        except Exception as exc:
            logger.error("Error creating shareable log: %s", exc)
            return None

    def get_shared_log(self, access_token: str) -> Optional[Dict]:
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM shared_logs WHERE access_token = ?", (access_token,))
            row = cursor.fetchone()
            conn.close()
            if row:
                shared_log = dict(row)
                shared_log["log_content"] = json.loads(shared_log["log_content"])
                return shared_log
            return None
        except Exception as exc:
            logger.error("Error retrieving shared log: %s", exc)
            return None
