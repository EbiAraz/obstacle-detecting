"""
Quick Paris to Monaco Journey Simulation
Fast execution without delays for immediate results
"""

import random
import json
from datetime import datetime
from railway_ai_system.domain.route_config import ROUTE_DATA, OBSTACLES_PROBABILITY, TEMPERATURE_VARIATION

class QuickParisMonacoSimulator:
    def __init__(self):
        self.train_id = "TGV-PARIS-MONACO-001"
        self.waypoints = ROUTE_DATA['waypoints']
        self.obstacles_detected = []
        self.journey_data = {
            'train_id': self.train_id,
            'route': f"{ROUTE_DATA['start']['name']} → {ROUTE_DATA['end']['name']}",
            'total_distance_km': ROUTE_DATA['waypoints'][-1]['distance_from_start_km'],
            'start_time': datetime.now().isoformat(),
            'obstacles': [],
            'waypoints': [],
            'speed_samples': [],
            'temperature_samples': []
        }
    
    def simulate(self):
        print("\n" + "="*80)
        print(f"🚄 TGV HIGH-SPEED RAILWAY SIMULATION")
        print("="*80)
        print(f"Route: {self.journey_data['route']}")
        print(f"Distance: {self.journey_data['total_distance_km']} km")
        print(f"Train: {self.train_id}")
        print("="*80 + "\n")
        
        # Simulate each segment
        for i in range(1, len(self.waypoints)):
            prev = self.waypoints[i-1]
            curr = self.waypoints[i]
            
            segment_distance = curr['distance_from_start_km'] - prev['distance_from_start_km']
            
            print(f"📍 {prev['name']} → {curr['name']} ({segment_distance} km)")
            
            # Record waypoint
            self.journey_data['waypoints'].append({
                'name': curr['name'],
                'latitude': curr['latitude'],
                'longitude': curr['longitude'],
                'distance_km': curr['distance_from_start_km']
            })
            
            # Simulate speed (TGV high-speed)
            avg_speed = random.uniform(250, 300) if segment_distance > 100 else random.uniform(120, 180)
            self.journey_data['speed_samples'].append({
                'location': curr['name'],
                'speed_kmh': round(avg_speed, 2)
            })
            print(f"  ⚡ Speed: {avg_speed:.1f} km/h")
            
            # Simulate temperature
            temp = TEMPERATURE_VARIATION.get(curr['name'], 20) + random.uniform(-2, 2)
            self.journey_data['temperature_samples'].append({
                'location': curr['name'],
                'temperature_celsius': round(temp, 2)
            })
            print(f"  🌡️  Temperature: {temp:.1f} °C")
            
            # Check for obstacles
            if curr['name'] in OBSTACLES_PROBABILITY:
                obs_config = OBSTACLES_PROBABILITY[curr['name']]
                if random.random() < obs_config['probability']:
                    obstacle = {
                        'location': curr['name'],
                        'latitude': curr['latitude'],
                        'longitude': curr['longitude'],
                        'type': obs_config['name'],
                        'severity': obs_config['severity'],
                        'confidence': round(random.uniform(0.7, 0.99), 3)
                    }
                    self.obstacles_detected.append(obstacle)
                    self.journey_data['obstacles'].append(obstacle)
                    
                    severity_icon = {'HIGH': '🔴', 'MEDIUM': '🟡', 'LOW': '🟢'}
                    icon = severity_icon.get(obs_config['severity'], '⚪')
                    print(f"  {icon} Obstacle: {obs_config['name']} ({obs_config['severity']})")
            
            print(f"  ✓ Reached {curr['name']}\n")
        
        # Calculate statistics
        self.journey_data['end_time'] = datetime.now().isoformat()
        self.journey_data['statistics'] = {
            'total_obstacles': len(self.obstacles_detected),
            'avg_speed_kmh': round(sum(s['speed_kmh'] for s in self.journey_data['speed_samples']) / len(self.journey_data['speed_samples']), 2),
            'max_speed_kmh': round(max(s['speed_kmh'] for s in self.journey_data['speed_samples']), 2),
            'min_speed_kmh': round(min(s['speed_kmh'] for s in self.journey_data['speed_samples']), 2),
            'avg_temp_celsius': round(sum(t['temperature_celsius'] for t in self.journey_data['temperature_samples']) / len(self.journey_data['temperature_samples']), 2),
            'max_temp_celsius': round(max(t['temperature_celsius'] for t in self.journey_data['temperature_samples']), 2),
            'min_temp_celsius': round(min(t['temperature_celsius'] for t in self.journey_data['temperature_samples']), 2),
        }
        
        # Obstacle breakdown
        severity_count = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        for obs in self.obstacles_detected:
            severity_count[obs['severity']] += 1
        self.journey_data['statistics']['obstacles_by_severity'] = severity_count
        
        return True
    
    def print_summary(self):
        print("\n" + "="*80)
        print("📊 JOURNEY SUMMARY")
        print("="*80)
        
        stats = self.journey_data['statistics']
        
        print(f"\n🚄 Performance Metrics:")
        print(f"  • Average Speed: {stats['avg_speed_kmh']} km/h")
        print(f"  • Maximum Speed: {stats['max_speed_kmh']} km/h")
        print(f"  • Minimum Speed: {stats['min_speed_kmh']} km/h")
        
        print(f"\n🌡️  Temperature Range:")
        print(f"  • Average: {stats['avg_temp_celsius']} °C")
        print(f"  • Maximum: {stats['max_temp_celsius']} °C")
        print(f"  • Minimum: {stats['min_temp_celsius']} °C")
        
        print(f"\n🚨 Obstacles Detected: {stats['total_obstacles']}")
        if stats['total_obstacles'] > 0:
            print(f"  🔴 HIGH Severity: {stats['obstacles_by_severity']['HIGH']}")
            print(f"  🟡 MEDIUM Severity: {stats['obstacles_by_severity']['MEDIUM']}")
            print(f"  🟢 LOW Severity: {stats['obstacles_by_severity']['LOW']}")
            
            print(f"\n📋 Obstacle Details:")
            for i, obs in enumerate(self.obstacles_detected, 1):
                print(f"  {i}. {obs['type']} at {obs['location']} ({obs['severity']}) - Confidence: {obs['confidence']}")
        
        print(f"\n📍 Waypoints Visited: {len(self.journey_data['waypoints'])}")
        for wp in self.journey_data['waypoints']:
            print(f"  • {wp['name']} ({wp['distance_km']} km)")
        
        print("\n" + "="*80)
    
    def save_report(self):
        filename = f"paris_monaco_journey_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.journey_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Journey report saved: {filename}")
        return filename


if __name__ == "__main__":
    simulator = QuickParisMonacoSimulator()
    
    if simulator.simulate():
        simulator.print_summary()
        simulator.save_report()
        
        print("\n✅ Paris → Monaco simulation completed successfully!")
    else:
        print("\n❌ Simulation failed!")
