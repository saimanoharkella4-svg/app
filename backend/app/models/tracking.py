import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    TERMINATED_ABNORMALLY = "TERMINATED_ABNORMALLY"


class TrackingSession(Base):
    __tablename__ = "tracking_sessions"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False, index=True)
    login_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    logout_time = Column(DateTime, nullable=True)
    
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)
    start_address = Column(String(255), nullable=True)
    
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)
    end_address = Column(String(255), nullable=True)
    
    total_distance_km = Column(Float, default=0.0, nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False, index=True)
    
    device_battery_start = Column(Integer, nullable=True)
    device_battery_end = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    # Relationships
    staff = relationship("Staff", back_populates="sessions")
    location_points = relationship(
        "LocationPoint", 
        back_populates="session", 
        cascade="all, delete-orphan",
        order_by="LocationPoint.recorded_at"
    )
    anomalies = relationship("GPSAnomaly", back_populates="session", cascade="all, delete-orphan")


class LocationPoint(Base):
    __tablename__ = "location_points"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String(100), unique=True, index=True, nullable=True)  # Idempotency key from mobile client
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("tracking_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)     # In meters
    speed = Column(Float, nullable=True)        # In m/s or km/h
    bearing = Column(Float, nullable=True)      # Heading in degrees (0-360)
    altitude = Column(Float, nullable=True)     # In meters
    battery_level = Column(Integer, nullable=True) # Percentage 0-100
    
    is_mock = Column(Boolean, default=False, nullable=False)
    is_anomaly = Column(Boolean, default=False, nullable=False)
    anomaly_reason = Column(String(255), nullable=True)
    
    recorded_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    staff = relationship("Staff", back_populates="location_points")
    session = relationship("TrackingSession", back_populates="location_points")

    __table_args__ = (
        Index("idx_location_session_recorded", "session_id", "recorded_at"),
        Index("idx_location_staff_recorded", "staff_id", "recorded_at"),
    )


class GPSAnomaly(Base):
    __tablename__ = "gps_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("tracking_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    location_point_id = Column(Integer, ForeignKey("location_points.id", ondelete="SET NULL"), nullable=True)
    
    anomaly_type = Column(String(50), nullable=False) # IMPOSSIBLE_SPEED, POOR_ACCURACY, MOCK_LOCATION, LARGE_JUMP, TRACKING_GAP
    description = Column(String(255), nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    reviewed = Column(Boolean, default=False, nullable=False)

    staff = relationship("Staff", back_populates="anomalies")
    session = relationship("TrackingSession", back_populates="anomalies")
