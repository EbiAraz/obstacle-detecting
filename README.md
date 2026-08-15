# RailSAFE AI — GIS Railway Obstacle Detection System

An AI-assisted railway safety and GIS simulation platform. RailSAFE AI simulates a high-speed train journey along the **Paris → Monaco** corridor (980 km, TGV-style speeds up to 300 km/h), detects track obstacles with a PyTorch neural network, fuses simulated level-crossing sensors (camera + IR + occupancy), and streams everything to an operator dashboard with live GIS maps, evidence logging, and exportable reports.

The platform also demonstrates two multi-train architectures: a **federal** client–server network for real-time obstacle alert broadcasting between trains, and **federated learning** (via Flower) so trains can collaboratively improve the shared obstacle-detection model without exchanging raw sensor data.

---

## Key Features

- **AI obstacle detection** — a real PyTorch MLP classifier (`8 → 64 → 128 → 256 → 128 → 64 → 6`) with a sigmoid confidence head that classifies sensor readings into six classes: *No Obstacle, Fallen Rock, Debris, Animal, Construction Equipment, Fallen Tree*.
- **Journey simulation** — segment-by-segment Paris→Monaco run with realistic speed profiles, temperature variation, probabilistic obstacles, and emergency escalation policies.
- **sensor fusion** — a software prototype that fuses camera, infrared, and track-occupancy signals at road–rail intersections into a single incident verdict.
- **Operator dashboard (Flask)** — REST API + web UI on port `5001` with live train status, obstacle feed, Folium GIS maps, journey logs, statistics, and a mobile-friendly endpoint.
- **Evidence-grade logging** — SQLite-backed journey log with map snapshots, generated incident images, JSON/CSV exports, operator notes, and shareable log tokens.
- **Federal multi-train network** — a TCP socket server (port `5000`) where trains register, report status, and broadcast obstacle alerts to each other in real time.
- **Federated learning** — Flower (`flwr`) server/client pair (port `8080`) implementing FedAvg over the obstacle-detection model.
- **Reporting** — per-run HTML and CSV journey reports, plus scripts that build pitch/investor decks (HTML/PDF/PPTX).
- **React control centre (UI prototype)** — a multi-tab RailSAFE AI interface (Control Centre, Driver HMI, Fleet Analytics, Maintenance) built with Tailwind, Radix/shadcn components, Recharts, and Lucide icons.

---

