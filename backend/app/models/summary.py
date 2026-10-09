from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class DailySummary(Base):
    __tablename__ = "daily_summary"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    login_time = Column(DateTime, nullable=True)
    logout_time = Column(DateTime, nullable=True)
    working_minutes = Column(Integer, default=0, nullable=False)
    distance_km = Column(Float, default=0.0, nullable=False)
    location_count = Column(Integer, default=0, nullable=False)
    jobs_assigned = Column(Integer, default=0, nullable=False)
    jobs_completed = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    staff = relationship("Staff", back_populates="daily_summaries")

    __table_args__ = (
        Index("idx_daily_summary_staff_date", "staff_id", "date", unique=True),
    )


class WeeklySummary(Base):
    __tablename__ = "weekly_summary"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start = Column(Date, nullable=False, index=True)
    week_end = Column(Date, nullable=False, index=True)
    days_worked = Column(Integer, default=0, nullable=False)
    total_hours = Column(Float, default=0.0, nullable=False)
    total_distance = Column(Float, default=0.0, nullable=False)
    jobs_assigned = Column(Integer, default=0, nullable=False)
    jobs_completed = Column(Integer, default=0, nullable=False)
    average_daily_distance = Column(Float, default=0.0, nullable=False)
    average_daily_hours = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    staff = relationship("Staff", back_populates="weekly_summaries")

    __table_args__ = (
        Index("idx_weekly_summary_staff_range", "staff_id", "week_start", "week_end", unique=True),
    )
