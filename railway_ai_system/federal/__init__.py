"""Federal server/client simulation components."""

from railway_ai_system.federal.client import TrainClient, calculate_distance
from railway_ai_system.federal.journey import JourneySimulator
from railway_ai_system.federal.launcher import main as federal_main
from railway_ai_system.federal.server import RailwayServer

__all__ = [
    "TrainClient",
    "calculate_distance",
    "JourneySimulator",
    "RailwayServer",
    "federal_main",
]
