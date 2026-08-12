"""Application orchestration for the modular railway AI system."""

import argparse
import random
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

from railway_ai_system.config import AI_MODELS_DIR, DEFAULT_DASHBOARD_HOST, DEFAULT_DASHBOARD_PORT
from railway_ai_system.core.ai import AIObstacleDetector
from railway_ai_system.core.logging import AdvancedJourneyLogger
from railway_ai_system.reporting.generator import create_run_report_dir
from railway_ai_system.simulation.standalone import StandaloneTrainSimulator
from railway_ai_system.web.dashboard import create_dashboard_app


def configure_stdio_for_unicode(stdout=None, stderr=None) -> None:
    """Prefer UTF-8 stdio so status banners do not crash on Windows redirection."""
    for stream in (stdout or sys.stdout, stderr or sys.stderr):
        if not hasattr(stream, "reconfigure"):
            continue
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            continue


def build_parser() -> argparse.ArgumentParser:
    """Create the CLI parser for the integrated application."""
    parser = argparse.ArgumentParser(description="Run the modular railway AI system")
    parser.add_argument(
        "--mode",
        choices=["menu", "complete", "simulation", "dashboard", "training", "info"],
        default="menu",
        help="Execution mode. Defaults to interactive menu.",
    )
    parser.add_argument("--train-id", default="TRAIN-AI-INTEGRATED-001", help="Train identifier to use.")
    parser.add_argument("--dashboard-port", type=int, default=DEFAULT_DASHBOARD_PORT, help="Dashboard port.")
    return parser


class DashboardServer:
    """Encapsulate Flask dashboard startup in a background thread."""

    def __init__(self, host: str = DEFAULT_DASHBOARD_HOST, port: int = DEFAULT_DASHBOARD_PORT):
        self.host = host
        self.port = port
        self._app = create_dashboard_app()
        self._thread = None

    def start(self) -> None:
        """Start the dashboard server if it is not already running."""
        if self._thread and self._thread.is_alive():
            return

        def run_flask() -> None:
            self._app.run(debug=False, host=self.host, port=self.port, use_reloader=False)

        self._thread = threading.Thread(target=run_flask, daemon=True)
        self._thread.start()
        time.sleep(2)


class IntegratedRailwaySystem:
    """Complete integrated railway system with AI and monitoring."""

    def __init__(self, train_id: str = "TRAIN-AI-INTEGRATED-001"):
        self.train_id = train_id
        self.simulator = None
        self.ai_detector = None
        self.logger = None
        self.dashboard_server = DashboardServer()

    def initialize(self) -> bool:
        """Initialize all system components."""
        print("\n" + "=" * 70)
        print("🚂 INITIALIZING AI-POWERED RAILWAY SYSTEM")
        print("=" * 70)

        try:
            print("\n✅ Initializing AI Obstacle Detector...")
            self.ai_detector = AIObstacleDetector(device="cpu")

            print("✅ Initializing Advanced Journey Logger...")
            self.logger = AdvancedJourneyLogger()

            print("✅ Initializing Train Simulator...")
            self.simulator = StandaloneTrainSimulator(self.train_id)

            print("\n✅ All components initialized successfully!")
            return True
        except Exception as exc:
            print(f"\n❌ Initialization error: {exc}")
            return False

    def start_dashboard(self, port: int = DEFAULT_DASHBOARD_PORT) -> None:
        """Start the dashboard server in the background."""
        print(f"\n🌐 Starting Dashboard Server on port {port}...")
        self.dashboard_server.port = port
        self.dashboard_server.start()
        print(f"✅ Dashboard running at http://localhost:{port}")
        print(f"✅ Mobile app accessible at http://localhost:{port}/api/mobile/status")

    def run_simulation_with_ai(self) -> bool:
        """Run the simulator and then execute AI analysis."""
        print("\n" + "=" * 70)
        print("🚂 STARTING INTEGRATED JOURNEY WITH AI DETECTION")
        print("=" * 70)

        if not self.simulator.simulate_journey():
            return False

        print("\n🤖 Running AI Analysis on Journey Data...")
        self.analyze_journey_with_ai()
        return True

    def analyze_journey_with_ai(self) -> None:
        """Run AI detection against a small set of representative sensor samples."""
        try:
            print("📸 Capturing journey snapshots...")
            print("\n🔍 Running AI Obstacle Detection...")
            for index, sample in enumerate(self._build_ai_samples(), start=1):
                result = self.ai_detector.detect(sample)
                print(f"\n  Sample {index}:")
                print(f"    Type: {result['obstacle_type']}")
                print(f"    Severity: {result['severity']}")
                print(f"    Confidence: {result['confidence']:.1%}")

                if result["obstacle_class"] != 0:
                    self._log_ai_detection(sample, result)

            print("\n✅ AI Analysis complete!")
        except Exception as exc:
            print(f"Error in AI analysis: {exc}")

    def _build_ai_samples(self) -> list[dict]:
        """Build representative sensor samples for AI inference."""
        return [
            {
                "speed": 95.5,
                "temperature": 20.3,
                "latitude": 39.9208,
                "longitude": 32.8541,
                "altitude": 92.0,
                "vibration": 15.2,
                "sound": 65.5,
                "humidity": 70.0,
            },
            {
                "speed": 110.2,
                "temperature": 19.8,
                "latitude": 40.7767,
                "longitude": 30.5206,
                "altitude": 110.0,
                "vibration": 25.5,
                "sound": 72.3,
                "humidity": 68.5,
            },
        ]

    def _log_ai_detection(self, sample: dict, result: dict) -> None:
        """Persist screenshot evidence for a detected AI obstacle."""
        if not self.logger:
            return

        image_path = self.logger.capture_journey_screenshot(
            self.train_id,
            sample["latitude"],
            sample["longitude"],
            sample["speed"],
            sample["temperature"],
            1,
        )
        if not image_path:
            return

        self.logger.log_image_with_details(
            self.train_id,
            sample["latitude"],
            sample["longitude"],
            image_path,
            f"AI Detected: {result['obstacle_type']}",
            "AI_DETECTION",
        )

    def generate_reports(self) -> None:
        """Generate simulator and advanced logging reports."""
        print("\n" + "=" * 70)
        print("📊 GENERATING COMPREHENSIVE REPORTS")
        print("=" * 70)

        try:
            run_reports_dir = create_run_report_dir(self.train_id)
            report_path = self._export_advanced_report(output_dir=run_reports_dir)
            self.simulator.print_summary()
            self._print_crossing_escalation_banner()
            json_file, html_file, csv_file = self.simulator.save_journey_report(output_dir=run_reports_dir)

            print(f"\n📂 Run reports folder: {run_reports_dir}")

            print("\n📁 All generated files:")
            for path in (json_file, html_file, csv_file, report_path):
                if path:
                    print(f"   • {path}")
            print("\n✅ Reports generation complete!")
        except Exception as exc:
            print(f"Error generating reports: {exc}")

    def _print_crossing_escalation_banner(self) -> None:
        """Display a top-level alert for segment escalation events."""
        if not self.simulator or not hasattr(self.simulator, "journey_log"):
            return

        escalations = self.simulator.journey_log.get("segment_escalations", [])
        if not escalations:
            return

        print("\n" + "!" * 70)
        print("🚨 RED ALERT: ROAD-RAIL SEGMENT ESCALATION DETECTED")
        print("!" * 70)
        print(f"Count: {len(escalations)}")
        for event in escalations[:5]:
            print(
                f"  • {event.get('location', 'Unknown')} | "
                f"{event.get('action', 'SEGMENT_ESCALATION')} | "
                f"alerts={event.get('alert_count', 'n/a')}"
            )
        print("!" * 70)

    def _export_advanced_report(self, output_dir: str | Path | None = None):
        """Export the advanced logger report for the current train."""
        if not self.logger:
            return None
        try:
            start_time = self.simulator.journey_log.get("start_time") if self.simulator else None
            end_time = self.simulator.journey_log.get("end_time") if self.simulator else None
            journey_snapshot = self.simulator.journey_log if self.simulator else None
            report_path = self.logger.export_report_as_json(
                self.train_id,
                start_time=start_time,
                end_time=end_time,
                journey_snapshot=journey_snapshot,
                output_dir=output_dir,
            )
            if report_path:
                print(f"✅ Advanced report exported: {report_path}")
            return report_path
        except Exception as exc:
            print(f"⚠️ Advanced report export failed: {exc}")
            return None

    def display_menu(self) -> None:
        """Display the main CLI menu."""
        print("\n" + "=" * 70)
        print("🚂 AI-POWERED RAILWAY OBSTACLE DETECTION SYSTEM")
        print("=" * 70)
        print("\nSelect operation:")
        print("1️⃣  Run Complete System (Simulation + Dashboard + AI)")
        print("2️⃣  Run Simulation Only")
        print("3️⃣  Start Dashboard Only (connect to existing data)")
        print("4️⃣  Run AI Training (with sample data)")
        print("5️⃣  View System Information")
        print("0️⃣  Exit")
        print("\n" + "=" * 70)

    def run_ai_training(self) -> None:
        """Train the AI model with generated sample data."""
        print("\n🤖 Starting AI Model Training...")
        training_data = self._build_training_data()
        print(f"✅ Generated {len(training_data)} training samples")
        self.ai_detector.train_model(
            training_data,
            epochs=5,
            batch_size=16,
            learning_rate=0.001,
        )

        model_path = AI_MODELS_DIR / f"obstacle_detector_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pth"
        Path(model_path.parent).mkdir(exist_ok=True)
        self.ai_detector.save_model(str(model_path))

    def _build_training_data(self) -> list[dict]:
        """Generate synthetic training data for the obstacle model."""
        obstacle_types = [
            {"name": "No Obstacle", "label": 0, "vibration_range": (5, 15), "sound_range": (50, 65)},
            {"name": "Fallen Rock", "label": 1, "vibration_range": (40, 80), "sound_range": (85, 100)},
            {"name": "Debris", "label": 2, "vibration_range": (25, 45), "sound_range": (70, 85)},
            {"name": "Animal", "label": 3, "vibration_range": (15, 30), "sound_range": (65, 75)},
            {"name": "Construction Equipment", "label": 4, "vibration_range": (50, 90), "sound_range": (90, 105)},
            {"name": "Fallen Tree", "label": 5, "vibration_range": (30, 50), "sound_range": (75, 85)},
        ]
        training_data = []
        print("📊 Generating synthetic training data...")
        for obstacle_type in obstacle_types:
            for _ in range(20):
                vibration = random.uniform(*obstacle_type["vibration_range"])
                sound = random.uniform(*obstacle_type["sound_range"])
                training_data.append(
                    {
                        "features": [
                            random.uniform(80, 120),
                            random.uniform(15, 25),
                            random.uniform(39, 41.5),
                            random.uniform(28, 33),
                            random.uniform(90, 300),
                            vibration,
                            sound,
                            random.uniform(60, 80),
                        ],
                        "label": obstacle_type["label"],
                    }
                )
        return training_data

    def show_system_info(self) -> None:
        """Display high-level system information."""
        print("\n" + "=" * 70)
        print("ℹ️ SYSTEM INFORMATION")
        print("=" * 70)
        print(
            """
🚂 RAILWAY SYSTEM COMPONENTS:
   ✅ AI Obstacle Detection (PyTorch)
   ✅ Advanced Journey Logging
   ✅ Flask Web Dashboard
   ✅ Real-time Monitoring
   ✅ Mobile API Support
   ✅ Federated Learning Ready

📊 FEATURES:
   • Real-time obstacle detection with AI
   • Interactive maps with journey visualization
   • Image capture and logging
   • Operator notes and annotations
   • Shareable journey logs
   • Multi-format report generation
   • Mobile-optimized APIs

🌐 DASHBOARD ACCESS:
   • Web: http://localhost:5001
   • Mobile: http://localhost:5001/api/mobile/status
   • API: http://localhost:5001/api/

📊 DATABASE TABLES:
   • journey_logs: Journey events
   • obstacles_log: Obstacle detections
   • image_logs: Captured images
   • operator_notes: Operator annotations
   • shared_logs: Shareable logs

🤖 AI MODEL:
   • Input: Sensor data (8 features)
   • Output: Obstacle classification + confidence
   • Classes: 6 (No obstacle, Rock, Debris, Animal, Equipment, Tree)

🔄 FEDERATED LEARNING:
   Ready to connect to federated learning server
   Port: 8080
            """
        )
        print("=" * 70)


def run_mode(system: IntegratedRailwaySystem, mode: str, dashboard_port: int) -> int:
    """Run a single selected CLI mode."""
    if mode == "complete":
        print("\n🚀 Starting complete integrated system...")
        print(f"   • Starting Dashboard (port {dashboard_port})...")
        system.start_dashboard(dashboard_port)
        print("   • Running Simulation with AI...")
        time.sleep(2)
        if system.run_simulation_with_ai():
            system.generate_reports()
            print("\n✅ Complete system run finished!")
            return 0
        return 1

    if mode == "simulation":
        if system.run_simulation_with_ai():
            system.generate_reports()
            return 0
        return 1

    if mode == "dashboard":
        print("\n🌐 Starting Dashboard Only...")
        system.start_dashboard(dashboard_port)
        print("\n📝 Dashboard is running. Press Ctrl+C to stop.")
        while True:
            time.sleep(1)

    if mode == "training":
        system.run_ai_training()
        return 0

    if mode == "info":
        system.show_system_info()
        return 0

    return 1


def main(argv: list[str] | None = None) -> int:
    """Run the integrated CLI."""
    configure_stdio_for_unicode()
    args = build_parser().parse_args(argv)
    system = IntegratedRailwaySystem(train_id=args.train_id)
    if not system.initialize():
        print("\n❌ Failed to initialize system")
        return 1

    try:
        if args.mode != "menu":
            return run_mode(system, args.mode, args.dashboard_port)

        while True:
            system.display_menu()
            choice = input("\nEnter your choice (0-5): ").strip()
            if choice == "1":
                return run_mode(system, "complete", args.dashboard_port)
            elif choice == "2":
                return run_mode(system, "simulation", args.dashboard_port)
            elif choice == "3":
                return run_mode(system, "dashboard", args.dashboard_port)
            elif choice == "4":
                return run_mode(system, "training", args.dashboard_port)
            elif choice == "5":
                return run_mode(system, "info", args.dashboard_port)
            elif choice == "0":
                print("\n👋 Goodbye!")
                return 0
            else:
                print("\n❌ Invalid choice. Please try again.")
    except KeyboardInterrupt:
        print("\n\n✅ System shutdown gracefully")
        return 0
    except Exception as exc:
        print(f"\n❌ System error: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
