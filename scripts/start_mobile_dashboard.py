"""
Quick Start Script for Mobile Dashboard
Launch the mobile-optimized railway operator dashboard
"""

import argparse
import subprocess
import sys
import socket
import webbrowser
import time


def build_parser() -> argparse.ArgumentParser:
    """Create CLI arguments for the mobile dashboard launcher."""
    parser = argparse.ArgumentParser(description="Launch the mobile railway dashboard")
    parser.add_argument("--open-browser", action="store_true", help="Open the mobile dashboard in a browser automatically.")
    parser.add_argument("--no-prompt", action="store_true", help="Print URLs and exit without waiting for interactive input.")
    return parser

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def print_banner():
    """Print startup banner"""
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║          📱 RAILWAY OPERATOR MOBILE DASHBOARD 📱             ║
    ║                  Professional Mobile Interface               ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

def check_server_running(port=5001):
    """Check if server is already running"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0


def wait_for_server(port: int = 5001, timeout_seconds: int = 20) -> bool:
    """Poll for dashboard startup and return True when the server is reachable."""
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if check_server_running(port):
            return True
        time.sleep(0.5)
    return False

def main(argv: list[str] | None = None):
    args = build_parser().parse_args(argv)
    print_banner()
    
    # Check if server is already running
    if check_server_running():
        print("✅ Server is already running!")
    else:
        print("🚀 Starting Flask server...")
        
        # Start Flask server in background
        subprocess.Popen(
            [sys.executable, 'dashboard.py'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        
        print("⏳ Waiting for server to start...")
        if not wait_for_server():
            print("❌ Dashboard server did not start on http://localhost:5001")
            print("💡 Try: python dashboard.py")
            return 1
    
    # Get local IP
    local_ip = get_local_ip()
    
    print("\n" + "="*70)
    print("✅ MOBILE DASHBOARD IS READY!")
    print("="*70)
    
    print("\n📱 ACCESS YOUR MOBILE DASHBOARD:\n")
    
    print("1️⃣  ON THIS COMPUTER:")
    print(f"    → http://localhost:5001/mobile")
    
    print("\n2️⃣  ON YOUR MOBILE DEVICE (same WiFi):")
    print(f"    → http://{local_ip}:5001/mobile")
    
    print("\n3️⃣  DESKTOP VERSION:")
    print(f"    → http://localhost:5001/")
    
    print("\n" + "="*70)
    print("📲 MOBILE APP FEATURES:")
    print("="*70)
    print("  ✅ Real-time train monitoring")
    print("  ✅ Live obstacle detection alerts")
    print("  ✅ Touch-optimized interface")
    print("  ✅ Emergency stop button")
    print("  ✅ Journey progress tracking")
    print("  ✅ Export logs and reports")
    print("  ✅ Vibration alerts for critical events")
    print("  ✅ Share journey status")
    
    print("\n" + "="*70)
    print("💡 TIP: Add to Home Screen for app-like experience!")
    print("="*70)
    print("\n📱 iOS: Safari → Share → Add to Home Screen")
    print("📱 Android: Chrome → Menu → Add to Home Screen")
    
    print("\n" + "="*70)
    print("⌨️  KEYBOARD SHORTCUTS:")
    print("="*70)
    print("  • Press [O] to open in browser")
    print("  • Press [Q] to quit")
    print("="*70)

    if args.open_browser:
        print("\n🌐 Opening mobile dashboard in browser...")
        webbrowser.open('http://localhost:5001/mobile')

    if args.no_prompt:
        print("\n✅ Non-interactive launch complete.")
        return 0
    
    # Wait for user input
    while True:
        try:
            choice = input("\nEnter your choice (O/Q): ").strip().upper()
            
            if choice == 'O':
                print("\n🌐 Opening mobile dashboard in browser...")
                webbrowser.open('http://localhost:5001/mobile')
                print("✅ Dashboard opened!")
                
            elif choice == 'Q':
                print("\n👋 Thank you for using Railway Operator Dashboard!")
                print("Server is still running in the background.")
                print("To stop it, close the terminal or press Ctrl+C in the server window.\n")
                break
                
            else:
                print("❌ Invalid choice. Please enter O or Q.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")

    return 0

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Shutdown requested. Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
