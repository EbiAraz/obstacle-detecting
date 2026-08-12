"""Package-based launcher for the federal server/client demonstration path."""

import argparse
import threading
import time

from railway_ai_system.federal.journey import JourneySimulator
from railway_ai_system.federal.server import RailwayServer


def build_parser() -> argparse.ArgumentParser:
    """Create the CLI parser for the federal launcher."""
    parser = argparse.ArgumentParser(description="Run the federal railway server/client demo")
    parser.add_argument("--train-id", default="TRAIN-FEDERAL-001", help="Train identifier to simulate.")
    parser.add_argument("--server-host", default="localhost", help="Federal server bind host.")
    parser.add_argument("--server-port", type=int, default=5000, help="Federal server port.")
    parser.add_argument("--start-delay", type=int, default=1, help="Delay before train simulation starts.")
    return parser


def run_server(server: RailwayServer):
    """Run the federal server loop."""
    server.start_server()


def start_train_simulation(train_id: str, start_delay: int, server_host: str, server_port: int) -> bool:
    """Run the federal journey simulation against the package-based server."""
    print("\n🚂 Starting Train Journey Simulation...")
    time.sleep(3)
    simulator = JourneySimulator(train_id, start_delay=start_delay, server_host=server_host, server_port=server_port)
    if simulator.simulate_journey():
        simulator.print_summary()
        report_file = simulator.save_journey_report()
        print("\n✅ Journey simulation completed successfully!")
        print(f"📊 Report saved to: {report_file}")
        return True
    print("❌ Journey simulation failed")
    return False


def main(argv: list[str] | None = None) -> int:
    """Run the package-based federal demonstration path."""
    args = build_parser().parse_args(argv)
    print("=" * 70)
    print("🚂 FEDERAL RAILWAY OBSTACLE DETECTION SYSTEM")
    print("=" * 70)
    print(f"{JourneySimulator.__name__} using package-based server/client modules")
    print("=" * 70)
    server = RailwayServer(host=args.server_host, port=args.server_port)
    server_thread = threading.Thread(target=run_server, args=(server,), daemon=True)
    server_thread.start()
    time.sleep(2)
    try:
        success = start_train_simulation(args.train_id, args.start_delay, args.server_host, args.server_port)
        print("\n" + "=" * 70)
        print("✅ SYSTEM COMPLETE")
        print("=" * 70)
        return 0 if success else 1
    finally:
        server.shutdown()
