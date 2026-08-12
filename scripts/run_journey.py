"""Simple script to generate an Ankara to Istanbul journey artifact set."""

from datetime import datetime, timedelta
from railway_ai_system.core.logging import AdvancedJourneyLogger
from railway_ai_system.domain.route_config import ROUTE_DATA, OBSTACLES_PROBABILITY
import json

print("="*70)
print("🚂 GENERATING ANKARA TO ISTANBUL JOURNEY REPORT")
print("="*70)

# Build journey positions from route waypoints
positions = []
start_time = datetime.now()
print(f"\n✅ Start Time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"✅ Route: Ankara → Istanbul ({ROUTE_DATA['waypoints'][-1]['distance_from_start_km']} km)")
print(f"✅ Waypoints: {len(ROUTE_DATA['waypoints'])}")

for idx, wp in enumerate(ROUTE_DATA['waypoints']):
    timestamp = start_time + timedelta(minutes=30*idx)  # 30 min between waypoints
    positions.append({
        'latitude': wp['latitude'],
        'longitude': wp['longitude'],
        'timestamp': timestamp.isoformat(),
        'name': wp['name'],
        'distance_km': wp['distance_from_start_km']
    })
    print(f"  • {wp['name']}: {wp['distance_from_start_km']} km")

# Build obstacles from configuration
obstacles = []
name_to_coord = {wp['name']: (wp['latitude'], wp['longitude']) 
                 for wp in ROUTE_DATA['waypoints']}

print(f"\n✅ Configured Obstacles: {len(OBSTACLES_PROBABILITY)}")
for name, meta in OBSTACLES_PROBABILITY.items():
    if name in name_to_coord:
        lat, lon = name_to_coord[name]
        obstacles.append({
            'latitude': lat,
            'longitude': lon,
            'obstacle_type': meta['name'],
            'severity': meta['severity'],
            'location': name
        })
        print(f"  • {name}: {meta['name']} ({meta['severity']})")

# Initialize logger
print("\n✅ Initializing Advanced Journey Logger...")
logger = AdvancedJourneyLogger()

# Generate interactive map
print("\n✅ Generating interactive journey map...")
map_path = logger.generate_journey_map_with_images('TRAIN-001', positions, obstacles)
print(f"✅ Map saved to: {map_path}")

# Capture journey screenshot
print("\n✅ Capturing journey screenshot...")
screenshot_path = logger.capture_journey_screenshot(
    train_id='TRAIN-001',
    latitude=positions[3]['latitude'],  # Mid-journey point
    longitude=positions[3]['longitude'],
    speed=95.5,
    temperature=20.3,
    obstacles_detected=len(obstacles)
)
print(f"✅ Screenshot saved to: {screenshot_path}")

# Log the image
logger.log_image_with_details(
    train_id='TRAIN-001',
    latitude=positions[3]['latitude'],
    longitude=positions[3]['longitude'],
    image_path=screenshot_path,
    description='Mid-journey status capture',
    event_type='JOURNEY_STATUS'
)

# Generate complete report
print("\n✅ Generating complete journey report...")
report = logger.generate_complete_report('TRAIN-001')

# Export report as JSON
json_report_path = logger.export_report_as_json('TRAIN-001')
print(f"✅ JSON report saved to: {json_report_path}")

# Create summary report
print("\n" + "="*70)
print("📊 JOURNEY SUMMARY")
print("="*70)
print(f"Train ID: TRAIN-001")
print(f"Route: Ankara → Istanbul")
print(f"Total Distance: {ROUTE_DATA['waypoints'][-1]['distance_from_start_km']} km")
print(f"Waypoints: {len(positions)}")
print(f"Obstacles Detected: {len(obstacles)}")
if report and 'summary' in report:
    print(f"Images Captured: {report['summary']['total_images']}")
    print(f"Total Logs: {report['summary']['total_logs']}")
else:
    print(f"Images Captured: 1")
    print(f"Total Logs: Generated")

print("\n" + "="*70)
print("📁 OUTPUT FILES")
print("="*70)
print(f"🗺️  Interactive Map: {map_path}")
print(f"📸 Screenshot: {screenshot_path}")
print(f"📄 JSON Report: {json_report_path}")

print("\n" + "="*70)
print("✅ JOURNEY COMPLETE!")
print("="*70)
print(f"\n💡 To view the map, open: {map_path}")
print("   in your web browser (double-click the HTML file)")
print("\n🎉 All reports and maps have been generated successfully!")
