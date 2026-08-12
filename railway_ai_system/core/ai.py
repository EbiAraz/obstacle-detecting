"""PyTorch-based obstacle detection models and utilities."""

from datetime import datetime
from typing import Dict, List, Tuple
import os

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset


class ObstacleDataset(Dataset):
    """Custom dataset for obstacle detection training."""

    def __init__(self, samples: List[Dict], transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        features = torch.tensor(sample["features"], dtype=torch.float32)
        label = torch.tensor(sample["label"], dtype=torch.long)
        return features, label


class ObstacleDetectionModel(nn.Module):
    """Deep neural network for obstacle detection."""

    def __init__(self, input_size: int = 8, num_classes: int = 6):
        super().__init__()
        self.input_size = input_size
        self.num_classes = num_classes

        self.fc1 = nn.Linear(input_size, 64)
        self.bn1 = nn.BatchNorm1d(64)
        self.dropout1 = nn.Dropout(0.3)

        self.fc2 = nn.Linear(64, 128)
        self.bn2 = nn.BatchNorm1d(128)
        self.dropout2 = nn.Dropout(0.3)

        self.fc3 = nn.Linear(128, 256)
        self.bn3 = nn.BatchNorm1d(256)
        self.dropout3 = nn.Dropout(0.4)

        self.fc4 = nn.Linear(256, 128)
        self.bn4 = nn.BatchNorm1d(128)
        self.dropout4 = nn.Dropout(0.3)

        self.fc5 = nn.Linear(128, 64)
        self.fc_out = nn.Linear(64, num_classes)
        self.confidence = nn.Linear(64, 1)

        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        x = self.relu(self.bn1(self.fc1(x)))
        x = self.dropout1(x)

        x = self.relu(self.bn2(self.fc2(x)))
        x = self.dropout2(x)

        x = self.relu(self.bn3(self.fc3(x)))
        x = self.dropout3(x)

        x = self.relu(self.bn4(self.fc4(x)))
        x = self.dropout4(x)

        features = self.relu(self.fc5(x))
        class_logits = self.fc_out(features)
        confidence = self.sigmoid(self.confidence(features))
        return class_logits, confidence


class AIObstacleDetector:
    """Obstacle detection using a PyTorch model."""

    def __init__(self, model_path: str = None, device: str = "cpu"):
        self.device = torch.device(device)
        self.model = ObstacleDetectionModel().to(self.device)
        self.model.eval()
        self.obstacle_classes = {
            0: "No Obstacle",
            1: "Fallen Rock",
            2: "Debris",
            3: "Animal",
            4: "Construction Equipment",
            5: "Fallen Tree",
        }
        self.severity_map = {
            0: "NONE",
            1: "HIGH",
            2: "MEDIUM",
            3: "LOW",
            4: "HIGH",
            5: "MEDIUM",
        }
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)

    def load_model(self, model_path: str):
        try:
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            print(f"✅ Model loaded from {model_path}")
        except Exception as exc:
            print(f"⚠️ Could not load model: {exc}. Using untrained model.")

    def save_model(self, model_path: str):
        torch.save(self.model.state_dict(), model_path)
        print(f"✅ Model saved to {model_path}")

    def detect(self, sensor_data: Dict) -> Dict:
        features = torch.tensor([
            sensor_data.get("speed", 0),
            sensor_data.get("temperature", 20),
            sensor_data.get("latitude", 0),
            sensor_data.get("longitude", 0),
            sensor_data.get("altitude", 0),
            sensor_data.get("vibration", 0),
            sensor_data.get("sound", 0),
            sensor_data.get("humidity", 50),
        ], dtype=torch.float32).unsqueeze(0).to(self.device)

        with torch.no_grad():
            class_logits, confidence = self.model(features)

        class_idx = class_logits.argmax(dim=1).item()
        confidence_score = confidence.item()
        return {
            "timestamp": datetime.now().isoformat(),
            "obstacle_class": class_idx,
            "obstacle_type": self.obstacle_classes[class_idx],
            "severity": self.severity_map[class_idx],
            "confidence": round(confidence_score, 3),
            "sensor_data": sensor_data,
        }

    def train_model(self, training_data: List[Dict], epochs: int = 10, batch_size: int = 32, learning_rate: float = 0.001):
        print("🚂 Starting AI Model Training...")
        dataset = ObstacleDataset(training_data)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0.0
            correct = 0
            total = 0
            for batch_features, batch_labels in dataloader:
                batch_features = batch_features.to(self.device)
                batch_labels = batch_labels.to(self.device)
                logits, _ = self.model(batch_features)
                loss = criterion(logits, batch_labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
                _, predicted = logits.max(1)
                total += batch_labels.size(0)
                correct += predicted.eq(batch_labels).sum().item()

            accuracy = 100.0 * correct / total
            avg_loss = total_loss / len(dataloader)
            print(f"Epoch {epoch + 1}/{epochs} - Loss: {avg_loss:.4f}, Accuracy: {accuracy:.2f}%")
            scheduler.step()

        self.model.eval()
        print("✅ Training complete!")
