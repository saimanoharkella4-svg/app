import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    ARRIVED = "ARRIVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    service_type = Column(String(100), nullable=False) # e.g., AC Repair, Plumbing, Deep Cleaning
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    scheduled_time = Column(DateTime, nullable=False, index=True)
    status = Column(SQLEnum(JobStatus), default=JobStatus.ASSIGNED, nullable=False, index=True)
    
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="SET NULL"), nullable=True, index=True)
    
    arrival_time = Column(DateTime, nullable=True)
    completion_time = Column(DateTime, nullable=True)
    time_on_site_minutes = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    outcome = Column(Text, nullable=True)
    verification_status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    follow_up_required = Column(Boolean, default=False, nullable=False)
    region = Column(String(100), nullable=True, default="North Zone")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    # Relationships
    staff = relationship("Staff", back_populates="jobs")
