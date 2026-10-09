from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.tracking import LocationPoint, GPSAnomaly, TrackingSession
from app.services.distance_service import calculate_speed_kmh
from app.core.config import settings
from app.core.utils import safe_datetime_diff_seconds, utc_now


def check_and_record_anomaly(
    db: Session,
    session: TrackingSession,
    staff_id: int,
    latitude: float,
    longitude: float,
    accuracy: Optional[float],
    recorded_at: datetime,
    is_mock: bool = False,
    last_point: Optional[LocationPoint] = None
) -> Tuple[bool, Optional[str]]:
    """
    Examine incoming GPS coordinate for anomalies.
    Returns (is_anomaly, reason).
    """
    reasons = []
    severity = "LOW"
    anomaly_type = "GPS_ANOMALY"

    # 1. Check for mock GPS providers
    if is_mock:
        reasons.append("Mock location provider detected")
        severity = "HIGH"
        anomaly_type = "MOCK_LOCATION"

    # 2. Check for poor GPS accuracy
    if accuracy is not None and accuracy > settings.ACCURACY_THRESHOLD_METERS:
        reasons.append(f"Poor GPS accuracy ({accuracy:.1f}m > threshold {settings.ACCURACY_THRESHOLD_METERS}m)")
        severity = "LOW"
        anomaly_type = "POOR_ACCURACY"

    # 3. Check for impossible speed/movement compared to last point
    if last_point:
        d_km, speed_kmh = calculate_speed_kmh(
            last_point.latitude,
            last_point.longitude,
            last_point.recorded_at,
            latitude,
            longitude,
            recorded_at
        )
        
        time_diff_sec = safe_datetime_diff_seconds(recorded_at, last_point.recorded_at)

        # Unrealistic jump: e.g., > 10 km in less than 2 minutes
        if d_km > 10.0 and time_diff_sec < 120:
            reasons.append(f"Impossible jump of {d_km:.1f}km in {int(time_diff_sec)}s")
            severity = "HIGH"
            anomaly_type = "LARGE_JUMP"
        elif speed_kmh > settings.MAX_REALISTIC_SPEED_KMH:
            reasons.append(f"Unrealistic movement speed ({speed_kmh:.1f} km/h > {settings.MAX_REALISTIC_SPEED_KMH} km/h)")
            severity = "MEDIUM"
            anomaly_type = "IMPOSSIBLE_SPEED"

    if reasons:
        full_reason = "; ".join(reasons)
        # Create anomaly record in database
        anomaly = GPSAnomaly(
            staff_id=staff_id,
            session_id=session.id,
            anomaly_type=anomaly_type,
            description=full_reason,
            severity=severity,
            detected_at=utc_now(),
            reviewed=False
        )
        db.add(anomaly)
        return True, full_reason

    return False, None
