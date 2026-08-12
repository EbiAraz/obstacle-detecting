"""Compatibility imports for federated learning components.

The canonical server and client implementations are split into dedicated modules:
- railway_ai_system.federated.server
- railway_ai_system.federated.client
- railway_ai_system.federated.common
"""

from railway_ai_system.federated.client import FlowerClient, federated_train_client
from railway_ai_system.federated.common import FederatedObstacleDetector
from railway_ai_system.federated.server import FedAvgServer, start_federated_server

__all__ = [
    "FederatedObstacleDetector",
    "FlowerClient",
    "FedAvgServer",
    "federated_train_client",
    "start_federated_server",
]
