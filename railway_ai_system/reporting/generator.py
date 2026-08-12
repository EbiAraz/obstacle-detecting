"""
Report Generator and Visualizer
Creates a comprehensive HTML report and generates detailed statistics
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import math

from railway_ai_system.domain.route_config import ROUTE_DATA


def create_run_report_dir(train_id: str, base_dir: str | Path | None = None) -> Path:
    """Create and return a unique report folder for a single run."""
    root = Path(base_dir) if base_dir is not None else Path("outputs") / "journey_reports"
    run_stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    run_dir = root / f"run_{train_id}_{run_stamp}"
    run_dir.mkdir(parents=True, exist_ok=True)
    return run_dir

class ReportGenerator:
    def __init__(self, journey_log: dict, output_dir: str | Path | None = None):
        self.journey_log = journey_log
        self.train_id = journey_log.get('train_id', 'UNKNOWN')
        self.output_dir = Path(output_dir) if output_dir is not None else create_run_report_dir(self.train_id)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_html_report(self, filename: str = None) -> str:
        """Generate an HTML report with visualizations"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = str(self.output_dir / f"journey_report_html_{self.train_id}_{timestamp}.html")
        
        html_content = self._build_html()
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html_content)
            print(f"✅ HTML report saved: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Error saving HTML report: {e}")
            return None
    
    def _build_html(self) -> str:
        """Build HTML content"""
        start_time = self.journey_log.get('start_time', 'N/A')
        end_time = self.journey_log.get('end_time', 'N/A')
        route_start = ROUTE_DATA['start']['name']
        route_end = ROUTE_DATA['end']['name']
        max_speed = self.journey_log.get('max_speed', 0)
        min_temp = self.journey_log.get('min_temperature', 0)
        max_temp = self.journey_log.get('max_temperature', 0)
        avg_speed = self.journey_log.get('average_speed', 0)
        obstacles = self.journey_log.get('obstacles_detected', [])
        waypoints = self.journey_log.get('waypoints_visited', [])
        
        obstacles_html = ""
        for obs in obstacles:
            obstacles_html += f"""
            <div style="background: #ffe6e6; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #ff0000;">
                <strong>{obs.get('type', 'Unknown')}</strong> at {obs.get('location', 'N/A')}<br>
                Severity: <span style="color: {'red' if obs.get('severity') == 'HIGH' else 'orange' if obs.get('severity') == 'MEDIUM' else 'green'};">
                    {obs.get('severity', 'N/A')}</span><br>
                Confidence: {obs.get('confidence', 0):.1%}<br>
                Position: ({obs.get('latitude', 0):.4f}, {obs.get('longitude', 0):.4f})
            </div>
            """
        
        waypoints_html = ""
        for wp in waypoints:
            waypoints_html += f"""
            <tr>
                <td>{wp.get('name', 'N/A')}</td>
                <td>{wp.get('distance_from_start_km', 0)} km</td>
                <td>{wp.get('latitude', 0):.4f}</td>
                <td>{wp.get('longitude', 0):.4f}</td>
                <td>{wp.get('timestamp', 'N/A').split('T')[1][:8]}</td>
            </tr>
            """
        
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Railway Journey Report - {self.train_id}</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #333;
                    padding: 20px;
                }}
                
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    overflow: hidden;
                }}
                
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    text-align: center;
                }}
                
                .header h1 {{
                    font-size: 2.5em;
                    margin-bottom: 10px;
                }}
                
                .header p {{
                    font-size: 1.1em;
                    opacity: 0.9;
                }}
                
                .content {{
                    padding: 40px;
                }}
                
                .section {{
                    margin-bottom: 40px;
                }}
                
                .section h2 {{
                    color: #667eea;
                    font-size: 1.8em;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 3px solid #667eea;
                }}
                
                .metrics {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                
                .metric-card {{
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    text-align: center;
                }}
                
                .metric-card.blue {{
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                }}
                
                .metric-card.green {{
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                }}
                
                .metric-card.orange {{
                    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                }}
                
                .metric-card h3 {{
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }}
                
                .metric-card .value {{
                    font-size: 2.5em;
                    font-weight: bold;
                }}
                
                .metric-card .unit {{
                    font-size: 0.9em;
                    opacity: 0.8;
                    margin-top: 5px;
                }}
                
                .timeline {{
                    display: flex;
                    justify-content: space-between;
                    margin: 20px 0;
                    padding: 20px;
                    background: #f5f5f5;
                    border-radius: 10px;
                }}
                
                .timeline-item {{
                    text-align: center;
                    flex: 1;
                }}
                
                .timeline-item strong {{
                    display: block;
                    color: #667eea;
                    margin-bottom: 5px;
                }}
                
                .timeline-item span {{
                    color: #666;
                }}
                
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }}
                
                table th {{
                    background: #667eea;
                    color: white;
                    padding: 15px;
                    text-align: left;
                    font-weight: 600;
                }}
                
                table td {{
                    padding: 12px 15px;
                    border-bottom: 1px solid #eee;
                }}
                
                table tr:hover {{
                    background: #f9f9f9;
                }}
                
                .obstacle-item {{
                    background: #fff3cd;
                    padding: 15px;
                    margin: 10px 0;
                    border-left: 4px solid #ff9800;
                    border-radius: 5px;
                }}
                
                .obstacle-item.critical {{
                    background: #ffe6e6;
                    border-left-color: #d32f2f;
                }}
                
                .footer {{
                    background: #f5f5f5;
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    border-top: 1px solid #ddd;
                }}
                
                .badge {{
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 0.85em;
                    font-weight: 600;
                    margin-right: 5px;
                }}
                
                .badge.high {{
                    background: #ffcdd2;
                    color: #c62828;
                }}
                
                .badge.medium {{
                    background: #fff3cd;
                    color: #ff6f00;
                }}
                
                .badge.low {{
                    background: #c8e6c9;
                    color: #2e7d32;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚂 Railway Journey Report</h1>
                    <p>{self.train_id}</p>
                    <p>{route_start} → {route_end} Route</p>
                </div>
                
                <div class="content">
                    <!-- Metrics Section -->
                    <div class="section">
                        <h2>📊 Performance Metrics</h2>
                        <div class="metrics">
                            <div class="metric-card blue">
                                <h3>Average Speed</h3>
                                <div class="value">{avg_speed:.1f}</div>
                                <div class="unit">km/h</div>
                            </div>
                            <div class="metric-card orange">
                                <h3>Maximum Speed</h3>
                                <div class="value">{max_speed:.1f}</div>
                                <div class="unit">km/h</div>
                            </div>
                            <div class="metric-card">
                                <h3>Temperature Range</h3>
                                <div class="value">{max_temp - min_temp:.1f}</div>
                                <div class="unit">°C</div>
                            </div>
                            <div class="metric-card green">
                                <h3>Obstacles Detected</h3>
                                <div class="value">{len(obstacles)}</div>
                                <div class="unit">items</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Journey Timeline -->
                    <div class="section">
                        <h2>⏱️ Journey Timeline</h2>
                        <div class="timeline">
                            <div class="timeline-item">
                                <strong>Start</strong>
                                <span>{start_time.split('T')[1][:8] if 'T' in str(start_time) else start_time}</span>
                            </div>
                            <div class="timeline-item">
                                <strong>Duration</strong>
                                <span>Complete</span>
                            </div>
                            <div class="timeline-item">
                                <strong>End</strong>
                                <span>{end_time.split('T')[1][:8] if 'T' in str(end_time) else end_time}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Temperature Summary -->
                    <div class="section">
                        <h2>🌡️ Temperature Metrics</h2>
                        <div class="metrics">
                            <div class="metric-card orange">
                                <h3>Minimum Temperature</h3>
                                <div class="value">{min_temp:.1f}</div>
                                <div class="unit">°C</div>
                            </div>
                            <div class="metric-card">
                                <h3>Maximum Temperature</h3>
                                <div class="value">{max_temp:.1f}</div>
                                <div class="unit">°C</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Waypoints -->
                    <div class="section">
                        <h2>📍 Waypoints Visited</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Distance from Start</th>
                                    <th>Latitude</th>
                                    <th>Longitude</th>
                                    <th>Arrival Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {waypoints_html}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Obstacles Section -->
                    <div class="section">
                        <h2>🚨 Obstacles Detected ({len(obstacles)})</h2>
                        {obstacles_html if obstacles_html else '<p style="color: #666;">No obstacles detected during this journey.</p>'}
                    </div>
                </div>
                
                <div class="footer">
                    <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p>Federal Railway Obstacle Detection System</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def generate_csv_report(self, filename: str = None) -> str:
        """Generate a CSV report with journey data"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = str(self.output_dir / f"journey_report_csv_{self.train_id}_{timestamp}.csv")
        
        try:
            import csv
            
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                
                # Header
                writer.writerow(['Railway Journey Report'])
                writer.writerow(['Train ID', self.train_id])
                writer.writerow(['Start Time', self.journey_log.get('start_time', 'N/A')])
                writer.writerow(['End Time', self.journey_log.get('end_time', 'N/A')])
                writer.writerow([])
                
                # Metrics
                writer.writerow(['PERFORMANCE METRICS'])
                writer.writerow(['Metric', 'Value', 'Unit'])
                writer.writerow(['Average Speed', f"{self.journey_log.get('average_speed', 0):.2f}", 'km/h'])
                writer.writerow(['Maximum Speed', f"{self.journey_log.get('max_speed', 0):.2f}", 'km/h'])
                writer.writerow(['Min Temperature', f"{self.journey_log.get('min_temperature', 0):.2f}", '°C'])
                writer.writerow(['Max Temperature', f"{self.journey_log.get('max_temperature', 0):.2f}", '°C'])
                writer.writerow(['Obstacles Detected', len(self.journey_log.get('obstacles_detected', [])), 'count'])
                writer.writerow([])
                
                # Obstacles
                writer.writerow(['OBSTACLES DETECTED'])
                writer.writerow(['Type', 'Location', 'Latitude', 'Longitude', 'Severity', 'Confidence'])
                for obs in self.journey_log.get('obstacles_detected', []):
                    writer.writerow([
                        obs.get('type', ''),
                        obs.get('location', ''),
                        f"{obs.get('latitude', 0):.4f}",
                        f"{obs.get('longitude', 0):.4f}",
                        obs.get('severity', ''),
                        f"{obs.get('confidence', 0):.3f}"
                    ])
                writer.writerow([])
                
                # Waypoints
                writer.writerow(['WAYPOINTS'])
                writer.writerow(['Name', 'Distance (km)', 'Latitude', 'Longitude', 'Timestamp'])
                for wp in self.journey_log.get('waypoints_visited', []):
                    writer.writerow([
                        wp.get('name', ''),
                        wp.get('distance_from_start_km', 0),
                        f"{wp.get('latitude', 0):.4f}",
                        f"{wp.get('longitude', 0):.4f}",
                        wp.get('timestamp', '')
                    ])
            
            print(f"✅ CSV report saved: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Error saving CSV report: {e}")
            return None
