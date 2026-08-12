"""Federated learning client runtime and Flower client adapter."""

import logging
import socket
import time

import flwr as fl

from railway_ai_system.federated.common import FederatedObstacleDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class _DropFlowerDeprecationFilter(logging.Filter):
    """Hide noisy Flower deprecation warnings while keeping runtime errors visible."""

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return "DEPRECATED FEATURE" not in message


logging.getLogger("flwr").addFilter(_DropFlowerDeprecationFilter())


def wait_for_server(server_address: str, timeout_seconds: int = 20, retry_interval: float = 2.0) -> bool:
    """Wait until the FL server socket is reachable."""
    host, port_text = server_address.rsplit(":", maxsplit=1)
    port = int(port_text)
    deadline = time.time() + max(0, timeout_seconds)

    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.settimeout(2)
            if probe.connect_ex((host, port)) == 0:
                return True

        if time.time() >= deadline:
            return False

        time.sleep(max(0.1, retry_interval))


class FlowerClient(fl.client.NumPyClient):
    """Flower client wrapper around the local obstacle detector."""

    def __init__(self, train_id: str, detector: FederatedObstacleDetector):
        self.train_id = train_id
        self.detector = detector

    def fit(self, parameters, config):
        logger.info("[%s] Training started", self.train_id)
        self.detector.set_model_parameters(parameters)
        num_examples, loss = self.detector.train(
            epochs=config.get("epochs", 5),
            batch_size=config.get("batch_size", 32),
            learning_rate=config.get("learning_rate", 0.001),
        )
        safe_examples = max(1, num_examples)
        return self.detector.get_model_parameters(), safe_examples, {"loss": loss}

    def evaluate(self, parameters, config):
        self.detector.set_model_parameters(parameters)
        loss, metrics = self.detector.evaluate()
        safe_examples = max(1, len(self.detector.local_data))
        return loss, safe_examples, metrics


def federated_train_client(
    train_id: str,
    server_address: str = "localhost:8080",
    wait_timeout_seconds: int = 20,
    retry_interval_seconds: float = 2.0,
):
    """Start a federated learning client process and connect to a remote server."""
    logger.info("[%s] Starting federated learning client", train_id)
    if not wait_for_server(
        server_address=server_address,
        timeout_seconds=wait_timeout_seconds,
        retry_interval=retry_interval_seconds,
    ):
        raise RuntimeError(
            f"Federated server is not reachable at {server_address}. "
            "Start federated_server.py first and keep it running."
        )

    detector = FederatedObstacleDetector(train_id)
    client = FlowerClient(train_id, detector)
    fl.client.start_client(
        server_address=server_address,
        client=client.to_client(),
        grpc_max_message_length=1024 * 1024 * 1024,
    )