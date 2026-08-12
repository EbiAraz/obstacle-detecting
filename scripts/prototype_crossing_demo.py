"""
Software-only demo for a camera + infrared rail crossing prototype.
"""

import json

from railway_ai_system.domain.route_config import ROAD_RAIL_INTERSECTIONS
from railway_ai_system.simulation.standalone import StandaloneTrainSimulator


def main():
    simulator = StandaloneTrainSimulator('TRAIN-ANKARA-ISTANBUL-001')
    crossing = ROAD_RAIL_INTERSECTIONS[0]  # Eskişehir West Crossing

    incident = simulator.detect_crossing_issue(
        crossing,
        lat=crossing['latitude'],
        lon=crossing['longitude'],
        speed=88.0,
    )

    print("\nPrototype crossing incident:\n")
    print(json.dumps(incident, indent=2))
    simulator.conn.close()


if __name__ == '__main__':
    main()