from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    employee_code: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class StaffAuthInfo(BaseModel):
    id: int
    employee_code: str
    name: str
    phone: str
    email: EmailStr
    role: str
    status: str
    department: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: StaffAuthInfo


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

