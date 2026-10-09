from datetime import datetime, timezone
from typing import Optional


def utc_now() -> datetime:
    """Return naive UTC datetime for seamless cross-database compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert any datetime (aware or naive) to naive UTC."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def safe_datetime_diff_seconds(dt1: datetime, dt2: datetime) -> float:
    """Safely calculate abs seconds difference between two datetimes regardless of tzinfo."""
    t1 = to_naive_utc(dt1)
    t2 = to_naive_utc(dt2)
    return abs((t1 - t2).total_seconds())


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two geographic coordinates in meters.
    Compatible with PostGIS ST_DistanceSphere.
    """
    import math
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2) + (
        math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)
