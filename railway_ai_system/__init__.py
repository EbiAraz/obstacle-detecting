"""Package entry points for the modular railway AI system."""

from railway_ai_system.app import IntegratedRailwaySystem, main
from railway_ai_system.web.dashboard import app, create_dashboard_app

__all__ = ["IntegratedRailwaySystem", "app", "create_dashboard_app", "main"]
