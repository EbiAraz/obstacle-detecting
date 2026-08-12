"""
Railway Route Definition
Paris, France to Monaco route with waypoints
High-speed rail route across southeast France to the Riviera
"""

# Route from Paris to Monaco
# Coordinates: (latitude, longitude)

ROUTE_DATA = {
    'start': {
        'name': 'Paris',
        'latitude': 48.8566,
        'longitude': 2.3522,
        'description': 'Paris Gare de Lyon, France'
    },
    'end': {
        'name': 'Monaco',
        'latitude': 43.7384,
        'longitude': 7.4246,
        'description': 'Monaco-Monte-Carlo Station, Monaco'
    },
    'waypoints': [
        {'name': 'Paris',            'latitude': 48.8566, 'longitude': 2.3522, 'distance_from_start_km': 0},
        {'name': 'Lyon',             'latitude': 45.7640, 'longitude': 4.8357, 'distance_from_start_km': 465},
        {'name': 'Valence',          'latitude': 44.9334, 'longitude': 4.8924, 'distance_from_start_km': 565},
        {'name': 'Avignon',          'latitude': 43.9493, 'longitude': 4.8055, 'distance_from_start_km': 665},
        {'name': 'Aix-en-Provence',  'latitude': 43.5297, 'longitude': 5.4474, 'distance_from_start_km': 760},
        {'name': 'Marseille',        'latitude': 43.2965, 'longitude': 5.3698, 'distance_from_start_km': 790},
        {'name': 'Toulon',           'latitude': 43.1242, 'longitude': 5.9280, 'distance_from_start_km': 855},
        {'name': 'Cannes',           'latitude': 43.5528, 'longitude': 7.0174, 'distance_from_start_km': 940},
        {'name': 'Nice',             'latitude': 43.7102, 'longitude': 7.2620, 'distance_from_start_km': 960},
        {'name': 'Monaco',           'latitude': 43.7384, 'longitude': 7.4246, 'distance_from_start_km': 980},
    ]
}

# Total route distance in kilometers
TOTAL_DISTANCE = 980

# Possible obstacles and their characteristics per waypoint
OBSTACLES_PROBABILITY = {
    'Lyon':             {'name': 'Track Maintenance',     'severity': 'MEDIUM', 'probability': 0.16},
    'Valence':          {'name': 'Fallen Rock',           'severity': 'HIGH',   'probability': 0.20},
    'Avignon':          {'name': 'Debris on Track',       'severity': 'MEDIUM', 'probability': 0.17},
    'Aix-en-Provence':  {'name': 'Animal on Track',       'severity': 'LOW',    'probability': 0.12},
    'Marseille':        {'name': 'Construction Equipment','severity': 'HIGH',   'probability': 0.22},
    'Toulon':           {'name': 'Signal Failure',        'severity': 'MEDIUM', 'probability': 0.18},
    'Cannes':           {'name': 'Landslide',             'severity': 'HIGH',   'probability': 0.24},
    'Nice':             {'name': 'Urban Pedestrian',      'severity': 'HIGH',   'probability': 0.28},
    'Monaco':           {'name': 'Platform Intrusion',    'severity': 'HIGH',   'probability': 0.25},
}

# Dedicated level-crossing hotspots (road-rail intersections)
ROAD_RAIL_INTERSECTIONS = [
    {
        'name': 'Lyon Part-Dieu Crossing',
        'near_waypoint': 'Lyon',
        'latitude': 45.7600,
        'longitude': 4.8600,
        'risk_level': 'HIGH',
        'trigger_probability': 0.12,
        'camera_id': 'CAM-LYO-001',
        'infrared_sensor_id': 'IR-LYO-001',
    },
    {
        'name': 'Valence South Crossing',
        'near_waypoint': 'Valence',
        'latitude': 44.9200,
        'longitude': 4.9000,
        'risk_level': 'HIGH',
        'trigger_probability': 0.14,
        'camera_id': 'CAM-VAL-001',
        'infrared_sensor_id': 'IR-VAL-001',
    },
    {
        'name': 'Avignon East Crossing',
        'near_waypoint': 'Avignon',
        'latitude': 43.9500,
        'longitude': 4.8200,
        'risk_level': 'MEDIUM',
        'trigger_probability': 0.10,
        'camera_id': 'CAM-AVI-001',
        'infrared_sensor_id': 'IR-AVI-001',
    },
    {
        'name': 'Marseille Basin Crossing',
        'near_waypoint': 'Marseille',
        'latitude': 43.3000,
        'longitude': 5.3900,
        'risk_level': 'HIGH',
        'trigger_probability': 0.13,
        'camera_id': 'CAM-MRS-001',
        'infrared_sensor_id': 'IR-MRS-001',
    },
    {
        'name': 'Toulon Harbor Crossing',
        'near_waypoint': 'Toulon',
        'latitude': 43.1200,
        'longitude': 5.9400,
        'risk_level': 'HIGH',
        'trigger_probability': 0.16,
        'camera_id': 'CAM-TLN-001',
        'infrared_sensor_id': 'IR-TLN-001',
    },
    {
        'name': 'Nice Riviera Crossing',
        'near_waypoint': 'Nice',
        'latitude': 43.7000,
        'longitude': 7.2700,
        'risk_level': 'HIGH',
        'trigger_probability': 0.14,
        'camera_id': 'CAM-NCE-001',
        'infrared_sensor_id': 'IR-NCE-001',
    },
]

# Camera sensor classes for road-rail intersection monitoring.
CROSSING_CAMERA_OBJECTS = [
    {
        'label': 'Person on Rails',
        'category': 'PERSON',
        'base_severity': 'HIGH',
        'recommended_actions': ['Trigger horn warning', 'Prepare emergency brake', 'Notify crossing operator'],
    },
    {
        'label': 'Vehicle on Rails',
        'category': 'VEHICLE',
        'base_severity': 'HIGH',
        'recommended_actions': ['Apply emergency brake', 'Notify road traffic control', 'Dispatch crossing assistance'],
    },
    {
        'label': 'Obstacle on Rails',
        'category': 'OBSTACLE',
        'base_severity': 'MEDIUM',
        'recommended_actions': ['Reduce speed', 'Warn approaching train', 'Notify maintenance control'],
    },
]

ALERT_RECIPIENTS = ['driver', 'train_control', 'client_app']

# Automatic mitigation when repeated crossing alerts are detected.
CROSSING_EMERGENCY_POLICY = {
    'segment_alert_threshold': 3,
    'emergency_speed_kmh': 35,
    'dwell_seconds': 0.8,
    'stop_hold_alert_threshold': 5,
    'stop_hold_seconds': 2.0,
    'require_operator_ack': True,
    'max_stop_holds_per_segment': 1,
    'abort_on_repeat_stop_hold': True,
}

# Speed profile for different segments
SPEED_PROFILE = {
    'residential': 30,      # km/h
    'urban': 60,           # km/h
    'suburban': 80,        # km/h
    'highway': 120,        # km/h
    'mountainous': 90,     # km/h
    'tgv_highspeed': 300,  # km/h - TGV maximum
    'coastal': 160,        # km/h - Coastal sections
}

# Temperature variations during journey (France to Mediterranean coast)
TEMPERATURE_VARIATION = {
    'Paris':            15,
    'Lyon':             17,
    'Valence':          18,
    'Avignon':          21,
    'Aix-en-Provence':  22,
    'Marseille':        23,
    'Toulon':           24,
    'Cannes':           25,
    'Nice':             25,
    'Monaco':           24,
}
