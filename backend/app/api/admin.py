from datetime import datetime, timezone, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.staff import Staff, StaffStatus, StaffRole
from app.models.tracking import TrackingSession, LocationPoint, GPSAnomaly, SessionStatus
from app.models.summary import DailySummary
from app.models.job import Job, JobStatus
from app.schemas.reports import LiveStaffItem, OverviewStatsResponse, JobCreate, JobResponse
from app.schemas.tracking import RouteResponse, LocationPointResponse, TrackingSessionResponse
from app.services.redis_service import pubsub_manager
from app.api.deps import get_current_admin
from app.core.utils import safe_datetime_diff_seconds, utc_now

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/overview-stats", response_model=OverviewStatsResponse)
def get_overview_stats(
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Top-level dashboard metrics for live operations.
    """
    total_staff = db.query(Staff).filter(Staff.role == StaffRole.USER).count()
    active_staff = db.query(TrackingSession).filter(TrackingSession.status == SessionStatus.ACTIVE).count()
    offline_staff = max(0, total_staff - active_staff)

    today = datetime.now(timezone.utc).date()
    start_of_day = datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=timezone.utc)
    
    # Jobs today
    jobs_today = db.query(Job).filter(Job.scheduled_time >= start_of_day).count()
    completed_jobs = db.query(Job).filter(
        Job.scheduled_time >= start_of_day,
        Job.status == JobStatus.COMPLETED
    ).count()

    # Total distance today
    daily_summaries = db.query(DailySummary).filter(DailySummary.date == today).all()
    total_distance_km = sum(d.distance_km for d in daily_summaries)
    
    # Also add distance from currently active sessions if not yet committed to daily summary
    active_sessions = db.query(TrackingSession).filter(TrackingSession.status == SessionStatus.ACTIVE).all()
    for s in active_sessions:
        # Avoid double counting if session was already synced in daily summary
        matching_daily = next((d for d in daily_summaries if d.staff_id == s.staff_id), None)
        if not matching_daily:
            total_distance_km += s.total_distance_km

    avg_minutes = (sum(d.working_minutes for d in daily_summaries) / max(1, len(daily_summaries))) if daily_summaries else 0
    avg_hours = round(avg_minutes / 60.0, 1)

    return OverviewStatsResponse(
        active_staff_count=active_staff,
        offline_staff_count=offline_staff,
        total_staff_count=total_staff,
        jobs_today_count=jobs_today,
        completed_jobs_count=completed_jobs,
        total_distance_today_km=round(total_distance_km, 1),
        average_hours_today=avg_hours
    )


@router.get("/live-staff", response_model=List[LiveStaffItem])
def get_live_staff(
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Real-time staff location and status monitoring list for live map.
    """
    staff_members = db.query(Staff).filter(Staff.role == StaffRole.USER).all()
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)

    result = []
    cached_live = pubsub_manager.get_all_active_cache()

    for s in staff_members:
        # Check active session
        session = db.query(TrackingSession).filter(
            TrackingSession.staff_id == s.id,
            TrackingSession.status == SessionStatus.ACTIVE
        ).first()

        last_pt = None
        if session:
            last_pt = db.query(LocationPoint).filter(
                LocationPoint.session_id == session.id
            ).order_by(LocationPoint.recorded_at.desc()).first()
        else:
            # Fall back to latest known point
            last_pt = db.query(LocationPoint).filter(
                LocationPoint.staff_id == s.id
            ).order_by(LocationPoint.recorded_at.desc()).first()

        # Check today's summary for distance and jobs
        daily = db.query(DailySummary).filter(
            DailySummary.staff_id == s.id,
            DailySummary.date == today
        ).first()

        duration_str = None
        duration_mins = 0
        if session and session.login_time:
            secs = int(safe_datetime_diff_seconds(now, session.login_time))
            h = secs // 3600
            m = (secs % 3600) // 60
            duration_str = f"{h:02d}h {m:02d}m"
            duration_mins = secs // 60
        elif daily and daily.working_minutes:
            h = daily.working_minutes // 60
            m = daily.working_minutes % 60
            duration_str = f"{h:02d}h {m:02d}m"
            duration_mins = daily.working_minutes

        dist = session.total_distance_km if session else (daily.distance_km if daily else 0.0)

        # Merge with in-memory live cache if available
        cached = cached_live.get(s.id, {})

        lat = cached.get("latitude") if cached.get("latitude") is not None else (last_pt.latitude if last_pt else None)
        lon = cached.get("longitude") if cached.get("longitude") is not None else (last_pt.longitude if last_pt else None)
        acc = cached.get("accuracy") if cached.get("accuracy") is not None else (last_pt.accuracy if last_pt else None)
        spd = cached.get("speed") if cached.get("speed") is not None else (last_pt.speed if last_pt else None)
        bat = cached.get("battery_level") if cached.get("battery_level") is not None else (last_pt.battery_level if last_pt else None)
        
        last_upd = None
        if cached.get("last_update"):
            try:
                last_upd = datetime.fromisoformat(cached["last_update"])
            except Exception:
                pass
        if not last_upd and last_pt:
            last_upd = last_pt.recorded_at

        # Area name inference (fallback to city areas)
        area_name = "Hyderabad"
        if lat and lon:
            if abs(lat - 17.44) < 0.05 and abs(lon - 78.38) < 0.05:
                area_name = "Hitec City, Hyderabad"
            elif abs(lat - 17.49) < 0.05 and abs(lon - 78.39) < 0.05:
                area_name = "Kukatpally, Hyderabad"
            elif abs(lat - 17.43) < 0.05 and abs(lon - 78.44) < 0.05:
                area_name = "Banjara Hills, Hyderabad"
            elif abs(lat - 17.43) < 0.05 and abs(lon - 78.50) < 0.05:
                area_name = "Secunderabad"
            else:
                area_name = "Hyderabad Central"

        item = LiveStaffItem(
            staff_id=s.id,
            employee_code=s.employee_code,
            name=s.name,
            role=s.role.value,
            status=s.status.value,
            session_id=session.id if session else None,
            login_time=session.login_time if session else (daily.login_time if daily else None),
            working_duration=duration_str,
            working_minutes=duration_mins,
            latitude=lat,
            longitude=lon,
            accuracy=acc,
            speed=spd,
            battery_level=bat,
            last_update=last_upd,
            today_distance_km=round(dist, 2),
            jobs_today=daily.jobs_assigned if daily else 0,
            jobs_completed_today=daily.jobs_completed if daily else 0,
            current_area=area_name
        )
        result.append(item)

    return result


@router.get("/staff/{id}/location")
def get_staff_location(
    id: int,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get latest known position of a specific staff member.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    last_pt = db.query(LocationPoint).filter(
        LocationPoint.staff_id == id
    ).order_by(LocationPoint.recorded_at.desc()).first()

    if not last_pt:
        return {"staff_id": id, "name": staff.name, "has_location": False}

    return {
        "staff_id": id,
        "employee_code": staff.employee_code,
        "name": staff.name,
        "has_location": True,
        "latitude": last_pt.latitude,
        "longitude": last_pt.longitude,
        "accuracy": last_pt.accuracy,
        "speed": last_pt.speed,
        "recorded_at": last_pt.recorded_at.isoformat(),
        "is_mock": last_pt.is_mock,
        "is_anomaly": last_pt.is_anomaly
    }


@router.get("/staff/{id}/route", response_model=RouteResponse)
def get_staff_route_admin(
    id: int,
    target_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    session_id: Optional[int] = Query(None),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve full historical route breadcrumbs for admin inspection.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if session_id:
        session = db.query(TrackingSession).filter(
            TrackingSession.id == session_id,
            TrackingSession.staff_id == id
        ).first()
    elif target_date:
        d = datetime.strptime(target_date, "%Y-%m-%d").date()
        start_d = datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=timezone.utc)
        end_d = start_d + timedelta(days=1)
        session = db.query(TrackingSession).filter(
            TrackingSession.staff_id == id,
            TrackingSession.login_time >= start_d,
            TrackingSession.login_time < end_d
        ).order_by(TrackingSession.id.desc()).first()
    else:
        session = db.query(TrackingSession).filter(
            TrackingSession.staff_id == id
        ).order_by(TrackingSession.id.desc()).first()

    if not session:
        raise HTTPException(status_code=404, detail="No tracking session found for staff")

    points = db.query(LocationPoint).filter(
        LocationPoint.session_id == session.id
    ).order_by(LocationPoint.recorded_at.asc()).all()

    point_responses = [LocationPointResponse.model_validate(p) for p in points]
    start_pt = point_responses[0] if point_responses else None
    end_pt = point_responses[-1] if point_responses else None

    return RouteResponse(
        session_id=session.id,
        staff_id=staff.id,
        staff_name=staff.name,
        employee_code=staff.employee_code,
        date=str(session.login_time.date()),
        login_time=session.login_time,
        logout_time=session.logout_time,
        total_distance_km=round(session.total_distance_km, 2),
        status=session.status.value,
        points=point_responses,
        start_point=start_pt,
        end_point=end_pt
    )


@router.get("/staff/{id}/attendance", response_model=List[TrackingSessionResponse])
def get_staff_attendance(
    id: int,
    limit: int = Query(30, ge=1, le=100),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get session attendance logs for a staff member.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    sessions = db.query(TrackingSession).filter(
        TrackingSession.staff_id == id
    ).order_by(TrackingSession.login_time.desc()).limit(limit).all()

    resp = []
    for s in sessions:
        r = TrackingSessionResponse.model_validate(s)
        r.staff_name = staff.name
        if s.login_time and s.logout_time:
            r.working_minutes = int((s.logout_time - s.login_time).total_seconds() // 60)
        resp.append(r)

    return resp


@router.get("/anomalies")
def get_anomalies(
    reviewed: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List flagged GPS anomalies for audit.
    """
    query = db.query(GPSAnomaly)
    if reviewed is not None:
        query = query.filter(GPSAnomaly.reviewed == reviewed)
    anomalies = query.order_by(GPSAnomaly.detected_at.desc()).limit(limit).all()

    return [
        {
            "id": a.id,
            "staff_id": a.staff_id,
            "staff_name": a.staff.name if a.staff else "Unknown",
            "session_id": a.session_id,
            "anomaly_type": a.anomaly_type,
            "description": a.description,
            "severity": a.severity,
            "detected_at": a.detected_at.isoformat(),
            "reviewed": a.reviewed
        }
        for a in anomalies
    ]


@router.get("/jobs", response_model=List[JobResponse])
def list_jobs(
    status: Optional[str] = None,
    staff_id: Optional[int] = None,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List ExtraHand jobs and staff assignments.
    """
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    if staff_id:
        query = query.filter(Job.staff_id == staff_id)

    jobs = query.order_by(Job.scheduled_time.desc()).all()
    resp = []
    for j in jobs:
        r = JobResponse.model_validate(j)
        r.staff_name = j.staff.name if j.staff else None
        resp.append(r)
    return resp


@router.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new job for ExtraHand service dispatch.
    """
    job_count = db.query(Job).count() + 1
    job_number = f"JOB-2026-{job_count:04d}"

    job = Job(
        job_number=job_number,
        customer_name=job_in.customer_name,
        customer_phone=job_in.customer_phone,
        service_type=job_in.service_type,
        address=job_in.address,
        latitude=job_in.latitude,
        longitude=job_in.longitude,
        scheduled_time=job_in.scheduled_time,
        status=JobStatus.ASSIGNED if job_in.staff_id else JobStatus.PENDING,
        staff_id=job_in.staff_id,
        notes=job_in.notes,
        region=job_in.region or "Hyderabad North"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    r = JobResponse.model_validate(job)
    r.staff_name = job.staff.name if job.staff else None
    return r


@router.put("/jobs/{id}/verify", response_model=JobResponse)
def verify_job_visit(
    id: int,
    status_update: str = Query(..., description="APPROVED or REJECTED"),
    notes: Optional[str] = Query(None),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approve or reject a submitted field visit report.
    """
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Visit job not found")

    job.verification_status = status_update.upper()
    if notes:
        job.notes = (job.notes or "") + f" [Admin Note: {notes}]"

    db.commit()
    db.refresh(job)
    r = JobResponse.model_validate(job)
    r.staff_name = job.staff.name if job.staff else None
    return r


@router.get("/attendance-stc")
def get_attendance_stc_summary(
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    STC (Shift Time Control) and attendance logs for field executives.
    """
    today = datetime.now(timezone.utc).date()
    staff_list = db.query(Staff).filter(Staff.role == StaffRole.USER).all()

    attendance_records = []
    for s in staff_list:
        daily = db.query(DailySummary).filter(DailySummary.staff_id == s.id, DailySummary.date == today).first()
        session = db.query(TrackingSession).filter(
            TrackingSession.staff_id == s.id,
            TrackingSession.status == SessionStatus.ACTIVE
        ).first()

        is_present = session is not None or (daily is not None and daily.working_minutes > 0)
        login_t = session.login_time if session else (daily.login_time if daily else None)
        
        is_late = False
        if login_t:
            # Check if logged in after 09:30 AM
            if login_t.hour > 9 or (login_t.hour == 9 and login_t.minute > 30):
                is_late = True

        attendance_records.append({
            "staff_id": s.id,
            "employee_code": s.employee_code,
            "name": s.name,
            "region": s.region or "Hyderabad North",
            "department": s.department,
            "status": "PRESENT" if is_present else "ABSENT",
            "shift_status": s.status.value,
            "clock_in": login_t.isoformat() if login_t else None,
            "clock_out": daily.logout_time.isoformat() if daily and daily.logout_time else None,
            "is_late": is_late,
            "working_minutes": session.total_distance_km if session else (daily.working_minutes if daily else 0),
            "distance_km": session.total_distance_km if session else (daily.distance_km if daily else 0.0),
            "stc_status": "SHIFT_ACTIVE" if session else ("SHIFT_COMPLETED" if daily and daily.logout_time else "NOT_STARTED")
        })

    return attendance_records

