"""Shared federated learning model/client-side training utilities."""

import logging
from typing import Dict, List, Tuple

import torch
import torch.nn as nn

from railway_ai_system.core.ai import ObstacleDataset, ObstacleDetectionModel

logger = logging.getLogger(__name__)


class FederatedObstacleDetector:
    """Federated learning client for distributed obstacle detection."""

    def __init__(self, train_id: str, device: str = "cpu"):
        self.train_id = train_id
        self.device = torch.device(device)
        self.model = ObstacleDetectionModel().to(self.device)
        self.local_data = []

    def set_training_data(self, training_data: List[Dict]):
        self.local_data = training_data
        logger.info("[%s] Training data set: %s samples", self.train_id, len(training_data))

    def train(self, epochs: int = 5, batch_size: int = 32, learning_rate: float = 0.001) -> Tuple[int, float]:
        if not self.local_data:
            logger.warning("[%s] No training data available", self.train_id)
            return 0, 0.0

        dataset = ObstacleDataset(self.local_data)
        dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)

        self.model.train()
        total_loss = 0.0

        for epoch in range(epochs):
            epoch_loss = 0.0

            for features, labels in dataloader:
                features = features.to(self.device)
                labels = labels.to(self.device)

                optimizer.zero_grad()
                logits, _ = self.model(features)
                loss = criterion(logits, labels)
                loss.backward()
                optimizer.step()

                epoch_loss += loss.item()

            avg_loss = epoch_loss / len(dataloader)
            total_loss += avg_loss
            logger.info("[%s] Epoch %s/%s - Loss: %.4f", self.train_id, epoch + 1, epochs, avg_loss)

        return len(dataset), total_loss / epochs

    def evaluate(self) -> Tuple[float, Dict[str, float]]:
        if not self.local_data:
            return 1.0, {}

        dataset = ObstacleDataset(self.local_data)
        dataloader = torch.utils.data.DataLoader(dataset, batch_size=32)

        self.model.eval()
        correct = 0
        total = 0
        loss = 0.0
        criterion = nn.CrossEntropyLoss()

        with torch.no_grad():
            for features, labels in dataloader:
                features = features.to(self.device)
                labels = labels.to(self.device)
                logits, _ = self.model(features)
                loss += criterion(logits, labels).item()
                _, predicted = logits.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()

        accuracy = correct / total if total > 0 else 0.0
        return loss / len(dataloader), {"accuracy": accuracy}

    def get_model_parameters(self) -> List[bytes]:
        return [param.data.cpu().numpy() for param in self.model.parameters()]

    def set_model_parameters(self, parameters: List[bytes]):
        with torch.no_grad():
            for param, new_param in zip(self.model.parameters(), parameters):
                param.data = torch.tensor(new_param, dtype=param.dtype, device=self.device)
        logger.info("[%s] Model parameters updated", self.train_id)