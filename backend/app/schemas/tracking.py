from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class LocationInput(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy: Optional[float] = Field(default=None, description="Accuracy in meters")
    speed: Optional[float] = Field(default=None, description="Speed in m/s or km/h")
    bearing: Optional[float] = Field(default=None, description="Bearing/heading in degrees 0-360")
    altitude: Optional[float] = Field(default=None, description="Altitude in meters")
    battery_level: Optional[int] = Field(default=None, ge=0, le=100)
    timestamp: datetime = Field(..., description="Timestamp when point was recorded")
    is_mock: Optional[bool] = False
    client_id: Optional[str] = Field(default=None, description="Client idempotency key to prevent duplicates")


class SingleLocationUpload(LocationInput):
    session_id: Optional[int] = None


class BatchLocationInput(BaseModel):
    session_id: Optional[int] = None
    locations: List[LocationInput]


class BatchLocationResponse(BaseModel):
    session_id: int
    total_received: int
    total_accepted: int
    accepted_client_ids: List[str]
    failed_client_ids: List[str]
    skipped_duplicates: int
    current_distance_km: float


class StartDutyRequest(BaseModel):
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    start_address: Optional[str] = None
    battery_level: Optional[int] = None


class StopDutyRequest(BaseModel):
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    end_address: Optional[str] = None
    battery_level: Optional[int] = None


class LocationPointResponse(BaseModel):
    id: int
    client_id: Optional[str] = None
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    bearing: Optional[float] = None
    altitude: Optional[float] = None
    battery_level: Optional[int] = None
    is_anomaly: bool = False
    anomaly_reason: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class TrackingSessionResponse(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    login_time: datetime
    logout_time: Optional[datetime] = None
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    start_address: Optional[str] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    end_address: Optional[str] = None
    total_distance_km: float
    status: str
    working_minutes: Optional[int] = None
    location_count: Optional[int] = 0

    class Config:
        from_attributes = True


class RouteResponse(BaseModel):
    session_id: int
    staff_id: int
    staff_name: str
    employee_code: str
    date: str
    login_time: datetime
    logout_time: Optional[datetime] = None
    total_distance_km: float
    status: str
    points: List[LocationPointResponse]
    start_point: Optional[LocationPointResponse] = None
    end_point: Optional[LocationPointResponse] = None
