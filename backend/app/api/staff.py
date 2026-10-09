from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.staff import Staff, StaffRole, StaffStatus
from app.schemas.staff import StaffCreate, StaffUpdate, StaffResponse, StaffListResponse
from app.api.deps import get_current_admin

router = APIRouter(prefix="/staff", tags=["Staff Management"])


@router.get("", response_model=StaffListResponse)
def list_staff(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List field staff with optional keyword search and filtering.
    """
    query = db.query(Staff)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Staff.name.ilike(search_filter)) |
            (Staff.employee_code.ilike(search_filter)) |
            (Staff.email.ilike(search_filter)) |
            (Staff.phone.ilike(search_filter))
        )
    if role:
        query = query.filter(Staff.role == role)
    if status:
        query = query.filter(Staff.status == status)

    total = query.count()
    items = query.order_by(Staff.id.asc()).offset(skip).limit(limit).all()

    return StaffListResponse(
        total=total,
        items=[StaffResponse.model_validate(s) for s in items]
    )


@router.get("/{id}", response_model=StaffResponse)
def get_staff(
    id: int,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve single staff member details.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return StaffResponse.model_validate(staff)


@router.post("", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff_in: StaffCreate,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new field staff member.
    """
    existing_code = db.query(Staff).filter(Staff.employee_code == staff_in.employee_code.strip()).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Employee code already in use")

    existing_email = db.query(Staff).filter(Staff.email == staff_in.email.strip().lower()).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already in use")

    try:
        assigned_role = StaffRole(staff_in.role)
    except ValueError:
        valid_roles = [r.value for r in StaffRole]
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role '{staff_in.role}'. Allowed roles are: {', '.join(valid_roles)}"
        )

    new_staff = Staff(
        employee_code=staff_in.employee_code.strip(),
        name=staff_in.name.strip(),
        phone=staff_in.phone.strip(),
        email=staff_in.email.strip().lower(),
        password_hash=get_password_hash(staff_in.password),
        role=assigned_role,
        status=StaffStatus.OFF_DUTY,
        department=staff_in.department
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return StaffResponse.model_validate(new_staff)


@router.put("/{id}", response_model=StaffResponse)
def update_staff(
    id: int,
    staff_in: StaffUpdate,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update staff details, role, or active status.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if staff_in.name is not None:
        staff.name = staff_in.name.strip()
    if staff_in.phone is not None:
        staff.phone = staff_in.phone.strip()
    if staff_in.email is not None:
        staff.email = staff_in.email.strip().lower()
    if staff_in.password is not None and staff_in.password.strip():
        staff.password_hash = get_password_hash(staff_in.password.strip())
    if staff_in.role is not None:
        try:
            staff.role = StaffRole(staff_in.role)
        except ValueError:
            valid_roles = [r.value for r in StaffRole]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role '{staff_in.role}'. Allowed roles are: {', '.join(valid_roles)}"
            )
    if staff_in.status is not None:
        try:
            staff.status = StaffStatus(staff_in.status)
        except ValueError:
            valid_statuses = [s.value for s in StaffStatus]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{staff_in.status}'. Allowed statuses are: {', '.join(valid_statuses)}"
            )
    if staff_in.department is not None:
        staff.department = staff_in.department

    db.commit()
    db.refresh(staff)
    return StaffResponse.model_validate(staff)


@router.delete("/{id}")
def delete_staff(
    id: int,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Soft-delete or deactivate a staff member.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    staff.status = StaffStatus.INACTIVE
    db.commit()
    return {"message": f"Staff {staff.employee_code} has been marked inactive"}
