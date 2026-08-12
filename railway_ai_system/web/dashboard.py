"""Flask dashboard app factory for the railway AI system."""

import time
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS

from railway_ai_system.config import (
    DEFAULT_DASHBOARD_HOST,
    DEFAULT_DASHBOARD_PORT,
    DASHBOARD_CACHE_TTL_SECONDS,
    DASHBOARD_MAP_CACHE_TTL_SECONDS,
    DATABASE_PATH,
    JOURNEY_DATABASE_PATH,
    LEGACY_SENSOR_DATABASE_PATH,
    PROJECT_ROOT,
    STATIC_IMAGES_DIR,
    STATIC_LOGS_DIR,
    STATIC_MAPS_DIR,
    STATIC_DIR,
    TEMPLATES_DIR,
    default_train_state,
    ensure_runtime_directories,
)
from railway_ai_system.services.monitoring import OperatorMonitor, build_journey_map


def _frontend_dist_dir() -> Path:
        return PROJECT_ROOT / "dist"


def _frontend_ready() -> bool:
        return (_frontend_dist_dir() / "index.html").exists()


def _frontend_not_ready_response() -> tuple[str, int, dict[str, str]]:
        html = """
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dashboard Build Required</title>
        <style>
            body { font-family: Segoe UI, sans-serif; margin: 2rem; background: #f3f6fa; color: #1f2937; }
            .card { max-width: 780px; background: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
            code { background: #eef2f7; padding: .2rem .4rem; border-radius: 6px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Dashboard UI bundle is missing</h2>
            <p>The backend is running, but the frontend bundle was not found in <code>dist/</code>.</p>
            <p>Run <code>npm run build</code> in the project root, then refresh.</p>
        </div>
    </body>
</html>
"""
        return html, 503, {"Content-Type": "text/html; charset=utf-8"}


def create_dashboard_app(monitor_factory=None) -> Flask:
    """Create and configure the Flask dashboard application."""
    ensure_runtime_directories()

    app = Flask(__name__, static_folder=str(STATIC_DIR))
    CORS(app)
    app.train_state = default_train_state()
    api_cache: dict[str, tuple[float, object]] = {}

    factory = monitor_factory or OperatorMonitor

    def _get_cached(cache_key: str, ttl_seconds: int, producer):
        now = time.time()
        cached = api_cache.get(cache_key)
        if cached and now - cached[0] < ttl_seconds:
            return cached[1]
        value = producer()
        api_cache[cache_key] = (now, value)
        return value

    @app.route("/")
    def dashboard():
        if not _frontend_ready():
            html, status, headers = _frontend_not_ready_response()
            headers["X-Dashboard-Mode"] = "fallback-missing-dist"
            return html, status, headers
        response = send_from_directory(str(_frontend_dist_dir()), "index.html")
        response.headers["X-Dashboard-Mode"] = "dist-index"
        return response

    @app.route("/mobile")
    def mobile_dashboard():
        if not _frontend_ready():
            html, status, headers = _frontend_not_ready_response()
            headers["X-Dashboard-Mode"] = "fallback-missing-dist"
            return html, status, headers
        response = send_from_directory(str(_frontend_dist_dir()), "index.html")
        response.headers["X-Dashboard-Mode"] = "dist-index"
        return response

    @app.route("/assets/<path:filename>")
    def frontend_assets(filename: str):
        return send_from_directory(str(_frontend_dist_dir() / "assets"), filename)

    @app.route("/api/status")
    def get_status():
        monitor = factory()
        stats = monitor.get_journey_stats()
        return jsonify({
            "speed": app.train_state["current_speed"],
            "temperature": app.train_state["current_temp"],
            "latitude": app.train_state["latitude"],
            "longitude": app.train_state["longitude"],
            "obstacles_detected": stats["total_obstacles"],
            "status": app.train_state["status"],
            "last_update": app.train_state["last_update"],
            "timestamp": datetime.now().isoformat(),
        })

    @app.route("/api/obstacles")
    def get_obstacles():
        limit = request.args.get("limit", 10, type=int)
        cache_key = f"obstacles:{limit}"
        payload = _get_cached(cache_key, DASHBOARD_CACHE_TTL_SECONDS, lambda: factory().get_recent_obstacles(limit))
        return jsonify(payload)

    @app.route("/api/map")
    def get_map():
        def produce_map_html():
            monitor = factory()
            positions = monitor.get_journey_path()
            obstacles = monitor.get_recent_obstacles(50)
            map_path = build_journey_map(positions, obstacles)
            with open(map_path, "r", encoding="utf-8") as handle:
                return {"html": handle.read()}

        payload = _get_cached("map:html", DASHBOARD_MAP_CACHE_TTL_SECONDS, produce_map_html)
        return jsonify(payload)

    @app.route("/api/journey-log")
    def get_journey_log():
        try:
            payload = _get_cached("journey-log", DASHBOARD_CACHE_TTL_SECONDS, lambda: factory().get_recent_logs())
            return jsonify(payload)
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.route("/api/stats")
    def get_stats():
        try:
            payload = _get_cached("stats", DASHBOARD_CACHE_TTL_SECONDS, lambda: factory().get_stats_breakdown())
            return jsonify(payload)
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.route("/api/export-logs")
    def export_logs():
        try:
            export_path = factory().export_logs()
            return send_file(export_path, as_attachment=True, download_name=export_path.name)
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.route("/api/health")
    def health_check():
        return jsonify({
            "status": "operational",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
        })

    @app.route("/api/config")
    def get_config():
        return jsonify({
            "project_root": str(PROJECT_ROOT),
            "dashboard_host": DEFAULT_DASHBOARD_HOST,
            "dashboard_port": DEFAULT_DASHBOARD_PORT,
            "api_base": "/api",
            "database_path": str(DATABASE_PATH),
            "journey_database_path": str(JOURNEY_DATABASE_PATH),
            "legacy_sensor_database_path": str(LEGACY_SENSOR_DATABASE_PATH),
            "templates_dir": str(TEMPLATES_DIR),
            "static_dir": str(STATIC_DIR),
        })

    @app.route("/static/maps/<path:filename>")
    def serve_map(filename: str):
        return send_from_directory(str(STATIC_MAPS_DIR), filename)

    @app.route("/static/logs/<path:filename>")
    def serve_log(filename: str):
        return send_from_directory(str(STATIC_LOGS_DIR), filename)

    @app.route("/static/images/<path:filename>")
    def serve_image(filename: str):
        return send_from_directory(str(STATIC_IMAGES_DIR), filename)

    @app.route("/api/mobile/status")
    def mobile_status():
        stats = factory().get_journey_stats()
        return jsonify({
            "speed": round(app.train_state["current_speed"], 1),
            "temp": round(app.train_state["current_temp"], 1),
            "obstacles": stats["total_obstacles"],
            "status": app.train_state["status"],
            "updated": app.train_state["last_update"],
        })

    @app.route("/api/mobile/alerts")
    def mobile_alerts():
        obstacles = _get_cached("mobile-alerts", DASHBOARD_CACHE_TTL_SECONDS, lambda: factory().get_recent_obstacles(5))
        return jsonify({"alerts": obstacles, "count": len(obstacles)})

    return app


app = create_dashboard_app()


if __name__ == "__main__":
    app.run(debug=False, host=DEFAULT_DASHBOARD_HOST, port=DEFAULT_DASHBOARD_PORT)
