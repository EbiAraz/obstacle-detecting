"""
Software-only prototype for rail-road crossing sensor fusion.
Combines simulated RGB camera, infrared, and occupancy readings.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class CameraDetection:
    label: str
    category: str
    confidence: float


@dataclass
class InfraredReading:
    heat_detected: bool
    temperature_delta_c: float
    confidence: float


@dataclass
class OccupancyReading:
    occupied: bool
    confidence: float


class CrossingSensorFusionPrototype:
    """Prototype fusion engine for camera and infrared crossing monitoring."""

    def __init__(self, camera_objects: List[Dict], alert_recipients: List[str]):
        self.camera_objects = camera_objects
        self.alert_recipients = alert_recipients

    def simulate_inputs(self, crossing: Dict, speed: float) -> Dict:
        """Generate software-only sensor readings for a crossing event."""
        detected_object = random.choice(self.camera_objects)

        camera_confidence = round(random.uniform(0.76, 0.98), 3)
        occupancy_confidence = round(random.uniform(0.82, 0.99), 3)

        heat_required = detected_object['category'] in {'PERSON', 'VEHICLE'}
        heat_detected = heat_required or random.random() > 0.45
        temperature_delta = round(
            random.uniform(5.0, 18.0) if heat_detected else random.uniform(0.2, 3.0),
            1,
        )
        infrared_confidence = round(random.uniform(0.72, 0.97), 3)

        return {
            'camera': CameraDetection(
                label=detected_object['label'],
                category=detected_object['category'],
                confidence=camera_confidence,
            ),
            'infrared': InfraredReading(
                heat_detected=heat_detected,
                temperature_delta_c=temperature_delta,
                confidence=infrared_confidence,
            ),
            'occupancy': OccupancyReading(
                occupied=True,
                confidence=occupancy_confidence,
            ),
            'crossing': crossing,
            'speed': speed,
            'recommended_actions': detected_object['recommended_actions'],
        }

    def fuse_crossing_event(
        self,
        crossing: Dict,
        lat: float,
        lon: float,
        speed: float,
        sensor_inputs: Optional[Dict] = None,
    ) -> Dict:
        """Fuse camera, infrared, and occupancy data into one crossing incident."""
        sensor_inputs = sensor_inputs or self.simulate_inputs(crossing, speed)

        camera = sensor_inputs['camera']
        infrared = sensor_inputs['infrared']
        occupancy = sensor_inputs['occupancy']

        fusion_score = round(
            (camera.confidence * 0.45)
            + (infrared.confidence * 0.25)
            + (occupancy.confidence * 0.30),
            3,
        )

        severity = 'MEDIUM'
        if crossing.get('risk_level') == 'HIGH' or speed > 90 or camera.category in {'PERSON', 'VEHICLE'}:
            severity = 'HIGH'

        alert_targets = list(self.alert_recipients)
        if camera.category == 'VEHICLE':
            alert_targets.append('road_operator')

        recommended_actions = list(sensor_inputs['recommended_actions'])
        if infrared.heat_detected and 'Dispatch crossing assistance' not in recommended_actions:
            recommended_actions.append('Verify thermal hotspot with operator')

        return {
            'timestamp': datetime.now().isoformat(),
            'location': crossing['near_waypoint'],
            'latitude': round(lat, 4),
            'longitude': round(lon, 4),
            'type': camera.label,
            'severity': severity,
            'confidence': fusion_score,
            'crossing_name': crossing['name'],
            'category': 'ROAD_RAIL_INTERSECTION',
            'sensor_type': 'CAMERA_IR_FUSION',
            'camera_id': crossing.get('camera_id', 'CAM-UNKNOWN'),
            'infrared_sensor_id': crossing.get('infrared_sensor_id', 'IR-UNKNOWN'),
            'detected_object_category': camera.category,
            'alert_targets': alert_targets,
            'recommended_actions': recommended_actions,
            'alert_message': (
                f"{camera.label} detected at {crossing['name']} by fused camera/IR monitoring"
            ),
            'sensor_inputs': {
                'camera': {
                    'label': camera.label,
                    'category': camera.category,
                    'confidence': camera.confidence,
                },
                'infrared': {
                    'heat_detected': infrared.heat_detected,
                    'temperature_delta_c': infrared.temperature_delta_c,
                    'confidence': infrared.confidence,
                },
                'occupancy': {
                    'occupied': occupancy.occupied,
                    'confidence': occupancy.confidence,
                },
            },
        }