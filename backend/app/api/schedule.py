import io
import csv
import openpyxl
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.staff import Staff
from app.models.job import Job, JobStatus
from app.api.deps import get_current_user
from app.core.utils import to_naive_utc, utc_now
from pydantic import BaseModel

router = APIRouter(prefix="/schedule", tags=["Schedule Management"])


class ScheduleResponse(BaseModel):
    id: int
    schedule_code: str
    location_name: str
    address: str
    latitude: float
    longitude: float
    geofence_radius_meters: int = 200
    planned_start_time: str
    planned_end_time: str
    time_window_display: str
    status: str
    date_display: str
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    service_type: Optional[str] = "Field Visit & Merchant Onboarding"
    arrival_time: Optional[str] = None
    completion_time: Optional[str] = None
    time_on_site_minutes: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ScheduleStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class AssignScheduleRequest(BaseModel):
    staff_id: int
    location_name: str
    address: str
    latitude: float = 17.4385
    longitude: float = 78.3912
    scheduled_time: str
    service_type: Optional[str] = "Field Visit & Merchant Onboarding"
    notes: Optional[str] = None


def format_time_window(start_dt: datetime, end_dt: datetime) -> str:
    start_str = start_dt.strftime("%I:%M %p").lstrip("0")
    end_str = end_dt.strftime("%I:%M %p").lstrip("0")
    return f"{start_str} - {end_str}"


@router.get("/today", response_model=Optional[ScheduleResponse])
def get_today_schedule(
    current_user: Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve today's planned schedule and assigned marketing location for current executive.
    """
    now = utc_now()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_day = start_of_day + timedelta(days=1)

    # Find today's job for this staff member
    job = db.query(Job).filter(
        Job.staff_id == current_user.id,
        Job.scheduled_time >= start_of_day,
        Job.scheduled_time < end_of_day
    ).order_by(Job.scheduled_time.asc()).first()

    # Fallback to the latest assigned job if today has none yet
    if not job:
        job = db.query(Job).filter(
            Job.staff_id == current_user.id
        ).order_by(Job.scheduled_time.desc()).first()

    if not job:
        # Default schedule for CogniTrack Marketing Executive if unseeded
        return ScheduleResponse(
            id=101,
            schedule_code="SCH-COGNI-01",
            location_name="Madhapur Cluster",
            address="Plot 18, Inorbit Mall Road, Madhapur, Hyderabad",
            latitude=17.4504,
            longitude=78.3808,
            geofence_radius_meters=200,
            planned_start_time=(start_of_day + timedelta(hours=10)).isoformat(),
            planned_end_time=(start_of_day + timedelta(hours=14)).isoformat(),
            time_window_display="10:00 AM – 2:00 PM",
            status="IN_PROGRESS",
            date_display=now.strftime("%B %d, %Y"),
            staff_id=current_user.id,
            staff_name=current_user.name,
            service_type="Field Merchant Verification"
        )

    start_t = job.scheduled_time
    end_t = job.completion_time or (start_t + timedelta(hours=4))
    
    loc_name = job.customer_name
    if "Madhapur" in job.address:
        loc_name = "Madhapur Cluster"
    elif "Gachibowli" in job.address:
        loc_name = "Gachibowli Tech Park"
    elif "Jubilee Hills" in job.address:
        loc_name = "Jubilee Hills Square"
    elif "KPHB" in job.address or "Kukatpally" in job.address:
        loc_name = "Kukatpally Sector"

    return ScheduleResponse(
        id=job.id,
        schedule_code=job.job_number,
        location_name=loc_name,
        address=job.address,
        latitude=job.latitude,
        longitude=job.longitude,
        geofence_radius_meters=200,
        planned_start_time=start_t.isoformat(),
        planned_end_time=end_t.isoformat(),
        time_window_display=format_time_window(start_t, end_t),
        status=job.status.value,
        date_display=start_t.strftime("%B %d, %Y"),
        staff_id=job.staff_id,
        staff_name=current_user.name,
        service_type=job.service_type,
        arrival_time=job.arrival_time.isoformat() if job.arrival_time else None,
        completion_time=job.completion_time.isoformat() if job.completion_time else None,
        time_on_site_minutes=job.time_on_site_minutes,
        notes=job.notes
    )


@router.get("/my-schedules", response_model=List[ScheduleResponse])
def get_all_schedules(
    current_user: Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all assigned marketing schedules (upcoming and past) for the executive.
    """
    jobs = db.query(Job).filter(
        Job.staff_id == current_user.id
    ).order_by(Job.scheduled_time.desc()).all()

    schedules = []
    for job in jobs:
        start_t = job.scheduled_time
        end_t = job.completion_time or (start_t + timedelta(hours=4))
        
        loc_name = job.customer_name
        if "Madhapur" in job.address:
            loc_name = "Madhapur Cluster"
        elif "Gachibowli" in job.address:
            loc_name = "Gachibowli Tech Park"
        elif "Jubilee Hills" in job.address:
            loc_name = "Jubilee Hills Square"
        elif "KPHB" in job.address or "Kukatpally" in job.address:
            loc_name = "Kukatpally Sector"

        schedules.append(
            ScheduleResponse(
                id=job.id,
                schedule_code=job.job_number,
                location_name=loc_name,
                address=job.address,
                latitude=job.latitude,
                longitude=job.longitude,
                geofence_radius_meters=200,
                planned_start_time=start_t.isoformat(),
                planned_end_time=end_t.isoformat(),
                time_window_display=format_time_window(start_t, end_t),
                status=job.status.value,
                date_display=start_t.strftime("%B %d, %Y"),
                staff_id=job.staff_id,
                staff_name=current_user.name,
                service_type=job.service_type,
                arrival_time=job.arrival_time.isoformat() if job.arrival_time else None,
                completion_time=job.completion_time.isoformat() if job.completion_time else None,
                time_on_site_minutes=job.time_on_site_minutes,
                notes=job.notes
            )
        )
    return schedules


@router.put("/{schedule_id}/status")
def update_schedule_status(
    schedule_id: int,
    payload: ScheduleStatusUpdate,
    current_user: Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update visit status (e.g., Check-In -> IN_PROGRESS, Arrived -> COMPLETED)
    """
    job = db.query(Job).filter(Job.id == schedule_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Assigned place schedule not found")

    new_status = payload.status.upper()
    if new_status not in JobStatus.__members__:
        raise HTTPException(status_code=400, detail=f"Invalid status {new_status}")

    now = utc_now()
    job.status = JobStatus[new_status]
    if payload.notes:
        job.notes = payload.notes

    if new_status == "IN_PROGRESS" and not job.arrival_time:
        job.arrival_time = now
    elif new_status == "COMPLETED":
        if not job.arrival_time:
            job.arrival_time = now - timedelta(minutes=35)
        job.completion_time = now
        delta = now - job.arrival_time
        job.time_on_site_minutes = max(5, int(delta.total_seconds() // 60))

    db.commit()
    db.refresh(job)
    return {"status": "success", "job_id": job.id, "new_status": job.status.value}


@router.post("/assign", response_model=ScheduleResponse)
def assign_schedule(
    payload: AssignScheduleRequest,
    current_user: Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin assigns a new target location visit to a staff member.
    """
    staff = db.query(Staff).filter(Staff.id == payload.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")

    try:
        scheduled_dt = datetime.fromisoformat(payload.scheduled_time.replace("Z", "+00:00"))
    except Exception:
        scheduled_dt = utc_now() + timedelta(days=1)

    count = db.query(Job).count()
    job_number = f"LOC-VISIT-{now_year_str()}-{count + 1001}"

    new_job = Job(
        job_number=job_number,
        customer_name=payload.location_name,
        customer_phone=staff.phone or "+91 90000 00000",
        service_type=payload.service_type or "Location Field Verification",
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        scheduled_time=scheduled_dt,
        status=JobStatus.ASSIGNED,
        staff_id=staff.id,
        notes=payload.notes
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    start_t = new_job.scheduled_time
    end_t = start_t + timedelta(hours=4)

    return ScheduleResponse(
        id=new_job.id,
        schedule_code=new_job.job_number,
        location_name=new_job.customer_name,
        address=new_job.address,
        latitude=new_job.latitude,
        longitude=new_job.longitude,
        geofence_radius_meters=200,
        planned_start_time=start_t.isoformat(),
        planned_end_time=end_t.isoformat(),
        time_window_display=format_time_window(start_t, end_t),
        status=new_job.status.value,
        date_display=start_t.strftime("%B %d, %Y"),
        staff_id=staff.id,
        staff_name=staff.name,
        service_type=new_job.service_type,
        notes=new_job.notes
    )


@router.post("/import-excel")
async def import_schedules_excel(
    file: UploadFile = File(...),
    current_user: Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import bulk assigned locations/tasks from an Excel (.xlsx) or CSV file.
    Expected columns: employee_code, location_name, address, scheduled_time, service_type, notes
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    filename = file.filename.lower()
    content = await file.read()
    
    rows_to_process = []
    
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active
        headers = [str(cell.value or "").strip().lower() for cell in next(sheet.iter_rows(min_row=1, max_row=1))]
        
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not any(row):
                continue
            row_dict = {}
            for h, val in zip(headers, row):
                row_dict[h] = str(val or "").strip()
            rows_to_process.append(row_dict)

    elif filename.endswith(".csv"):
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            row_dict = {k.strip().lower(): str(v or "").strip() for k, v in row.items() if k}
            rows_to_process.append(row_dict)
    else:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an .xlsx or .csv file")

    if not rows_to_process:
        raise HTTPException(status_code=400, detail="No data rows found in uploaded file")

    staff_cache = {s.employee_code.upper(): s for s in db.query(Staff).all()}
    count = db.query(Job).count()
    imported_count = 0
    skipped_count = 0

    for idx, r in enumerate(rows_to_process):
        emp_code = (r.get("employee_code") or r.get("emp_code") or r.get("staff_code") or "").upper()
        staff = staff_cache.get(emp_code)
        if not staff:
            skipped_count += 1
            continue

        loc_name = r.get("location_name") or r.get("place_name") or r.get("customer_name") or "Assigned Location"
        addr = r.get("address") or "Hyderabad"
        svc = r.get("service_type") or r.get("purpose") or "Field Merchant Verification"
        notes = r.get("notes") or None
        time_raw = r.get("scheduled_time") or r.get("date") or r.get("time")

        try:
            scheduled_dt = datetime.fromisoformat(time_raw.replace("Z", "+00:00"))
        except Exception:
            scheduled_dt = utc_now() + timedelta(days=1)

        job_number = f"LOC-IMP-{now_year_str()}-{count + idx + 2001}"
        new_job = Job(
            job_number=job_number,
            customer_name=loc_name,
            customer_phone=staff.phone or "+91 90000 00000",
            service_type=svc,
            address=addr,
            latitude=17.4385,
            longitude=78.3912,
            scheduled_time=scheduled_dt,
            status=JobStatus.ASSIGNED,
            staff_id=staff.id,
            notes=notes
        )
        db.add(new_job)
        imported_count += 1

    db.commit()

    return {
        "status": "success",
        "total_rows": len(rows_to_process),
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "message": f"Successfully imported {imported_count} assigned location visits ({skipped_count} skipped)."
    }


@router.get("/download-template")
def download_excel_template():
    """
    Generates a pre-formatted Excel template (.xlsx) for bulk location assignment.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Bulk Location Visits"

    headers = ["employee_code", "location_name", "address", "scheduled_time", "service_type", "notes"]
    ws.append(headers)

    # Sample data rows
    now = utc_now()
    sample_rows = [
        ["EMP101", "Madhapur Tech Zone", "Plot 18, Inorbit Mall Road, Madhapur, Hyderabad", (now + timedelta(days=1)).strftime("%Y-%m-%d 10:00:00"), "Merchant Verification", "Priority Merchant Visit"],
        ["EMP102", "Secunderabad Commercial Belt", "East Marredpally, Secunderabad", (now + timedelta(days=1)).strftime("%Y-%m-%d 11:30:00"), "POS Device Audit", "Check device serial"],
        ["EMP104", "KPHB Colony Sector 3", "Phase 3, KPHB Colony, Kukatpally", (now + timedelta(days=2)).strftime("%Y-%m-%d 14:00:00"), "Store Verification", "Store audit"],
    ]

    for row in sample_rows:
        ws.append(row)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    headers = {
        "Content-Disposition": 'attachment; filename="cognitrack_location_import_template.xlsx"'
    }
    return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)


def now_year_str():
    return datetime.now(timezone.utc).strftime("%Y")
