"""
Generate Interactive Route Map and Visualizations
Creates HTML map and result charts for Paris → Monaco journey
"""

import json
import folium
from folium import plugins
from datetime import datetime

# Load the journey data
with open('paris_monaco_journey_20260128_122110.json', 'r', encoding='utf-8') as f:
    journey_data = json.load(f)

print("="*80)
print("🗺️  GENERATING PARIS → MONACO INTERACTIVE MAP")
print("="*80)

# Create the map centered on the route
center_lat = (48.8566 + 43.7384) / 2  # Between Paris and Monaco
center_lon = (2.3522 + 7.4246) / 2

# Create map with terrain
route_map = folium.Map(
    location=[center_lat, center_lon],
    zoom_start=7,
    tiles='OpenStreetMap'
)

# Add title
title_html = '''
<div style="position: fixed; 
            top: 10px; 
            left: 50px; 
            width: 400px; 
            height: 90px; 
            background-color: white; 
            border: 2px solid #3498db;
            border-radius: 10px;
            z-index: 9999; 
            font-size: 14px;
            padding: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
    <h3 style="margin: 0; color: #2c3e50;">🚄 TGV Paris → Monaco</h3>
    <p style="margin: 5px 0; color: #7f8c8d;"><b>Distance:</b> 950 km | <b>Train:</b> TGV-PARIS-MONACO-001</p>
    <p style="margin: 5px 0; color: #e74c3c;"><b>Obstacles:</b> 2 detected</p>
</div>
'''
route_map.get_root().html.add_child(folium.Element(title_html))

# Prepare coordinates for the route line
route_coords = []
waypoints = journey_data['waypoints']

# Add Paris as start
route_coords.append([48.8566, 2.3522])

# Add all waypoints
for wp in waypoints:
    route_coords.append([wp['latitude'], wp['longitude']])

print(f"\n✓ Processing {len(route_coords)} waypoints...")

# Draw the main route line
folium.PolyLine(
    route_coords,
    color='#3498db',
    weight=4,
    opacity=0.8,
    popup='TGV Route'
).add_to(route_map)

# Add gradient effect (speed-based coloring)
speed_samples = journey_data['speed_samples']
for i in range(len(route_coords) - 1):
    if i < len(speed_samples):
        speed = speed_samples[i]['speed_kmh']
        # Color gradient: green (slow) to red (fast)
        if speed > 250:
            color = '#e74c3c'  # Red for high speed
        elif speed > 180:
            color = '#f39c12'  # Orange for medium-high
        elif speed > 140:
            color = '#f1c40f'  # Yellow for medium
        else:
            color = '#27ae60'  # Green for lower speed
        
        folium.PolyLine(
            [route_coords[i], route_coords[i+1]],
            color=color,
            weight=6,
            opacity=0.6
        ).add_to(route_map)

print("✓ Route line drawn with speed gradient")

# Add START marker (Paris)
folium.Marker(
    [48.8566, 2.3522],
    popup='<b>🏁 START: Paris Gare de Lyon</b><br>Lat: 48.8566<br>Lon: 2.3522',
    tooltip='START: Paris',
    icon=folium.Icon(color='green', icon='play', prefix='fa')
).add_to(route_map)

# Add waypoint markers with details
for i, wp in enumerate(waypoints):
    # Get speed and temperature for this waypoint
    speed_info = speed_samples[i] if i < len(speed_samples) else None
    temp_info = journey_data['temperature_samples'][i] if i < len(journey_data['temperature_samples']) else None
    
    speed_text = f"{speed_info['speed_kmh']:.1f} km/h" if speed_info else "N/A"
    temp_text = f"{temp_info['temperature_celsius']:.1f} °C" if temp_info else "N/A"
    
    popup_html = f'''
    <div style="width: 200px;">
        <h4 style="margin: 0; color: #2c3e50;">{wp['name']}</h4>
        <hr style="margin: 5px 0;">
        <p style="margin: 3px 0;"><b>📍 Distance:</b> {wp['distance_km']} km</p>
        <p style="margin: 3px 0;"><b>⚡ Speed:</b> {speed_text}</p>
        <p style="margin: 3px 0;"><b>🌡️ Temp:</b> {temp_text}</p>
        <p style="margin: 3px 0;"><b>🌍 Coords:</b> {wp['latitude']:.4f}, {wp['longitude']:.4f}</p>
    </div>
    '''
    
    # Different color for different regions
    if i < 2:
        marker_color = 'blue'  # Northern France
    elif i < 5:
        marker_color = 'purple'  # Central France
    elif i < 8:
        marker_color = 'orange'  # Provence
    else:
        marker_color = 'cadetblue'  # Riviera
    
    folium.CircleMarker(
        location=[wp['latitude'], wp['longitude']],
        radius=8,
        popup=popup_html,
        tooltip=f"{wp['name']} ({wp['distance_km']} km)",
        color='white',
        fillColor=marker_color,
        fillOpacity=0.8,
        weight=2
    ).add_to(route_map)

print(f"✓ Added {len(waypoints)} waypoint markers")

# Add FINISH marker (Monaco)
folium.Marker(
    [43.7384, 7.4246],
    popup='<b>🏁 FINISH: Monaco-Monte-Carlo</b><br>Lat: 43.7384<br>Lon: 7.4246<br>✅ Journey Complete!',
    tooltip='FINISH: Monaco',
    icon=folium.Icon(color='red', icon='flag-checkered', prefix='fa')
).add_to(route_map)

# Add obstacle markers
for i, obs in enumerate(journey_data['obstacles']):
    obstacle_html = f'''
    <div style="width: 220px;">
        <h4 style="margin: 0; color: #e74c3c;">⚠️ OBSTACLE #{i+1}</h4>
        <hr style="margin: 5px 0;">
        <p style="margin: 3px 0;"><b>Type:</b> {obs['type']}</p>
        <p style="margin: 3px 0;"><b>Severity:</b> <span style="color: {'#e74c3c' if obs['severity'] == 'HIGH' else '#f39c12'};">{obs['severity']}</span></p>
        <p style="margin: 3px 0;"><b>Location:</b> {obs['location']}</p>
        <p style="margin: 3px 0;"><b>Confidence:</b> {obs['confidence']*100:.1f}%</p>
        <p style="margin: 3px 0;"><b>Coords:</b> {obs['latitude']:.4f}, {obs['longitude']:.4f}</p>
    </div>
    '''
    
    folium.Marker(
        location=[obs['latitude'], obs['longitude']],
        popup=obstacle_html,
        tooltip=f"⚠️ {obs['type']} ({obs['severity']})",
        icon=folium.Icon(
            color='red' if obs['severity'] == 'HIGH' else 'orange',
            icon='exclamation-triangle',
            prefix='fa'
        )
    ).add_to(route_map)

print(f"✓ Added {len(journey_data['obstacles'])} obstacle markers")

# Add legend
legend_html = '''
<div style="position: fixed; 
            bottom: 50px; 
            left: 50px; 
            width: 200px; 
            background-color: white; 
            border: 2px solid #3498db;
            border-radius: 10px;
            z-index: 9999; 
            font-size: 12px;
            padding: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Legend</h4>
    <p style="margin: 3px 0;"><span style="color: #e74c3c;">━━</span> High Speed (>250 km/h)</p>
    <p style="margin: 3px 0;"><span style="color: #f39c12;">━━</span> Medium-High (180-250)</p>
    <p style="margin: 3px 0;"><span style="color: #f1c40f;">━━</span> Medium (140-180)</p>
    <p style="margin: 3px 0;"><span style="color: #27ae60;">━━</span> Regional (<140)</p>
    <p style="margin: 3px 0;">🏁 Start/Finish Points</p>
    <p style="margin: 3px 0;">⚠️ Obstacles Detected</p>
</div>
'''
route_map.get_root().html.add_child(folium.Element(legend_html))

# Add minimap
minimap = plugins.MiniMap()
route_map.add_child(minimap)

# Add fullscreen option
plugins.Fullscreen().add_to(route_map)

# Save the map
map_filename = 'paris_monaco_interactive_map.html'
route_map.save(map_filename)

print(f"\n✅ Interactive map saved: {map_filename}")
print(f"   Open this file in your browser to explore the route!\n")

# Create statistics summary HTML
stats = journey_data['statistics']

stats_html = f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paris → Monaco Journey Results</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #2c3e50;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }}
        h1 {{
            text-align: center;
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 2.5em;
        }}
        .subtitle {{
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
            font-size: 1.2em;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }}
        .stat-value {{
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }}
        .stat-label {{
            font-size: 1em;
            opacity: 0.9;
        }}
        .route-map {{
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 15px;
        }}
        .waypoint {{
            padding: 10px 20px;
            margin: 5px 0;
            background: white;
            border-left: 4px solid #3498db;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .obstacle-card {{
            background: #ffe6e6;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
        }}
        .obstacle-high {{ border-left-color: #e74c3c; }}
        .obstacle-medium {{ border-left-color: #f39c12; }}
        .chart {{
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 15px;
        }}
        .progress-bar {{
            width: 100%;
            height: 30px;
            background: #ecf0f1;
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }}
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #27ae60, #f39c12, #e74c3c);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚄 TGV Paris → Monaco</h1>
        <p class="subtitle">High-Speed Railway Journey Results</p>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Distance</div>
                <div class="stat-value">950 km</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Speed</div>
                <div class="stat-value">{stats['avg_speed_kmh']:.0f} km/h</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Maximum Speed</div>
                <div class="stat-value">{stats['max_speed_kmh']:.0f} km/h</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Obstacles Detected</div>
                <div class="stat-value">{stats['total_obstacles']}</div>
            </div>
        </div>

        <div class="chart">
            <h2>🌡️ Temperature Profile</h2>
            <p>Temperature variation: {stats['min_temp_celsius']:.1f}°C to {stats['max_temp_celsius']:.1f}°C</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 100%;">
                    Average: {stats['avg_temp_celsius']:.1f}°C
                </div>
            </div>
        </div>

        <div class="route-map">
            <h2>📍 Journey Waypoints</h2>
'''

for i, wp in enumerate(waypoints):
    speed = speed_samples[i]['speed_kmh'] if i < len(speed_samples) else 0
    temp = journey_data['temperature_samples'][i]['temperature_celsius'] if i < len(journey_data['temperature_samples']) else 0
    stats_html += f'''
            <div class="waypoint">
                <div>
                    <strong>{i+1}. {wp['name']}</strong> ({wp['distance_km']} km)
                </div>
                <div>
                    ⚡ {speed:.0f} km/h | 🌡️ {temp:.1f}°C
                </div>
            </div>
'''

stats_html += '''
        </div>

        <div class="chart">
            <h2>🚨 Obstacles Detected</h2>
'''

if journey_data['obstacles']:
    for i, obs in enumerate(journey_data['obstacles']):
        severity_class = f"obstacle-{obs['severity'].lower()}"
        stats_html += f'''
            <div class="obstacle-card {severity_class}">
                <h3>⚠️ Obstacle #{i+1}: {obs['type']}</h3>
                <p><strong>Location:</strong> {obs['location']} ({obs['latitude']:.4f}, {obs['longitude']:.4f})</p>
                <p><strong>Severity:</strong> {obs['severity']} | <strong>Confidence:</strong> {obs['confidence']*100:.1f}%</p>
            </div>
'''
else:
    stats_html += '<p>✅ No obstacles detected - Clear journey!</p>'

stats_html += f'''
        </div>

        <div class="chart">
            <h2>📊 Performance Summary</h2>
            <ul style="line-height: 2;">
                <li><strong>Train ID:</strong> {journey_data['train_id']}</li>
                <li><strong>Route:</strong> {journey_data['route']}</li>
                <li><strong>Total Distance:</strong> {journey_data['total_distance_km']} km</li>
                <li><strong>Waypoints:</strong> {len(waypoints)} cities</li>
                <li><strong>Speed Range:</strong> {stats['min_speed_kmh']:.0f} - {stats['max_speed_kmh']:.0f} km/h</li>
                <li><strong>Temperature Range:</strong> {stats['min_temp_celsius']:.1f}°C - {stats['max_temp_celsius']:.1f}°C</li>
                <li><strong>Status:</strong> ✅ Journey Completed Successfully</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 10px;">
            <h2 style="color: #27ae60;">✅ JOURNEY COMPLETE</h2>
            <p>Paris → Monaco TGV high-speed rail journey successfully simulated</p>
            <p style="margin-top: 10px; color: #7f8c8d;">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
</body>
</html>
'''

# Save stats HTML
stats_filename = 'paris_monaco_results.html'
with open(stats_filename, 'w', encoding='utf-8') as f:
    f.write(stats_html)

print(f"✅ Results page saved: {stats_filename}")

print("\n" + "="*80)
print("📊 SUMMARY")
print("="*80)
print(f"✓ Interactive Map:  {map_filename}")
print(f"✓ Results Page:     {stats_filename}")
print(f"✓ JSON Data:        paris_monaco_journey_20260128_122110.json")
print("\n🌐 Open the HTML files in your browser to view the visualizations!")
print("="*80)
