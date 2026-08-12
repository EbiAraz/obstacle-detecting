"""Federal central server implementation."""

import json
import socket
import threading
import sqlite3
from contextlib import suppress
from datetime import datetime
from typing import Dict, List, Tuple


class RailwayServer:
    """Central server that manages train clients and obstacle distribution."""

    def __init__(self, host: str = "localhost", port: int = 5000):
        self.host = host
        self.port = port
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.clients: Dict[str, Tuple[socket.socket, dict]] = {}
        self.obstacles: List[dict] = []
        self.lock = threading.Lock()
        self.conn = None
        self.cursor = None
        self.setup_database()

    def setup_database(self):
        try:
            self.conn = sqlite3.connect(":memory:", check_same_thread=False)
            self.cursor = self.conn.cursor()
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS server_logs(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    event_type TEXT,
                    data TEXT
                )
            """)
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS obstacles(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    train_id TEXT,
                    latitude REAL,
                    longitude REAL,
                    obstacle_type TEXT,
                    severity TEXT,
                    weight REAL
                )
            """)
            self.conn.commit()
        except Exception as exc:
            print(f"Database error: {exc}")

    def start_server(self):
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        print("🚂 Federal Railway Server Started")
        print(f"📡 Listening on {self.host}:{self.port}")
        print("=" * 60)
        try:
            while True:
                client_socket, address = self.server_socket.accept()
                print(f"✅ New connection from {address}")
                client_thread = threading.Thread(target=self.handle_client, args=(client_socket, address), daemon=True)
                client_thread.start()
        except KeyboardInterrupt:
            print("\n⛔ Server shutting down...")
            self.shutdown()

    def handle_client(self, client_socket: socket.socket, address):
        train_id = None
        try:
            while True:
                data = client_socket.recv(4096).decode("utf-8")
                if not data:
                    break
                message = json.loads(data)
                if message.get("type") == "register":
                    train_id = message.get("train_id")
                    with self.lock:
                        self.clients[train_id] = (client_socket, message)
                    print(f"🚄 Train {train_id} registered")
                    self.log_event(train_id, "REGISTER", f"Train registered from {address}")
                elif message.get("type") == "obstacle_detected":
                    self.handle_obstacle(message, train_id)
                elif message.get("type") == "status_update":
                    self.log_event(train_id, "STATUS_UPDATE", json.dumps(message.get("data")))
                elif message.get("type") == "heartbeat":
                    response = {"type": "heartbeat_ack", "timestamp": datetime.now().isoformat()}
                    client_socket.send(json.dumps(response).encode("utf-8"))
        except Exception as exc:
            print(f"❌ Error handling client {train_id}: {exc}")
        finally:
            if train_id and train_id in self.clients:
                with self.lock:
                    del self.clients[train_id]
                print(f"🛑 Train {train_id} disconnected")
            client_socket.close()

    def handle_obstacle(self, message: dict, train_id: str):
        obstacle = {
            "id": len(self.obstacles) + 1,
            "train_id": train_id,
            "timestamp": datetime.now().isoformat(),
            "latitude": message.get("latitude"),
            "longitude": message.get("longitude"),
            "obstacle_type": message.get("obstacle_type"),
            "severity": message.get("severity"),
            "weight": message.get("weight", 0),
            "confidence": message.get("confidence", 0.0),
        }
        with self.lock:
            self.obstacles.append(obstacle)
        self.cursor.execute(
            """
            INSERT INTO obstacles(train_id, latitude, longitude, obstacle_type, severity, weight)
            VALUES(?, ?, ?, ?, ?, ?)
            """,
            (train_id, obstacle["latitude"], obstacle["longitude"], obstacle["obstacle_type"], obstacle["severity"], obstacle["weight"]),
        )
        self.conn.commit()
        print(f"🚨 Obstacle detected by {train_id}: {obstacle['obstacle_type']} (Severity: {obstacle['severity']})")
        self.broadcast_obstacle(obstacle, exclude_train=train_id)
        self.log_event(train_id, "OBSTACLE_DETECTED", json.dumps(obstacle))

    def broadcast_obstacle(self, obstacle: dict, exclude_train: str = None):
        message_json = json.dumps({"type": "obstacle_alert", "obstacle": obstacle})
        with self.lock:
            for train_id, (client_socket, _) in list(self.clients.items()):
                if train_id != exclude_train:
                    try:
                        client_socket.send(message_json.encode("utf-8"))
                    except Exception:
                        pass

    def log_event(self, train_id: str, event_type: str, data: str):
        try:
            self.cursor.execute(
                """
                INSERT INTO server_logs(train_id, event_type, data)
                VALUES(?, ?, ?)
                """,
                (train_id, event_type, data),
            )
            self.conn.commit()
        except Exception as exc:
            print(f"Error logging event: {exc}")

    def get_server_stats(self) -> dict:
        return {
            "active_trains": len(self.clients),
            "total_obstacles": len(self.obstacles),
            "connected_clients": list(self.clients.keys()),
            "obstacles": self.obstacles,
        }

    def shutdown(self):
        with self.lock:
            for train_id, (client_socket, _) in self.clients.items():
                with suppress(Exception):
                    client_socket.close()
        self.server_socket.close()
        if self.conn:
            self.cursor.close()
            self.conn.close()
        print("✅ Server shutdown complete")
