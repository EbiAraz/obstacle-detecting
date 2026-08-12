"""Federal-mode journey simulation."""

import json
import random
import time
from datetime import datetime
from pathlib import Path

from railway_ai_system.config import FEDERAL_SIMULATION_SLEEP_SECONDS, SIMULATION_DISTANCE_STEP_KM
from railway_ai_system.reporting.generator import ReportGenerator, create_run_report_dir
from railway_ai_system.domain.route_config import OBSTACLES_PROBABILITY, ROUTE_DATA, SPEED_PROFILE, TEMPERATURE_VARIATION
from railway_ai_system.federal.client import TrainClient


class JourneySimulator:
    """Journey simulator that talks to the federal server."""

    def __init__(self, train_id: str, start_delay: int = 2, server_host: str = "localhost", server_port: int = 5000):
        self.train_id = train_id
        self.train = TrainClient(train_id, server_host=server_host, server_port=server_port)
        self.start_time = None
        self.end_time = None
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
        }
        self.waypoints = ROUTE_DATA["waypoints"]
        self.current_waypoint_idx = 0
        self.start_delay = start_delay

    def simulate_journey(self):
        print(f"\n{'=' * 70}")
        print(f"🚂 Starting Journey Simulation for {self.train_id}")
        print(f"{'=' * 70}")
        print(f"Route: {ROUTE_DATA['start']['name']} → {ROUTE_DATA['end']['name']}")
        print(f"Total Distance: {self.journey_log['total_distance_km']} km")
        print(f"Waiting {self.start_delay} seconds for server to start...")
        time.sleep(self.start_delay)
        if not self.train.connect_to_server():
            print("❌ Failed to connect to server")
            return False
        self.start_time = datetime.now()
        self.journey_log["start_time"] = self.start_time.isoformat()
        try:
            for i, waypoint in enumerate(self.waypoints):
                if i == 0:
                    continue
                self.current_waypoint_idx = i
                self.simulate_segment(self.waypoints[i - 1], waypoint)
            self.end_time = datetime.now()
            self.journey_log["end_time"] = self.end_time.isoformat()
            duration = (self.end_time - self.start_time).total_seconds() / 60
            avg_speed = self.calculate_average_speed()
            self.journey_log["average_speed"] = round(avg_speed, 2)
            print(f"\n{'=' * 70}")
            print("✅ Journey Completed!")
            print(f"Duration: {duration:.1f} minutes")
            print(f"Average Speed: {avg_speed:.2f} km/h")
            print(f"{'=' * 70}")
            return True
        except Exception as exc:
            print(f"❌ Journey error: {exc}")
            return False
        finally:
            self.train.disconnect()

    def calculate_average_speed(self) -> float:
        if not self.journey_log["speed_log"]:
            return 0.0
        speeds = [entry["speed_kmh"] for entry in self.journey_log["speed_log"]]
        return sum(speeds) / len(speeds)

    def simulate_segment(self, from_waypoint: dict, to_waypoint: dict):
        waypoint_name = to_waypoint["name"]
        distance = to_waypoint["distance_from_start_km"] - from_waypoint["distance_from_start_km"]
        print(f"\n📍 Segment: {from_waypoint['name']} → {waypoint_name} ({distance} km)")
        segment_speed = SPEED_PROFILE["highway"]
        if waypoint_name in ["Cannes", "Nice", "Monaco"]:
            segment_speed = SPEED_PROFILE.get("suburban", segment_speed)
        num_updates = max(int(distance / SIMULATION_DISTANCE_STEP_KM), 2)
        for step in range(num_updates):
            progress = step / num_updates
            lat = from_waypoint["latitude"] + (to_waypoint["latitude"] - from_waypoint["latitude"]) * progress
            lon = from_waypoint["longitude"] + (to_waypoint["longitude"] - from_waypoint["longitude"]) * progress
            current_speed = max(0, min(segment_speed + random.uniform(-10, 10), 140))
            temp_before = TEMPERATURE_VARIATION.get(from_waypoint.get("name"), 20)
            temp_after = TEMPERATURE_VARIATION.get(to_waypoint.get("name"), 20)
            current_temp = temp_before + (temp_after - temp_before) * progress + random.uniform(-2, 2)
            self.train.update_position(lat, lon)
            self.train.update_speed(current_speed)
            self.train.update_temperature(current_temp)
            self.journey_log["position_log"].append({"timestamp": datetime.now().isoformat(), "latitude": round(lat, 4), "longitude": round(lon, 4), "waypoint": waypoint_name})
            self.journey_log["speed_log"].append({"timestamp": datetime.now().isoformat(), "speed_kmh": round(current_speed, 2)})
            self.journey_log["temperature_log"].append({"timestamp": datetime.now().isoformat(), "temperature_celsius": round(current_temp, 2)})
            self.journey_log["max_speed"] = max(self.journey_log["max_speed"], round(current_speed, 2))
            self.journey_log["min_temperature"] = min(self.journey_log["min_temperature"], round(current_temp, 2))
            self.journey_log["max_temperature"] = max(self.journey_log["max_temperature"], round(current_temp, 2))
            self.train.send_status_update()
            if waypoint_name in OBSTACLES_PROBABILITY and random.random() < OBSTACLES_PROBABILITY[waypoint_name]["probability"]:
                self.detect_and_report_obstacle(waypoint_name, lat, lon)
            time.sleep(FEDERAL_SIMULATION_SLEEP_SECONDS)
        self.journey_log["waypoints_visited"].append({
            "name": waypoint_name,
            "latitude": to_waypoint["latitude"],
            "longitude": to_waypoint["longitude"],
            "distance_from_start_km": to_waypoint["distance_from_start_km"],
            "timestamp": datetime.now().isoformat(),
        })
        print(f"✓ Reached {waypoint_name}")

    def detect_and_report_obstacle(self, location: str, lat: float, lon: float):
        obstacle_info = OBSTACLES_PROBABILITY[location]
        obstacle_type = obstacle_info["name"]
        severity = obstacle_info["severity"]
        confidence = random.uniform(0.7, 0.99)
        if self.train.detect_obstacle(obstacle_type, severity, confidence):
            self.journey_log["obstacles_detected"].append({
                "timestamp": datetime.now().isoformat(),
                "location": location,
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "type": obstacle_type,
                "severity": severity,
                "confidence": round(confidence, 3),
            })

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
            "obstacles": {
                "total_detected": len(self.journey_log["obstacles_detected"]),
                "obstacles_list": self.journey_log["obstacles_detected"],
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
            print(f"  • {obstacle['type']} at {obstacle['location']} ({obstacle['severity']} severity)")
        print(f"\n📍 Waypoints Visited: {len(self.journey_log['waypoints_visited'])}")
        for wp in self.journey_log['waypoints_visited']:
            print(f"  • {wp['name']} ({wp['distance_from_start_km']} km from start)")
        print(f"{'=' * 70}\n")
