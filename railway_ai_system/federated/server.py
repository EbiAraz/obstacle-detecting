"""Federated learning server runtime and aggregation strategy helpers."""

import logging
from typing import List, Tuple

import flwr as fl
from flwr.common import Metrics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class _DropFlowerDeprecationFilter(logging.Filter):
    """Hide noisy Flower deprecation warnings while keeping runtime errors visible."""

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return "DEPRECATED FEATURE" not in message


logging.getLogger("flwr").addFilter(_DropFlowerDeprecationFilter())


class FedAvgServer:
    """Federated averaging server metrics helper."""

    @staticmethod
    def weighted_average(metrics: List[Tuple[int, Metrics]]) -> Metrics:
        if not metrics:
            return {}

        total_examples = sum(num_examples for num_examples, _ in metrics)
        if total_examples == 0:
            losses = [metric.get("loss", 0.0) for _, metric in metrics]
            accuracies = [metric.get("accuracy", 0.0) for _, metric in metrics]
            return {
                "loss": sum(losses) / len(losses) if losses else 0.0,
                "accuracy": sum(accuracies) / len(accuracies) if accuracies else 0.0,
            }

        weighted_loss = sum((num_examples / total_examples) * metric.get("loss", 0) for num_examples, metric in metrics)
        weighted_accuracy = sum(
            (num_examples / total_examples) * metric.get("accuracy", 0) for num_examples, metric in metrics
        )
        return {"loss": weighted_loss, "accuracy": weighted_accuracy}


def start_federated_server(
    num_rounds: int = 5,
    num_clients: int = 2,
    server_address: str = "0.0.0.0:8080",
):
    """Start the federated learning server with a FedAvg strategy."""
    logger.info("Starting federated learning server")
    strategy = fl.server.strategy.FedAvg(
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=num_clients,
        min_evaluate_clients=num_clients,
        min_available_clients=num_clients,
        evaluate_metrics_aggregation_fn=FedAvgServer.weighted_average,
    )
    fl.server.start_server(
        server_address=server_address,
        strategy=strategy,
        config=fl.server.ServerConfig(num_rounds=num_rounds, round_timeout=600),
    )