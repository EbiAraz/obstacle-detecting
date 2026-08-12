# RailSAFE AI — GIS Railway Obstacle Detection System

An AI-assisted railway safety and GIS simulation platform. RailSAFE AI simulates a high-speed train journey along the **Paris → Monaco** corridor (980 km, TGV-style speeds up to 300 km/h), detects track obstacles with a PyTorch neural network, fuses simulated level-crossing sensors (camera + IR + occupancy), and streams everything to an operator dashboard with live GIS maps, evidence logging, and exportable reports.

The platform also demonstrates two multi-train architectures: a **federal** client–server network for real-time obstacle alert broadcasting between trains, and **federated learning** (via Flower) so trains can collaboratively improve the shared obstacle-detection model without exchanging raw sensor data.

---

## Key Features

- **AI obstacle detection** — a real PyTorch MLP classifier (`8 → 64 → 128 → 256 → 128 → 64 → 6`) with a sigmoid confidence head that classifies sensor readings into six classes: *No Obstacle, Fallen Rock, Debris, Animal, Construction Equipment, Fallen Tree*.
- **Journey simulation** — segment-by-segment Paris→Monaco run with realistic speed profiles, temperature variation, probabilistic obstacles, and emergency escalation policies.
- **Level-crossing sensor fusion** — a software prototype that fuses camera, infrared, and track-occupancy signals at road–rail intersections into a single incident verdict.
- **Operator dashboard (Flask)** — REST API + web UI on port `5001` with live train status, obstacle feed, Folium GIS maps, journey logs, statistics, and a mobile-friendly endpoint.
- **Evidence-grade logging** — SQLite-backed journey log with map snapshots, generated incident images, JSON/CSV exports, operator notes, and shareable log tokens.
- **Federal multi-train network** — a TCP socket server (port `5000`) where trains register, report status, and broadcast obstacle alerts to each other in real time.
- **Federated learning** — Flower (`flwr`) server/client pair (port `8080`) implementing FedAvg over the obstacle-detection model.
- **Reporting** — per-run HTML and CSV journey reports, plus scripts that build pitch/investor decks (HTML/PDF/PPTX).
- **React control centre (UI prototype)** — a multi-tab RailSAFE AI interface (Control Centre, Driver HMI, Fleet Analytics, Maintenance) built with Tailwind, Radix/shadcn components, Recharts, and Lucide icons.

---

## Architecture at a Glance

```
                        ┌─────────────────────────────┐
                        │   Federal Server (TCP:5000) │
                        │   registration + alert       │
                        │   broadcast between trains   │
                        └──────────▲──────────────────┘
                                   │ JSON over sockets
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────┴───────┐   ┌────────┴───────┐   ┌────────┴───────┐
     │ Train Client A │   │ Train Client B │   │ Train Client N │
     └────────┬───────┘   └────────────────┘   └────────────────┘
              │
   ┌──────────▼─────────────┐        ┌───────────────────────────┐
   │ Standalone Simulator   │        │ Federated Learning (flwr) │
   │ + AIObstacleDetector   │◄──────►│ FedAvg server :8080        │
   │ + Crossing Fusion      │        └───────────────────────────┘
   └──────────┬─────────────┘
              │ SQLite (data/railway_journey.db)
   ┌──────────▼─────────────┐
   │ Flask Dashboard :5001  │  /api/status /api/obstacles /api/map
   │ + Folium GIS maps      │  /api/journey-log /api/mobile/*
   │ + React UI (dist/)     │
   └────────────────────────┘
```

---

## Project Structure

```
GIS of Railway/
├── railway_ai_system/          # Main Python package
│   ├── app.py                  # Integrated CLI orchestrator (entry point)
│   ├── config.py               # Paths, ports, pacing, cache settings
│   ├── core/
│   │   ├── ai.py               # AIObstacleDetector (PyTorch model + training)
│   │   └── logging.py          # AdvancedJourneyLogger (SQLite, maps, exports)
│   ├── domain/
│   │   └── route_config.py     # Paris→Monaco route, obstacles, crossings, policies
│   ├── simulation/
│   │   └── standalone.py       # StandaloneTrainSimulator (no network needed)
│   ├── sensors/
│   │   └── crossing_fusion.py  # Camera + IR + occupancy fusion prototype
│   ├── federal/                # Multi-train ops network (raw TCP, port 5000)
│   │   ├── server.py           # RailwayServer — registry + alert broadcast
│   │   ├── client.py           # TrainClient
│   │   ├── journey.py          # JourneySimulator for networked trains
│   │   └── launcher.py         # One-command server + client demo
│   ├── federated/              # Federated learning (Flower, port 8080)
│   │   ├── server.py           # FedAvg server
│   │   ├── client.py           # FlowerClient
│   │   ├── learning.py         # FederatedObstacleDetector
│   │   └── common.py           # Shared model / serialization helpers
│   ├── services/
│   │   └── monitoring.py       # OperatorMonitor — stats, paths, Folium map builder
│   ├── reporting/
│   │   └── generator.py        # Per-run HTML/CSV journey reports
│   └── web/
│       └── dashboard.py        # Flask app factory + REST API (port 5001)
├── scripts/                    # Runnable helpers and demos
│   ├── quickstart.py           # Interactive launcher menu
│   ├── paris_monaco_simulator.py  # Fast full-journey simulation → JSON
│   ├── streamlit_dashboard.py  # Alternative Streamlit UI (port 8501)
│   ├── run_journey.py          # Offline demo: maps, screenshots, exports
│   ├── prototype_crossing_demo.py # Single crossing-incident fusion demo
│   ├── generate_map_visualization.py # Folium map from a journey JSON
│   ├── verify_system.py        # Environment / dependency checker
│   ├── build_pitch_outputs*.py # Pitch deck → HTML/PDF/PPTX
│   ├── start_federal_with_dashboard.ps1 / .bat  # Windows multi-window launcher
│   └── START_MOBILE_DASHBOARD.bat                # Dashboard + mobile view
├── src/                        # React/TypeScript control-centre UI
│   ├── main.tsx                # App bootstrap
│   ├── app/App.tsx             # RailSAFE AI multi-tab interface
│   ├── app/components/ui/      # shadcn-style component library (Radix)
│   └── styles/                 # Tailwind v4 theme
└── data/                       # SQLite databases (created at runtime)
```

Runtime artifacts are written to `data/`, `journey_logs/`, `static/`, `outputs/journey_reports/`, and `ai_models/` (all created automatically).

---

## Requirements

- **Python 3.10+** (3.11 recommended)
- **Node.js 18+** (only if you want to build the React dashboard UI)

### Python dependencies

Core:

```bash
pip install torch flask flask-cors folium pillow
```

Optional, per feature:

```bash
pip install flwr                  # federated learning (federated/ package)
pip install streamlit pandas      # Streamlit dashboard (scripts/streamlit_dashboard.py)
pip install reportlab python-pptx # pitch deck builders (scripts/build_pitch_outputs*.py)
```

You can verify your environment at any time:

```bash
python scripts/verify_system.py
```

---

## Quick Start

All commands are run from the project root.

### 1. Integrated system (recommended)

Runs the simulator, AI analysis, and dashboard together through an interactive menu:

```bash
python -m railway_ai_system.app
```

Or pick a mode directly:

```bash
python -m railway_ai_system.app --mode complete     # simulation + AI + dashboard + report
python -m railway_ai_system.app --mode simulation   # journey simulation only
python -m railway_ai_system.app --mode dashboard    # dashboard server only
python -m railway_ai_system.app --mode training     # train the AI model (synthetic data)
python -m railway_ai_system.app --mode info         # system information
```

Useful flags: `--train-id TRAIN-AI-INTEGRATED-001`, `--dashboard-port 5001`.

### 2. Dashboard only

```bash
python -m railway_ai_system.web.dashboard
```

Then open:

- Desktop UI: `http://localhost:5001/`
- Mobile view: `http://localhost:5001/mobile`
- Health check: `http://localhost:5001/api/health`

### 3. Fast Paris→Monaco simulation

Runs the whole journey without pacing delays and writes a `paris_monaco_journey_*.json` summary:

```bash
python scripts/paris_monaco_simulator.py
```

### 4. Federal multi-train demo (TCP)

One command starts the server and a networked train journey:

```bash
python -m railway_ai_system.federal.launcher --server-port 5000 --train-id TRAIN-FEDERAL-001
```

On Windows you can launch the full stack (server + client + dashboard) in separate windows:

```powershell
scripts\START_FEDERAL_WITH_DASHBOARD.bat
```

### 5. Streamlit dashboard (alternative UI)

```bash
python -m streamlit run scripts/streamlit_dashboard.py
```

Opens on `http://localhost:8501` and reads the same SQLite journey database.

### 6. Level-crossing fusion demo

```bash
python scripts/prototype_crossing_demo.py
```

Emits a single fused camera + IR + occupancy incident with the emergency-policy decision.

---

## Dashboard REST API

The Flask dashboard (port `5001`) exposes:

| Endpoint | Description |
|---|---|
| `GET /api/status` | Live train state (speed, temperature, GPS, status) |
| `GET /api/obstacles?limit=N` | Recent obstacle detections |
| `GET /api/map` | Rendered Folium journey map (HTML) |
| `GET /api/journey-log` | Recent journey log entries |
| `GET /api/stats` | Event/status breakdown |
| `GET /api/export-logs` | Download JSON log export |
| `GET /api/mobile/status` | Compact status for mobile clients |
| `GET /api/mobile/alerts` | Last 5 obstacle alerts |
| `GET /api/health` | Service health check |
| `GET /api/config` | Runtime paths and ports |

Responses are cached briefly (status/obstacles ~3 s, map ~10 s) to keep the API fast during simulation.

---

## The AI Model

`AIObstacleDetector` (`railway_ai_system/core/ai.py`) is a genuine PyTorch classifier, not a mock:

- **Input:** 8 sensor features per reading
- **Architecture:** fully connected MLP with BatchNorm and Dropout, plus a separate sigmoid confidence head
- **Output:** one of 6 obstacle classes + a confidence score
- **Training:** Adam + CrossEntropy on synthetically generated sensor samples (`--mode training`); weights are saved to `ai_models/obstacle_detector_*.pth` and loaded on startup when present

The **federated** package wraps the same architecture in `FederatedObstacleDetector`, so multiple simulated trains can improve a shared model via FedAvg without sharing raw data.

---

## Ports Used

| Port | Service |
|---|---|
| `5000` | Federal TCP server (train registration + alert broadcast) |
| `5001` | Flask operator dashboard + REST API |
| `8080` | Flower federated-learning server |
| `8501` | Streamlit dashboard (optional) |
| `5173` | Vite dev server for the React UI (optional) |

---

## React Control-Centre UI

`src/` contains the RailSAFE AI front-end prototype: a multi-tab interface (Control Centre, Driver HMI, Fleet Analytics, Maintenance, plus architecture/investor decks) built with Tailwind CSS v4, Radix-based shadcn components, Recharts, and Lucide icons.

> **Note:** the front-end build tooling (`package.json`, `vite.config.ts`, `tsconfig.json`) is not yet checked into the repository. The Flask dashboard serves the compiled UI from `dist/` when available and falls back to a helpful notice otherwise. To use the React UI, restore a Vite + React + Tailwind setup and run `npm run build` so `dist/` is produced at the project root.

---

## Data & Outputs

| Location | Contents |
|---|---|
| `data/railway_journey.db` | SQLite: journey logs, obstacle logs, image/map evidence, operator notes, share tokens |
| `journey_logs/` | Generated incident images, map snapshots, JSON exports |
| `static/maps/` | Folium journey maps served by the dashboard |
| `outputs/journey_reports/run_*/` | Per-run HTML + CSV journey reports |
| `ai_models/` | Trained PyTorch model weights (`.pth`) |

---

## Known Gaps / Roadmap

- `requirements.txt` / `pyproject.toml` are not yet committed — install dependencies with the pip commands above.
- Front-end build configs (`package.json`, Vite, tsconfig) are missing; the React UI cannot be built until they are restored.
- Some legacy scripts still reference an older *Ankara → Istanbul* branding and root-level wrapper files (`train.py`, `server.py`, `dashboard.py`) that have been replaced by the `railway_ai_system` package modules — prefer the `python -m railway_ai_system.*` commands documented above.
- All sensors (cameras, IR, occupancy) are simulated; `scripts/untitled13.py` contains an experimental real-camera pipeline (OpenCV YOLO + MQTT) that is not yet integrated.

---

## License

No license has been specified for this project yet.
