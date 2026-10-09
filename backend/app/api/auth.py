from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.staff import Staff
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, StaffAuthInfo, ChangePasswordRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate staff or admin using employee code and password.
    Returns JWT access token and refresh token.
    """
    staff = db.query(Staff).filter(
        (Staff.employee_code == request.employee_code.strip()) |
        (Staff.email == request.employee_code.strip().lower())
    ).first()

    if not staff or not verify_password(request.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID or password"
        )

    access_token = create_access_token(
        subject=staff.id,
        role=staff.role.value,
        employee_code=staff.employee_code,
        name=staff.name
    )
    refresh_token = create_refresh_token(subject=staff.id, role=staff.role.value)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=StaffAuthInfo.model_validate(staff)
    )


@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Generate a new access token using a valid refresh token.
    """
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    staff = db.query(Staff).filter(Staff.id == int(user_id)).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )

    new_access_token = create_access_token(
        subject=staff.id,
        role=staff.role.value,
        employee_code=staff.employee_code,
        name=staff.name
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
def logout(current_user: Staff = Depends(get_current_user)):
    """
    Client session logout confirmation.
    """
    return {"message": f"User {current_user.employee_code} successfully logged out."}


@router.get("/me", response_model=StaffAuthInfo)
def get_current_profile(current_user: Staff = Depends(get_current_user)):
    """
    Retrieve profile details of the authenticated staff member.
    """
    return StaffAuthInfo.model_validate(current_user)


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allow marketing executive or admin to change their password securely.
    """
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match"
        )
    if len(request.new_password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )

    current_user.password_hash = get_password_hash(request.new_password.strip())
    db.commit()
    return {"message": "Password updated successfully"}
