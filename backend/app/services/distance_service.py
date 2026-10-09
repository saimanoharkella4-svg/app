import math
from datetime import datetime
from typing import List, Tuple, Optional
from app.core.utils import to_naive_utc


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    # Radius of earth in kilometers
    earth_radius_km = 6371.0
    return earth_radius_km * c


def calculate_speed_kmh(
    lat1: float, 
    lon1: float, 
    t1: datetime, 
    lat2: float, 
    lon2: float, 
    t2: datetime
) -> Tuple[float, float]:
    """
    Calculate distance (km) and speed (km/h) between two timestamped points.
    Returns (distance_km, speed_kmh).
    """
    distance_km = haversine_distance_km(lat1, lon1, lat2, lon2)
    t1_naive = to_naive_utc(t1)
    t2_naive = to_naive_utc(t2)
    time_diff_seconds = abs((t2_naive - t1_naive).total_seconds())

    if time_diff_seconds <= 0:
        return distance_km, 0.0

    hours = time_diff_seconds / 3600.0
    speed_kmh = distance_km / hours
    return distance_km, speed_kmh


def compute_route_total_distance(points: List[dict]) -> float:
    """
    Compute total distance in kilometers for a sequence of points,
    skipping anomalies and stationary noise.
    """
    if len(points) < 2:
        return 0.0

    total_km = 0.0
    for i in range(1, len(points)):
        prev = points[i - 1]
        curr = points[i]
        
        # Skip points flagged as anomalies
        if curr.get("is_anomaly", False) or prev.get("is_anomaly", False):
            continue

        lat1, lon1 = prev["latitude"], prev["longitude"]
        lat2, lon2 = curr["latitude"], curr["longitude"]
        
        d = haversine_distance_km(lat1, lon1, lat2, lon2)
        # Filter micro-jitter (< 15 meters)
        if d >= 0.015:
            total_km += d

    return round(total_km, 2)
