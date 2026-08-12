"""Shared runtime configuration for the railway AI system."""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
TEMPLATES_DIR = PROJECT_ROOT / "templates"
STATIC_DIR = PROJECT_ROOT / "static"
STATIC_MAPS_DIR = STATIC_DIR / "maps"
STATIC_LOGS_DIR = STATIC_DIR / "logs"
STATIC_IMAGES_DIR = STATIC_DIR / "images"
JOURNEY_LOG_DIR = PROJECT_ROOT / "journey_logs"
JOURNEY_LOG_IMAGES_DIR = JOURNEY_LOG_DIR / "images"
JOURNEY_LOG_MAPS_DIR = JOURNEY_LOG_DIR / "maps"
JOURNEY_LOG_EXPORTS_DIR = JOURNEY_LOG_DIR / "exports"
AI_MODELS_DIR = PROJECT_ROOT / "ai_models"
JOURNEY_DATABASE_PATH = DATA_DIR / "railway_journey.db"
LEGACY_SENSOR_DATABASE_PATH = DATA_DIR / "railway_data.db"
DATABASE_PATH = JOURNEY_DATABASE_PATH
DEFAULT_DASHBOARD_HOST = "0.0.0.0"
DEFAULT_DASHBOARD_PORT = 5001

# Simulation pacing controls
SIMULATION_DISTANCE_STEP_KM = 3.0
STANDALONE_SIMULATION_SLEEP_SECONDS = 0.4
FEDERAL_SIMULATION_SLEEP_SECONDS = 0.6

# Dashboard API performance controls
DASHBOARD_CACHE_TTL_SECONDS = 3
DASHBOARD_MAP_CACHE_TTL_SECONDS = 10
DASHBOARD_PATH_MAX_POINTS = 1200


def ensure_runtime_directories() -> None:
    """Create directories needed at runtime."""
    for path in (
        DATA_DIR,
        STATIC_MAPS_DIR,
        STATIC_LOGS_DIR,
        STATIC_IMAGES_DIR,
        JOURNEY_LOG_DIR,
        JOURNEY_LOG_IMAGES_DIR,
        JOURNEY_LOG_MAPS_DIR,
        JOURNEY_LOG_EXPORTS_DIR,
        AI_MODELS_DIR,
    ):
        path.mkdir(parents=True, exist_ok=True)


def default_train_state() -> dict:
    """Create the default in-memory dashboard state."""
    return {
        "current_speed": 0.0,
        "current_temp": 0.0,
        "latitude": 48.8566,
        "longitude": 2.3522,
        "obstacles_detected": 0,
        "status": "NORMAL",
        "last_update": None,
        "connected_trains": 0,
    }
