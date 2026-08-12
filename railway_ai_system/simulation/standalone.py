"""Standalone railway simulation engine."""

import json
import random
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from railway_ai_system.config import (
    JOURNEY_DATABASE_PATH,
    SIMULATION_DISTANCE_STEP_KM,
    STANDALONE_SIMULATION_SLEEP_SECONDS,
)
from railway_ai_system.reporting.generator import ReportGenerator, create_run_report_dir
from railway_ai_system.sensors.crossing_fusion import CrossingSensorFusionPrototype
from railway_ai_system.domain.route_config import (
    ALERT_RECIPIENTS,
    CROSSING_CAMERA_OBJECTS,
    CROSSING_EMERGENCY_POLICY,
    OBSTACLES_PROBABILITY,
    ROAD_RAIL_INTERSECTIONS,
    ROUTE_DATA,
    SPEED_PROFILE,
    TEMPERATURE_VARIATION,
)


def _current_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class StandaloneTrainSimulator:
    """Standalone train simulator without server dependency."""

    def __init__(self, train_id: str):
        self.train_id = train_id
        self.journey_log = {
            "train_id": train_id,
            "start_time": None,
            "end_time": None,
            "waypoints_visited": [],
            "obstacles_detected": [],
            "max_speed": 0,
            "min_temperature": 100,
            "max_temperature": -100,
            "average_speed": 0,
            "total_distance_km": ROUTE_DATA["waypoints"][-1]["distance_from_start_km"],
            "speed_log": [],
            "temperature_log": [],
            "position_log": [],
            "crossing_incidents": [],
            "emergency_actions": [],
            "operator_acknowledgments": [],
            "segment_escalations": [],
        }
        self.waypoints = ROUTE_DATA["waypoints"]
        self.crossing_fusion = CrossingSensorFusionPrototype(CROSSING_CAMERA_OBJECTS, ALERT_RECIPIENTS)
        self.setup_database()

    def setup_database(self):
        try:
            self.conn = sqlite3.connect(str(JOURNEY_DATABASE_PATH))
            self.cursor = self.conn.cursor()
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS journey_logs(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    event_type TEXT,
                    data TEXT
                )
            """)
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS obstacles_log(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    latitude REAL,
                    longitude REAL,
                    obstacle_type TEXT,
                    severity TEXT,
                    location TEXT,
                    metadata TEXT
                )
            """)
            self._ensure_obstacles_metadata_column()
            self.conn.commit()
        except Exception as exc:
            print(f"Database error: {exc}")

    def _ensure_obstacles_metadata_column(self):
        self.cursor.execute("PRAGMA table_info(obstacles_log)")
        columns = {row[1] for row in self.cursor.fetchall()}
        if "metadata" not in columns:
            self.cursor.execute("ALTER TABLE obstacles_log ADD COLUMN metadata TEXT")

    def simulate_journey(self):
        print(f"\n{'=' * 70}")
        print(f"🚂 Railway Journey Simulation - {self.train_id}")
        print(f"{'=' * 70}")
        print(f"Route: {ROUTE_DATA['start']['name']} → {ROUTE_DATA['end']['name']}")
        print(f"Total Distance: {self.journey_log['total_distance_km']} km")
        print(f"{'=' * 70}\n")
        self.start_time = datetime.now()
        self.journey_log["start_time"] = self.start_time.isoformat()
        try:
            for i in range(1, len(self.waypoints)):
                self.simulate_segment(self.waypoints[i - 1], self.waypoints[i])
            self.end_time = datetime.now()
            self.journey_log["end_time"] = self.end_time.isoformat()
            duration = (self.end_time - self.start_time).total_seconds() / 60
            avg_speed = self.calculate_average_speed()
            self.journey_log["average_speed"] = round(avg_speed, 2)
            self.log_event("JOURNEY_COMPLETE", f"Journey completed in {duration:.1f} minutes")
            print(f"\n{'=' * 70}")
            print("✅ Journey Completed!")
            print(f"Duration: {duration:.1f} minutes")
            print(f"Average Speed: {avg_speed:.2f} km/h")
            print(f"{'=' * 70}")
            return True
        except Exception as exc:
            print(f"❌ Journey error: {exc}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.log_event("JOURNEY_ENDED", "Journey simulation ended")

    def calculate_average_speed(self) -> float:
        if not self.journey_log["speed_log"]:
            return 0.0
        speed_values = [entry["speed_kmh"] for entry in self.journey_log["speed_log"]]
        return sum(speed_values) / len(speed_values)

    def simulate_segment(self, from_waypoint: dict, to_waypoint: dict):
        waypoint_name = to_waypoint["name"]
        distance = to_waypoint["distance_from_start_km"] - from_waypoint["distance_from_start_km"]
        print(f"📍 {from_waypoint['name']} → {waypoint_name} ({distance} km)")
        segment_speed = SPEED_PROFILE["highway"]
        if waypoint_name in ["Cannes", "Nice", "Monaco"]:
            segment_speed = SPEED_PROFILE["suburban"]
        elif waypoint_name in ["Valence", "Avignon", "Toulon"]:
            segment_speed = SPEED_PROFILE["mountainous"]

        num_updates = max(int(distance / SIMULATION_DISTANCE_STEP_KM), 2)
        crossing_alerts_in_segment = 0
        high_risk_crossing_alerts = 0
        emergency_mode = False
        stop_hold_events_in_segment = 0
        next_stop_hold_threshold = CROSSING_EMERGENCY_POLICY["stop_hold_alert_threshold"]
        segment_aborted = False

        for step in range(num_updates):
            progress = step / num_updates
            lat = from_waypoint["latitude"] + (to_waypoint["latitude"] - from_waypoint["latitude"]) * progress
            lon = from_waypoint["longitude"] + (to_waypoint["longitude"] - from_waypoint["longitude"]) * progress
            current_speed = max(0, min(segment_speed + random.uniform(-10, 10), 140))
            temp_before = TEMPERATURE_VARIATION.get(from_waypoint.get("name"), 20)
            temp_after = TEMPERATURE_VARIATION.get(to_waypoint.get("name"), 20)
            current_temp = temp_before + (temp_after - temp_before) * progress + random.uniform(-2, 2)

            if waypoint_name in OBSTACLES_PROBABILITY and random.random() < OBSTACLES_PROBABILITY[waypoint_name]["probability"]:
                self.detect_obstacle(waypoint_name, lat, lon)

            for crossing in self._get_intersections_for_waypoint(waypoint_name):
                if random.random() < crossing["trigger_probability"]:
                    incident = self.detect_crossing_issue(crossing, lat, lon, current_speed)
                    crossing_alerts_in_segment += 1
                    if incident.get("severity") == "HIGH":
                        high_risk_crossing_alerts += 1

            if not emergency_mode and crossing_alerts_in_segment >= CROSSING_EMERGENCY_POLICY["segment_alert_threshold"]:
                emergency_mode = True
                self.trigger_crossing_emergency(waypoint_name, crossing_alerts_in_segment)

            stop_and_hold_mode = False
            if high_risk_crossing_alerts >= next_stop_hold_threshold:
                stop_and_hold_mode = True
                stop_hold_events_in_segment += 1
                self.trigger_crossing_stop_and_hold(waypoint_name, high_risk_crossing_alerts)
                next_stop_hold_threshold += CROSSING_EMERGENCY_POLICY["stop_hold_alert_threshold"]
                if CROSSING_EMERGENCY_POLICY.get("abort_on_repeat_stop_hold", True) and stop_hold_events_in_segment > CROSSING_EMERGENCY_POLICY.get("max_stop_holds_per_segment", 1):
                    segment_aborted = True
                    self.trigger_crossing_segment_abort(waypoint_name, high_risk_crossing_alerts, stop_hold_events_in_segment)

            if stop_and_hold_mode:
                current_speed = 0
            elif emergency_mode:
                current_speed = min(current_speed, CROSSING_EMERGENCY_POLICY["emergency_speed_kmh"])

            self.journey_log["position_log"].append({"timestamp": datetime.now().isoformat(), "latitude": round(lat, 4), "longitude": round(lon, 4), "waypoint": waypoint_name})
            self.journey_log["speed_log"].append({"timestamp": datetime.now().isoformat(), "speed_kmh": round(current_speed, 2)})
            self.journey_log["temperature_log"].append({"timestamp": datetime.now().isoformat(), "temperature_celsius": round(current_temp, 2)})
            self.journey_log["max_speed"] = max(self.journey_log["max_speed"], round(current_speed, 2))
            self.journey_log["min_temperature"] = min(self.journey_log["min_temperature"], round(current_temp, 2))
            self.journey_log["max_temperature"] = max(self.journey_log["max_temperature"], round(current_temp, 2))

            sleep_seconds = STANDALONE_SIMULATION_SLEEP_SECONDS
            if stop_and_hold_mode:
                sleep_seconds = max(sleep_seconds, CROSSING_EMERGENCY_POLICY["stop_hold_seconds"])
            elif emergency_mode:
                sleep_seconds = max(sleep_seconds, CROSSING_EMERGENCY_POLICY["dwell_seconds"])
            time.sleep(sleep_seconds)
            if segment_aborted:
                break

        self.journey_log["waypoints_visited"].append({
            "name": waypoint_name,
            "latitude": to_waypoint["latitude"],
            "longitude": to_waypoint["longitude"],
            "distance_from_start_km": to_waypoint["distance_from_start_km"],
            "timestamp": datetime.now().isoformat(),
            "aborted_due_to_crossing_risk": segment_aborted,
        })
        print(f"  ⚠ Controlled segment abort at {waypoint_name} after repeated crossing stop-holds" if segment_aborted else f"  ✓ Reached {waypoint_name}")

    def _get_intersections_for_waypoint(self, waypoint_name: str) -> List[Dict]:
        return [crossing for crossing in ROAD_RAIL_INTERSECTIONS if crossing.get("near_waypoint") == waypoint_name]

    def detect_obstacle(self, location: str, lat: float, lon: float):
        obstacle_info = OBSTACLES_PROBABILITY[location]
        obstacle_type = obstacle_info["name"]
        severity = obstacle_info["severity"]
        confidence = random.uniform(0.7, 0.99)
        obstacle_data = {
            "timestamp": datetime.now().isoformat(),
            "location": location,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "type": obstacle_type,
            "severity": severity,
            "confidence": round(confidence, 3),
        }
        self.journey_log["obstacles_detected"].append(obstacle_data)
        self.cursor.execute("""
            INSERT INTO obstacles_log(timestamp, train_id, latitude, longitude, obstacle_type, severity, location, metadata)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        """, (_current_timestamp(), self.train_id, lat, lon, obstacle_type, severity, location, None))
        self.conn.commit()
        severity_color = "🔴" if severity == "HIGH" else "🟡" if severity == "MEDIUM" else "🟢"
        print(f"  {severity_color} Obstacle detected: {obstacle_type} ({severity})")

    def detect_crossing_issue(self, crossing: Dict, lat: float, lon: float, speed: float, sensor_inputs: Optional[Dict] = None):
        obstacle_data = self.crossing_fusion.fuse_crossing_event(crossing, lat, lon, speed, sensor_inputs=sensor_inputs)
        self.journey_log["obstacles_detected"].append(obstacle_data)
        self.journey_log["crossing_incidents"].append(obstacle_data)
        self.cursor.execute(
            """
            INSERT INTO obstacles_log(timestamp, train_id, latitude, longitude, obstacle_type, severity, location, metadata)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (_current_timestamp(), self.train_id, lat, lon, obstacle_data["type"], obstacle_data["severity"], crossing["near_waypoint"], json.dumps({
                "sensor_type": obstacle_data["sensor_type"],
                "camera_id": obstacle_data["camera_id"],
                "infrared_sensor_id": obstacle_data["infrared_sensor_id"],
                "crossing_name": obstacle_data["crossing_name"],
                "detected_object_category": obstacle_data["detected_object_category"],
                "alert_targets": obstacle_data["alert_targets"],
                "recommended_actions": obstacle_data["recommended_actions"],
                "alert_message": obstacle_data["alert_message"],
                "sensor_inputs": obstacle_data["sensor_inputs"],
            })),
        )
        self.conn.commit()
        severity_color = "🔴" if obstacle_data["severity"] == "HIGH" else "🟡"
        print(f"  {severity_color} Crossing fusion alert: {obstacle_data['type']} at {crossing['name']} ({obstacle_data['severity']})")
        return obstacle_data

    def trigger_crossing_emergency(self, waypoint_name: str, alert_count: int):
        event = {
            "timestamp": datetime.now().isoformat(),
            "location": waypoint_name,
            "alert_count": alert_count,
            "action": "AUTO_EMERGENCY_SLOWDOWN",
            "target_speed_kmh": CROSSING_EMERGENCY_POLICY["emergency_speed_kmh"],
        }
        self.journey_log["emergency_actions"].append(event)
        self.log_event("CROSSING_EMERGENCY", json.dumps(event))
        print(f"  ⛔ Emergency mitigation: repeated crossing alerts at {waypoint_name} -> speed capped to {CROSSING_EMERGENCY_POLICY['emergency_speed_kmh']} km/h")

    def trigger_crossing_stop_and_hold(self, waypoint_name: str, high_risk_alert_count: int):
        event = {
            "timestamp": datetime.now().isoformat(),
            "location": waypoint_name,
            "alert_count": high_risk_alert_count,
            "action": "AUTO_STOP_AND_HOLD",
            "hold_seconds": CROSSING_EMERGENCY_POLICY["stop_hold_seconds"],
            "target_speed_kmh": 0,
            "requires_operator_ack": CROSSING_EMERGENCY_POLICY["require_operator_ack"],
        }
        if CROSSING_EMERGENCY_POLICY["require_operator_ack"]:
            event["operator_ack"] = self.record_operator_acknowledgment(waypoint_name, event["action"])
        self.journey_log["emergency_actions"].append(event)
        self.log_event("CROSSING_STOP_HOLD", json.dumps(event))
        print(f"  🛑 Stop-and-hold activated at {waypoint_name} for {CROSSING_EMERGENCY_POLICY['stop_hold_seconds']}s")

    def trigger_crossing_segment_abort(self, waypoint_name: str, alert_count: int, stop_hold_count: int):
        event = {
            "timestamp": datetime.now().isoformat(),
            "location": waypoint_name,
            "alert_count": alert_count,
            "stop_hold_count": stop_hold_count,
            "action": "SEGMENT_ABORT_AND_ESCALATE",
            "reason": "Repeated stop-and-hold in same segment",
            "requires_operator_ack": CROSSING_EMERGENCY_POLICY["require_operator_ack"],
        }
        if CROSSING_EMERGENCY_POLICY["require_operator_ack"]:
            event["operator_ack"] = self.record_operator_acknowledgment(waypoint_name, event["action"])
        self.journey_log["segment_escalations"].append(event)
        self.journey_log["emergency_actions"].append(event)
        self.log_event("CROSSING_SEGMENT_ABORT", json.dumps(event))
        print(f"  🚨 Segment escalation: repeated stop-and-hold at {waypoint_name} -> segment marked for incident response")

    def record_operator_acknowledgment(self, waypoint_name: str, action: str):
        ack = {
            "timestamp": datetime.now().isoformat(),
            "location": waypoint_name,
            "action": action,
            "status": "AUTO_ACKNOWLEDGED",
            "operator_id": "SYSTEM_AUTO",
        }
        self.journey_log["operator_acknowledgments"].append(ack)
        self.log_event("OPERATOR_ACK", json.dumps(ack))
        return ack

    def log_event(self, event_type: str, data: str):
        try:
            self.cursor.execute("""
                INSERT INTO journey_logs(timestamp, train_id, event_type, data)
                VALUES(?, ?, ?, ?)
            """, (_current_timestamp(), self.train_id, event_type, data))
            self.conn.commit()
        except Exception as exc:
            print(f"Error logging event: {exc}")

    def print_summary(self):
        print(f"\n{'=' * 70}")
        print(f"📊 JOURNEY SUMMARY - {self.train_id}")
        print(f"{'=' * 70}")
        print(f"Route: {ROUTE_DATA['start']['name']} → {ROUTE_DATA['end']['name']}")
        print(f"Distance: {self.journey_log['total_distance_km']} km")
        print(f"Start Time: {self.journey_log['start_time']}")
        print(f"End Time: {self.journey_log['end_time']}")
        print("\n🚄 Speed Metrics:")
        print(f"  • Average Speed: {self.journey_log['average_speed']:.2f} km/h")
        print(f"  • Maximum Speed: {self.journey_log['max_speed']:.2f} km/h")
        print("\n🌡️  Temperature Metrics:")
        print(f"  • Minimum: {self.journey_log['min_temperature']:.2f} °C")
        print(f"  • Maximum: {self.journey_log['max_temperature']:.2f} °C")
        print(f"  • Range: {self.journey_log['max_temperature'] - self.journey_log['min_temperature']:.2f} °C")
        print(f"\n🚨 Obstacles Detected: {len(self.journey_log['obstacles_detected'])}")
        for obstacle in self.journey_log['obstacles_detected']:
            print(f"  • {obstacle['type']} at {obstacle['location']} ({obstacle['severity']})")
        crossing_incidents = [item for item in self.journey_log['obstacles_detected'] if item.get('category') == 'ROAD_RAIL_INTERSECTION']
        print(f"\n🚧 Road-Rail Intersection Incidents: {len(crossing_incidents)}")
        for incident in crossing_incidents[:5]:
            print(f"  • {incident.get('crossing_name', 'Unknown Crossing')} ({incident['severity']})")
        print(f"\n⛔ Emergency Actions Triggered: {len(self.journey_log['emergency_actions'])}")
        for event in self.journey_log['emergency_actions'][:5]:
            print(f"  • {event['action']} at {event['location']} (alerts: {event['alert_count']})")
        print(f"\n🚨 Segment Escalations: {len(self.journey_log['segment_escalations'])}")
        print(f"\n✅ Operator Acknowledgments: {len(self.journey_log['operator_acknowledgments'])}")
        print(f"\n📍 Waypoints Visited: {len(self.journey_log['waypoints_visited'])}")
        for wp in self.journey_log['waypoints_visited']:
            print(f"  • {wp['name']} ({wp['distance_from_start_km']} km from start)")
        print(f"{'=' * 70}\n")

    def save_journey_report(self, filename: str = None, output_dir: str | Path | None = None):
        run_dir = Path(output_dir) if output_dir is not None else create_run_report_dir(self.train_id)
        run_dir.mkdir(parents=True, exist_ok=True)
        if filename is None:
            filename = str(run_dir / f"journey_report_{self.train_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        report = {
            "journey_metadata": {
                "train_id": self.journey_log["train_id"],
                "start_time": self.journey_log["start_time"],
                "end_time": self.journey_log["end_time"],
                "route": {
                    "start": ROUTE_DATA["start"]["name"],
                    "end": ROUTE_DATA["end"]["name"],
                    "total_distance_km": self.journey_log["total_distance_km"],
                },
            },
            "performance_metrics": {
                "average_speed_kmh": self.journey_log["average_speed"],
                "max_speed_kmh": self.journey_log["max_speed"],
                "min_temperature_celsius": self.journey_log["min_temperature"],
                "max_temperature_celsius": self.journey_log["max_temperature"],
                "temperature_range": round(self.journey_log["max_temperature"] - self.journey_log["min_temperature"], 2),
            },
            "obstacles": {"total_detected": len(self.journey_log["obstacles_detected"]), "obstacles_list": self.journey_log["obstacles_detected"]},
            "crossing_safety": {
                "total_crossing_incidents": len(self.journey_log["crossing_incidents"]),
                "crossing_incidents": self.journey_log["crossing_incidents"],
                "emergency_actions_triggered": len(self.journey_log["emergency_actions"]),
                "emergency_actions": self.journey_log["emergency_actions"],
                "stop_and_hold_actions": len([event for event in self.journey_log["emergency_actions"] if event.get("action") == "AUTO_STOP_AND_HOLD"]),
                "segment_escalations_triggered": len(self.journey_log["segment_escalations"]),
                "segment_escalations": self.journey_log["segment_escalations"],
                "operator_acknowledgments": self.journey_log["operator_acknowledgments"],
            },
            "waypoints_visited": self.journey_log["waypoints_visited"],
            "speed_log_summary": {"total_entries": len(self.journey_log["speed_log"]), "sample_entries": self.journey_log["speed_log"][:5]},
            "temperature_log_summary": {"total_entries": len(self.journey_log["temperature_log"]), "sample_entries": self.journey_log["temperature_log"][:5]},
        }
        try:
            with open(filename, "w", encoding="utf-8") as handle:
                json.dump(report, handle, indent=2, ensure_ascii=False)
            print(f"\n📄 Journey report saved: {filename}")
            report_gen = ReportGenerator(self.journey_log, output_dir=run_dir)
            html_file = report_gen.generate_html_report()
            csv_file = report_gen.generate_csv_report()
            return filename, html_file, csv_file
        except Exception as exc:
            print(f"❌ Error saving report: {exc}")
            return None, None, None

    def close(self):
        if self.conn:
            self.cursor.close()
            self.conn.close()
