from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


class DailySummaryResponse(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    employee_code: Optional[str] = None
    date: date
    login_time: Optional[datetime] = None
    logout_time: Optional[datetime] = None
    working_minutes: int
    working_hours_formatted: str
    distance_km: float
    location_count: int
    jobs_assigned: int
    jobs_completed: int

    class Config:
        from_attributes = True


class WeeklyDayBreakdown(BaseModel):
    day_name: str
    date: date
    working_hours_formatted: str
    working_minutes: int
    distance_km: float
    jobs_completed: int


class WeeklySummaryResponse(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    employee_code: Optional[str] = None
    week_start: date
    week_end: date
    days_worked: int
    total_hours: float
    total_hours_formatted: str
    total_distance: float
    jobs_assigned: int
    jobs_completed: int
    average_daily_distance: float
    average_daily_hours: float
    daily_breakdown: Optional[List[WeeklyDayBreakdown]] = None

    class Config:
        from_attributes = True


class LiveStaffItem(BaseModel):
    staff_id: int
    employee_code: str
    name: str
    role: str
    status: str
    session_id: Optional[int] = None
    login_time: Optional[datetime] = None
    working_duration: Optional[str] = None
    working_minutes: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    battery_level: Optional[int] = None
    last_update: Optional[datetime] = None
    today_distance_km: float = 0.0
    jobs_today: int = 0
    jobs_completed_today: int = 0
    current_area: Optional[str] = None


class OverviewStatsResponse(BaseModel):
    active_staff_count: int
    offline_staff_count: int
    total_staff_count: int
    jobs_today_count: int
    completed_jobs_count: int
    total_distance_today_km: float
    average_hours_today: float


class JobCreate(BaseModel):
    customer_name: str
    customer_phone: str
    service_type: str
    address: str
    latitude: float
    longitude: float
    scheduled_time: datetime
    staff_id: Optional[int] = None
    notes: Optional[str] = None
    region: Optional[str] = "Hyderabad North"


class JobResponse(BaseModel):
    id: int
    job_number: str
    customer_name: str
    customer_phone: str
    service_type: str
    address: str
    latitude: float
    longitude: float
    scheduled_time: datetime
    status: str
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    arrival_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    time_on_site_minutes: Optional[int] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    outcome: Optional[str] = None
    verification_status: Optional[str] = "PENDING"
    follow_up_required: bool = False
    region: Optional[str] = "Hyderabad North"
    created_at: datetime

    class Config:
        from_attributes = True
