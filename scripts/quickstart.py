"""
Quick Start Script - Run this to start everything!
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path


def build_parser() -> argparse.ArgumentParser:
    """Create CLI arguments for the quickstart helper."""
    parser = argparse.ArgumentParser(description="Quickstart helper for the railway AI system")
    parser.add_argument(
        "--mode",
        choices=["menu", "standalone", "federal", "federal-auto", "info"],
        default="menu",
        help="Run a mode directly instead of using the interactive menu.",
    )
    parser.add_argument(
        "--start-server",
        action="store_true",
        help="When used with --mode federal, start the federal server immediately.",
    )
    return parser

def print_banner():
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║      🚂 MODULAR RAILWAY OBSTACLE DETECTION SYSTEM 🚂         ║
    ║              Ankara → Istanbul Route (570 km)                ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

def print_menu():
    print("""
    Choose how to run the system:
    
    1️⃣  STANDALONE MODE (RECOMMENDED)
        • Runs everything in one command
        • No multiple terminals needed
        • Perfect for testing
        
    2️⃣  FEDERAL SERVER MODE
        • Requires 2 terminals
        • More advanced setup
        • Demonstrates client-server architecture

    3️⃣  FEDERAL AUTO LAUNCH + DASHBOARD
        • Starts server first in new PowerShell
        • Waits for server ready message
        • Starts client in another PowerShell
        • Opens web dashboard automatically
        
    0️⃣  EXIT
    """)


def run_federal_auto_launch():
    """Run automated federal launch flow in separate PowerShell windows."""
    print("\n✨ Starting Federal Auto Launch (server -> client -> dashboard)...\n")
    base_dir = Path(__file__).resolve().parent
    candidates = [
        base_dir / "start_federal_with_dashboard.ps1",
        base_dir.parent / "scripts" / "start_federal_with_dashboard.ps1",
    ]
    script_path = next((candidate for candidate in candidates if candidate.exists()), None)
    if script_path is None:
        print("❌ Error: start_federal_with_dashboard.ps1 not found")
        return

    try:
        subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(script_path.resolve()),
            ],
            check=True,
        )
        print("\n✅ Federal auto launch started successfully!")
    except FileNotFoundError:
        print("❌ Error: PowerShell is not available on PATH")
    except subprocess.CalledProcessError as exc:
        print(f"❌ Auto launch failed with exit code: {exc.returncode}")
    except Exception as exc:
        print(f"❌ Error: {exc}")

def run_standalone():
    """Run the standalone simulator"""
    print("\n✨ Starting Standalone Simulator...\n")
    try:
        subprocess.run([sys.executable, 'train.py'], check=True)
        print("\n✅ Simulation completed successfully!")
        print("\n📁 Look for these files in your folder:")
        print("   • journey_report_*.json")
        print("   • journey_report_html_*.html")
        print("   • journey_report_csv_*.csv")
    except KeyboardInterrupt:
        print("\n⛔ Simulation interrupted by user")
    except FileNotFoundError:
        print("❌ Error: train.py not found")
    except Exception as e:
        print(f"❌ Error: {e}")

def run_federal_mode(start_server_now: bool = False):
    """Instructions for federal server mode"""
    print("\n📡 Federal Server Mode Instructions:\n")
    print("This mode requires 2 terminals:\n")
    
    print("TERMINAL 1 - Start the Federal Server:")
    print("  $ python server.py\n")
    
    print("TERMINAL 2 - Run the Journey Simulation:")
    print("  $ python client.py\n")
    
    print("📝 Steps:")
    print("  1. Open first terminal in this folder")
    print("  2. Run: python server.py")
    print("  3. Wait for 'Listening on localhost:5000'")
    print("  4. Open second terminal in same folder")
    print("  5. Run: python client.py")
    print("  6. Watch both windows for real-time updates\n")
    
    if not start_server_now:
        response = input("Would you like to start the server now? (y/n): ").strip().lower()
        start_server_now = response == 'y'

    if start_server_now:
        print("\n✨ Starting Federal Server...\n")
        try:
            subprocess.run([sys.executable, 'server.py'])
        except KeyboardInterrupt:
            print("\n⛔ Server stopped")
        except Exception as e:
            print(f"❌ Error: {e}")

def show_info():
    """Show system information"""
    print(f"\n📊 SYSTEM INFORMATION:\n")
    print(f"Python Version: {sys.version}")
    print(f"Working Directory: {os.getcwd()}")
    print(f"Available Files:")
    
    files = [
        'main.py',
        'train.py',
        'client.py',
        'server.py',
        'scripts/verify_system.py',
        'railway_ai_system/domain/route_config.py',
        'railway_ai_system/reporting/generator.py'
    ]
    
    for file in files:
        exists = "✅" if Path(file).exists() else "❌"
        print(f"  {exists} {file}")

def main(argv: list[str] | None = None):
    args = build_parser().parse_args(argv)
    print_banner()

    if args.mode == 'standalone':
        run_standalone()
        return 0
    if args.mode == 'federal':
        run_federal_mode(start_server_now=args.start_server)
        return 0
    if args.mode == 'federal-auto':
        run_federal_auto_launch()
        return 0
    if args.mode == 'info':
        show_info()
        return 0
    
    while True:
        print_menu()
        
        choice = input("Enter your choice (0-3): ").strip()
        
        if choice == '1':
            run_standalone()
            break
        elif choice == '2':
            run_federal_mode()
            break
        elif choice == '3':
            run_federal_auto_launch()
            break
        elif choice == '0':
            print("\n👋 Thank you for using Railway Obstacle Detection System!")
            return 0
        elif choice == 'info':
            show_info()
        else:
            print("\n❌ Invalid choice. Please try again.\n")

    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\n\n👋 System interrupted. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
