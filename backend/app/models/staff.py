import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class StaffRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    FIELD_STAFF = "USER"


class StaffStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"          # On duty & currently tracking
    OFF_DUTY = "OFF_DUTY"      # Not on duty
    ON_BREAK = "ON_BREAK"      # Temporarily paused
    INACTIVE = "INACTIVE"      # Account disabled


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(StaffRole), default=StaffRole.FIELD_STAFF, nullable=False)
    status = Column(SQLEnum(StaffStatus), default=StaffStatus.OFF_DUTY, nullable=False)
    department = Column(String(100), nullable=True, default="Field Services")
    region = Column(String(100), nullable=True, default="North Zone")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    # Relationships
    sessions = relationship("TrackingSession", back_populates="staff", cascade="all, delete-orphan")
    location_points = relationship("LocationPoint", back_populates="staff", cascade="all, delete-orphan")
    daily_summaries = relationship("DailySummary", back_populates="staff", cascade="all, delete-orphan")
    weekly_summaries = relationship("WeeklySummary", back_populates="staff", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="staff")
    anomalies = relationship("GPSAnomaly", back_populates="staff", cascade="all, delete-orphan")
