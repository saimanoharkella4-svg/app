from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.staff import Staff, StaffRole
from app.models.summary import DailySummary, WeeklySummary
from app.schemas.reports import DailySummaryResponse, WeeklySummaryResponse, WeeklyDayBreakdown
from app.services.summary_service import update_daily_summary, update_weekly_summary
from app.services.export_service import (
    generate_excel_report, 
    generate_pdf_report, 
    generate_individual_weekly_pdf_report
)
from app.api.deps import get_current_admin

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/daily", response_model=List[DailySummaryResponse])
def get_daily_reports(
    target_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    staff_id: Optional[int] = None,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve daily staff activity summaries.
    """
    query = db.query(DailySummary)
    
    if target_date:
        d = datetime.strptime(target_date, "%Y-%m-%d").date()
        query = query.filter(DailySummary.date == d)
    else:
        # Default to today
        today = datetime.now(timezone.utc).date()
        query = query.filter(DailySummary.date == today)

    if staff_id:
        query = query.filter(DailySummary.staff_id == staff_id)

    summaries = query.all()
    results = []
    for s in summaries:
        h = s.working_minutes // 60
        m = s.working_minutes % 60
        staff = s.staff
        r = DailySummaryResponse(
            id=s.id,
            staff_id=s.staff_id,
            staff_name=staff.name if staff else "Unknown",
            employee_code=staff.employee_code if staff else "",
            date=s.date,
            login_time=s.login_time,
            logout_time=s.logout_time,
            working_minutes=s.working_minutes,
            working_hours_formatted=f"{h:02d}h {m:02d}m",
            distance_km=s.distance_km,
            location_count=s.location_count,
            jobs_assigned=s.jobs_assigned,
            jobs_completed=s.jobs_completed
        )
        results.append(r)
    return results


@router.get("/weekly", response_model=List[WeeklySummaryResponse])
def get_weekly_reports(
    week_start: Optional[str] = Query(None, description="Week start in YYYY-MM-DD format"),
    staff_id: Optional[int] = None,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve weekly aggregated performance summaries.
    """
    query = db.query(WeeklySummary)
    if week_start:
        ws = datetime.strptime(week_start, "%Y-%m-%d").date()
        query = query.filter(WeeklySummary.week_start == ws)
    if staff_id:
        query = query.filter(WeeklySummary.staff_id == staff_id)

    summaries = query.order_by(WeeklySummary.week_start.desc()).all()
    results = []
    for w in summaries:
        staff = w.staff
        h = int(w.total_hours)
        m = int(round((w.total_hours - h) * 60))
        
        # Day-by-day breakdown
        daily_records = db.query(DailySummary).filter(
            DailySummary.staff_id == w.staff_id,
            DailySummary.date >= w.week_start,
            DailySummary.date <= w.week_end
        ).order_by(DailySummary.date.asc()).all()

        breakdown = []
        for d in daily_records:
            dh = d.working_minutes // 60
            dm = d.working_minutes % 60
            breakdown.append(WeeklyDayBreakdown(
                day_name=d.date.strftime("%A"),
                date=d.date,
                working_hours_formatted=f"{dh:02d}h {dm:02d}m",
                working_minutes=d.working_minutes,
                distance_km=d.distance_km,
                jobs_completed=d.jobs_completed
            ))

        resp = WeeklySummaryResponse(
            id=w.id,
            staff_id=w.staff_id,
            staff_name=staff.name if staff else "Unknown",
            employee_code=staff.employee_code if staff else "",
            week_start=w.week_start,
            week_end=w.week_end,
            days_worked=w.days_worked,
            total_hours=w.total_hours,
            total_hours_formatted=f"{h:02d}h {m:02d}m",
            total_distance=w.total_distance,
            jobs_assigned=w.jobs_assigned,
            jobs_completed=w.jobs_completed,
            average_daily_distance=w.average_daily_distance,
            average_daily_hours=w.average_daily_hours,
            daily_breakdown=breakdown
        )
        results.append(resp)
    return results


@router.get("/staff/{id}/weekly", response_model=WeeklySummaryResponse)
def get_staff_weekly_report(
    id: int,
    week_start: Optional[str] = Query(None),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed weekly report for an individual staff member with day-by-day breakdown.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if week_start:
        ws = datetime.strptime(week_start, "%Y-%m-%d").date()
    else:
        # Default to current week's Monday
        today = datetime.now(timezone.utc).date()
        ws = today - timedelta(days=today.weekday())
    we = ws + timedelta(days=6)

    weekly = db.query(WeeklySummary).filter(
        WeeklySummary.staff_id == id,
        WeeklySummary.week_start == ws
    ).first()

    if not weekly:
        # Calculate on the fly if not yet recorded
        weekly = update_weekly_summary(db, id, ws, we)

    h = int(weekly.total_hours)
    m = int(round((weekly.total_hours - h) * 60))

    daily_records = db.query(DailySummary).filter(
        DailySummary.staff_id == id,
        DailySummary.date >= ws,
        DailySummary.date <= we
    ).order_by(DailySummary.date.asc()).all()

    breakdown = []
    for d in daily_records:
        dh = d.working_minutes // 60
        dm = d.working_minutes % 60
        breakdown.append(WeeklyDayBreakdown(
            day_name=d.date.strftime("%A"),
            date=d.date,
            working_hours_formatted=f"{dh:02d}h {dm:02d}m",
            working_minutes=d.working_minutes,
            distance_km=d.distance_km,
            jobs_completed=d.jobs_completed
        ))

    return WeeklySummaryResponse(
        id=weekly.id,
        staff_id=staff.id,
        staff_name=staff.name,
        employee_code=staff.employee_code,
        week_start=weekly.week_start,
        week_end=weekly.week_end,
        days_worked=weekly.days_worked,
        total_hours=weekly.total_hours,
        total_hours_formatted=f"{h:02d}h {m:02d}m",
        total_distance=weekly.total_distance,
        jobs_assigned=weekly.jobs_assigned,
        jobs_completed=weekly.jobs_completed,
        average_daily_distance=weekly.average_daily_distance,
        average_daily_hours=weekly.average_daily_hours,
        daily_breakdown=breakdown
    )


@router.get("/staff/{id}/weekly/pdf")
def export_individual_staff_weekly_pdf(
    id: int,
    week_start: Optional[str] = Query(None),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Download individual weekly executive operations report as styled PDF.
    """
    staff = db.query(Staff).filter(Staff.id == id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")

    if week_start:
        ws = datetime.strptime(week_start, "%Y-%m-%d").date()
    else:
        today = datetime.now(timezone.utc).date()
        ws = today - timedelta(days=today.weekday())
    we = ws + timedelta(days=6)

    weekly = db.query(WeeklySummary).filter(
        WeeklySummary.staff_id == id,
        WeeklySummary.week_start == ws
    ).first()

    if not weekly:
        weekly = update_weekly_summary(db, id, ws, we)

    h = int(weekly.total_hours)
    m = int(round((weekly.total_hours - h) * 60))

    weekly_totals = {
        "days_worked": weekly.days_worked,
        "total_hours": weekly.total_hours,
        "total_hours_formatted": f"{h:02d}h {m:02d}m",
        "total_distance": weekly.total_distance,
        "jobs_assigned": weekly.jobs_assigned,
        "jobs_completed": weekly.jobs_completed,
        "average_daily_distance": weekly.average_daily_distance,
        "average_daily_hours": weekly.average_daily_hours
    }

    daily_records = db.query(DailySummary).filter(
        DailySummary.staff_id == id,
        DailySummary.date >= ws,
        DailySummary.date <= we
    ).order_by(DailySummary.date.asc()).all()

    breakdown = []
    for d in daily_records:
        dh = d.working_minutes // 60
        dm = d.working_minutes % 60
        breakdown.append({
            "day_name": d.date.strftime("%A"),
            "date": str(d.date),
            "working_hours_formatted": f"{dh:02d}h {dm:02d}m",
            "distance_km": d.distance_km,
            "jobs_completed": d.jobs_completed
        })

    pdf_stream = generate_individual_weekly_pdf_report(
        staff_name=staff.name,
        employee_code=staff.employee_code,
        department=staff.department or "Field Operations",
        week_start=str(ws),
        week_end=str(we),
        weekly_totals=weekly_totals,
        daily_breakdown=breakdown
    )

    filename = f"CogniTrack_Weekly_{staff.employee_code}_{ws}.pdf"
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/excel")
def export_excel_report(
    target_date: Optional[str] = Query(None),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Download complete field staff performance report as formatted Excel (.xlsx).
    """
    daily_query = db.query(DailySummary)
    if target_date:
        d = datetime.strptime(target_date, "%Y-%m-%d").date()
        daily_query = daily_query.filter(DailySummary.date == d)
    daily_rows = daily_query.all()

    daily_data = []
    for row in daily_rows:
        staff = row.staff
        daily_data.append({
            "employee_code": staff.employee_code if staff else "",
            "staff_name": staff.name if staff else "Unknown",
            "date": row.date,
            "login_time": row.login_time.strftime("%H:%M") if row.login_time else "--",
            "logout_time": row.logout_time.strftime("%H:%M") if row.logout_time else "--",
            "working_minutes": row.working_minutes,
            "distance_km": row.distance_km,
            "location_count": row.location_count,
            "jobs_assigned": row.jobs_assigned,
            "jobs_completed": row.jobs_completed,
        })

    weekly_rows = db.query(WeeklySummary).all()
    weekly_data = []
    for row in weekly_rows:
        staff = row.staff
        weekly_data.append({
            "employee_code": staff.employee_code if staff else "",
            "staff_name": staff.name if staff else "Unknown",
            "week_start": row.week_start,
            "week_end": row.week_end,
            "days_worked": row.days_worked,
            "total_hours": row.total_hours,
            "total_distance": row.total_distance,
            "average_daily_hours": row.average_daily_hours,
            "average_daily_distance": row.average_daily_distance,
            "jobs_completed": row.jobs_completed,
        })

    excel_stream = generate_excel_report(daily_data, weekly_data)
    filename = f"CogniTrack_FST_Report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M')}.xlsx"

    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/pdf")
def export_pdf_report(
    target_date: Optional[str] = Query(None),
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Download executive field staff summary as styled PDF document.
    """
    daily_query = db.query(DailySummary)
    if target_date:
        d = datetime.strptime(target_date, "%Y-%m-%d").date()
        daily_query = daily_query.filter(DailySummary.date == d)
    daily_rows = daily_query.all()

    records = []
    for row in daily_rows:
        staff = row.staff
        h = row.working_minutes // 60
        m = row.working_minutes % 60
        records.append({
            "employee_code": staff.employee_code if staff else "",
            "staff_name": staff.name if staff else "Unknown",
            "date": str(row.date),
            "login_time": row.login_time.strftime("%H:%M") if row.login_time else "--",
            "logout_time": row.logout_time.strftime("%H:%M") if row.logout_time else "--",
            "working_hours_formatted": f"{h:02d}h {m:02d}m",
            "distance_km": row.distance_km,
            "location_count": row.location_count,
            "jobs_assigned": row.jobs_assigned,
            "jobs_completed": row.jobs_completed,
        })

    pdf_stream = generate_pdf_report(records, title="Field Staff Daily Operations Report")
    filename = f"CogniTrack_FST_Daily_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M')}.pdf"

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
