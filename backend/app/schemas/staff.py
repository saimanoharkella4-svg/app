from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class StaffCreate(BaseModel):
    employee_code: str
    name: str
    phone: str
    email: EmailStr
    password: str
    role: str = "FIELD_STAFF"
    department: Optional[str] = "Field Services"
    region: Optional[str] = "Hyderabad North"


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None
    region: Optional[str] = None


class StaffResponse(BaseModel):
    id: int
    employee_code: str
    name: str
    phone: str
    email: EmailStr
    role: str
    status: str
    department: Optional[str] = None
    region: Optional[str] = "Hyderabad North"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StaffListResponse(BaseModel):
    total: int
    items: List[StaffResponse]
