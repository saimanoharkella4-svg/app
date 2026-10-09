from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.staff import Staff
from app.models.tracking import TrackingSession, LocationPoint
from app.models.summary import DailySummary, WeeklySummary
from app.models.job import Job, JobStatus
from app.core.utils import utc_now, to_naive_utc


def update_daily_summary(db: Session, staff_id: int, target_date: date) -> DailySummary:
    """
    Calculate and persist or update the daily summary for a staff member on a specific date.
    """
    start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
    end_of_day = start_of_day + timedelta(days=1)

    sessions = db.query(TrackingSession).filter(
        TrackingSession.staff_id == staff_id,
        TrackingSession.login_time >= start_of_day,
        TrackingSession.login_time < end_of_day
    ).all()

    total_distance_km = 0.0
    working_minutes = 0
    earliest_login = None
    latest_logout = None
    total_locations = 0

    now_naive = utc_now()

    for s in sessions:
        total_distance_km += s.total_distance_km
        s_login = to_naive_utc(s.login_time)
        s_logout = to_naive_utc(s.logout_time)

        if earliest_login is None or (s_login and s_login < earliest_login):
            earliest_login = s_login
        
        session_end = s_logout or now_naive
        if latest_logout is None or (s_logout and s_logout > latest_logout):
            latest_logout = s_logout

        if s_login:
            duration_sec = max(0, (session_end - s_login).total_seconds())
            working_minutes += int(duration_sec // 60)

        # Count location points
        pt_count = db.query(func.count(LocationPoint.id)).filter(
            LocationPoint.session_id == s.id
        ).scalar() or 0
        total_locations += pt_count

    # Count jobs assigned and completed for this staff on this day
    jobs = db.query(Job).filter(
        Job.staff_id == staff_id,
        Job.scheduled_time >= start_of_day,
        Job.scheduled_time < end_of_day
    ).all()

    jobs_assigned = len(jobs)
    jobs_completed = sum(1 for j in jobs if j.status == JobStatus.COMPLETED)

    # Upsert daily summary
    summary = db.query(DailySummary).filter(
        DailySummary.staff_id == staff_id,
        DailySummary.date == target_date
    ).first()

    if not summary:
        summary = DailySummary(
            staff_id=staff_id,
            date=target_date,
            login_time=earliest_login,
            logout_time=latest_logout,
            working_minutes=working_minutes,
            distance_km=round(total_distance_km, 2),
            location_count=total_locations,
            jobs_assigned=jobs_assigned,
            jobs_completed=jobs_completed
        )
        db.add(summary)
    else:
        summary.login_time = earliest_login
        summary.logout_time = latest_logout
        summary.working_minutes = working_minutes
        summary.distance_km = round(total_distance_km, 2)
        summary.location_count = total_locations
        summary.jobs_assigned = jobs_assigned
        summary.jobs_completed = jobs_completed

    db.commit()
    db.refresh(summary)
    return summary


def update_weekly_summary(db: Session, staff_id: int, week_start: date, week_end: date) -> WeeklySummary:
    """
    Calculate and persist or update the weekly summary for a staff member.
    """
    daily_summaries = db.query(DailySummary).filter(
        DailySummary.staff_id == staff_id,
        DailySummary.date >= week_start,
        DailySummary.date <= week_end
    ).all()

    days_worked = len([d for d in daily_summaries if d.working_minutes > 0 or d.distance_km > 0])
    total_minutes = sum(d.working_minutes for d in daily_summaries)
    total_hours = round(total_minutes / 60.0, 2)
    total_distance = round(sum(d.distance_km for d in daily_summaries), 2)
    jobs_assigned = sum(d.jobs_assigned for d in daily_summaries)
    jobs_completed = sum(d.jobs_completed for d in daily_summaries)

    avg_distance = round(total_distance / max(1, days_worked), 2) if days_worked > 0 else 0.0
    avg_hours = round(total_hours / max(1, days_worked), 2) if days_worked > 0 else 0.0

    summary = db.query(WeeklySummary).filter(
        WeeklySummary.staff_id == staff_id,
        WeeklySummary.week_start == week_start,
        WeeklySummary.week_end == week_end
    ).first()

    if not summary:
        summary = WeeklySummary(
            staff_id=staff_id,
            week_start=week_start,
            week_end=week_end,
            days_worked=days_worked,
            total_hours=total_hours,
            total_distance=total_distance,
            jobs_assigned=jobs_assigned,
            jobs_completed=jobs_completed,
            average_daily_distance=avg_distance,
            average_daily_hours=avg_hours
        )
        db.add(summary)
    else:
        summary.days_worked = days_worked
        summary.total_hours = total_hours
        summary.total_distance = total_distance
        summary.jobs_assigned = jobs_assigned
        summary.jobs_completed = jobs_completed
        summary.average_daily_distance = avg_distance
        summary.average_daily_hours = avg_hours

    db.commit()
    db.refresh(summary)
    return summary
