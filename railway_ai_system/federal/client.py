"""Federal train client implementation."""

import json
import math
import random
import socket
import threading
from datetime import datetime


class TrainClient:
    """TCP client used by federal-mode journey simulations."""

    def __init__(self, train_id: str, server_host: str = "localhost", server_port: int = 5000):
        self.train_id = train_id
        self.server_host = server_host
        self.server_port = server_port
        self.socket = None
        self.connected = False
        self.current_position = {"latitude": 0.0, "longitude": 0.0}
        self.current_speed = 0.0
        self.current_temperature = 20.0
        self.weight = random.uniform(400, 600)
        self.obstacles_detected = []
        self.alerts_received = []

    def connect_to_server(self) -> bool:
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.server_host, self.server_port))
            self.connected = True
            print(f"🚄 Train {self.train_id} connected to server")
            registration = {
                "type": "register",
                "train_id": self.train_id,
                "weight": self.weight,
                "timestamp": datetime.now().isoformat(),
            }
            self.socket.send(json.dumps(registration).encode("utf-8"))
            threading.Thread(target=self.listen_for_alerts, daemon=True).start()
            return True
        except Exception as exc:
            print(f"❌ Connection error for train {self.train_id}: {exc}")
            return False

    def update_position(self, latitude: float, longitude: float):
        self.current_position = {"latitude": latitude, "longitude": longitude}

    def update_speed(self, speed: float):
        self.current_speed = speed

    def update_temperature(self, temperature: float):
        self.current_temperature = temperature

    def send_status_update(self):
        if not self.connected:
            return
        status = {
            "type": "status_update",
            "train_id": self.train_id,
            "timestamp": datetime.now().isoformat(),
            "data": {
                "position": self.current_position,
                "speed": self.current_speed,
                "temperature": self.current_temperature,
                "weight": self.weight,
                "obstacles_detected": len(self.obstacles_detected),
            },
        }
        try:
            self.socket.send(json.dumps(status).encode("utf-8"))
        except Exception as exc:
            print(f"Error sending status: {exc}")

    def detect_obstacle(self, obstacle_type: str, severity: str, confidence: float = 0.9) -> bool:
        if not self.connected:
            return False
        obstacle_data = {
            "type": "obstacle_detected",
            "train_id": self.train_id,
            "timestamp": datetime.now().isoformat(),
            "latitude": self.current_position["latitude"],
            "longitude": self.current_position["longitude"],
            "obstacle_type": obstacle_type,
            "severity": severity,
            "weight": self.weight,
            "confidence": confidence,
        }
        self.obstacles_detected.append(obstacle_data)
        try:
            self.socket.send(json.dumps(obstacle_data).encode("utf-8"))
            print(f"🚨 {self.train_id} detected {obstacle_type}: {severity}")
            return True
        except Exception as exc:
            print(f"Error reporting obstacle: {exc}")
            return False

    def listen_for_alerts(self):
        while self.connected:
            try:
                data = self.socket.recv(4096).decode("utf-8")
                if data:
                    message = json.loads(data)
                    if message.get("type") == "obstacle_alert":
                        alert = message.get("obstacle")
                        if alert["train_id"] != self.train_id:
                            self.alerts_received.append(alert)
                            print(
                                f"⚠️  {self.train_id} received alert from {alert['train_id']}: "
                                f"{alert['obstacle_type']} at ({alert['latitude']}, {alert['longitude']})"
                            )
            except Exception:
                break

    def send_heartbeat(self):
        if not self.connected:
            return
        heartbeat = {
            "type": "heartbeat",
            "train_id": self.train_id,
            "timestamp": datetime.now().isoformat(),
        }
        try:
            self.socket.send(json.dumps(heartbeat).encode("utf-8"))
        except Exception:
            pass

    def disconnect(self):
        self.connected = False
        if self.socket:
            self.socket.close()
        print(f"🛑 Train {self.train_id} disconnected")

    def get_journey_summary(self) -> dict:
        return {
            "train_id": self.train_id,
            "weight": self.weight,
            "final_position": self.current_position,
            "final_speed": self.current_speed,
            "final_temperature": self.current_temperature,
            "obstacles_detected": len(self.obstacles_detected),
            "alerts_received": len(self.alerts_received),
            "all_obstacles": self.obstacles_detected,
            "all_alerts": self.alerts_received,
        }


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate simplified coordinate distance in kilometers."""
    return math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2) * 111
