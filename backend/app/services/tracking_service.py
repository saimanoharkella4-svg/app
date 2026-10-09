from datetime import datetime, timezone, date
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.staff import Staff, StaffStatus
from app.models.tracking import TrackingSession, LocationPoint, SessionStatus
from app.schemas.tracking import (
    StartDutyRequest, StopDutyRequest, LocationInput, 
    BatchLocationInput, BatchLocationResponse
)
from app.services.distance_service import haversine_distance_km
from app.services.anomaly_service import check_and_record_anomaly
from app.services.summary_service import update_daily_summary
from app.services.redis_service import pubsub_manager
from app.core.utils import to_naive_utc, utc_now


class TrackingService:

    @staticmethod
    def start_duty(
        db: Session,
        staff: Staff,
        request: StartDutyRequest
    ) -> TrackingSession:
        """
        Begin a tracking duty session for field staff.
        """
        # Check if staff already has an open active session
        active_session = db.query(TrackingSession).filter(
            TrackingSession.staff_id == staff.id,
            TrackingSession.status == SessionStatus.ACTIVE
        ).first()

        now = utc_now()

        if not active_session:
            active_session = TrackingSession(
                staff_id=staff.id,
                login_time=now,
                start_latitude=request.start_latitude,
                start_longitude=request.start_longitude,
                start_address=request.start_address,
                total_distance_km=0.0,
                status=SessionStatus.ACTIVE,
                device_battery_start=request.battery_level
            )
            db.add(active_session)
            db.commit()
            db.refresh(active_session)

        # Update staff status to ACTIVE
        staff.status = StaffStatus.ACTIVE
        db.commit()

        # If start location is provided, save as initial point
        if request.start_latitude is not None and request.start_longitude is not None:
            initial_point = LocationPoint(
                staff_id=staff.id,
                session_id=active_session.id,
                latitude=request.start_latitude,
                longitude=request.start_longitude,
                accuracy=10.0,
                speed=0.0,
                battery_level=request.battery_level,
                recorded_at=now
            )
            db.add(initial_point)
            db.commit()

        # Update live cache
        live_data = {
            "staff_id": staff.id,
            "employee_code": staff.employee_code,
            "name": staff.name,
            "status": "ACTIVE",
            "session_id": active_session.id,
            "login_time": active_session.login_time.isoformat(),
            "latitude": request.start_latitude,
            "longitude": request.start_longitude,
            "accuracy": 10.0,
            "speed": 0.0,
            "battery_level": request.battery_level,
            "last_update": now.isoformat(),
            "today_distance_km": active_session.total_distance_km,
            "current_area": request.start_address or "Hyderabad"
        }
        pubsub_manager.update_staff_cache(staff.id, live_data)

        # Update daily summary
        update_daily_summary(db, staff.id, now.date())

        return active_session

    @staticmethod
    def stop_duty(
        db: Session,
        staff: Staff,
        request: StopDutyRequest
    ) -> TrackingSession:
        """
        End a tracking duty session for field staff.
        """
        active_session = db.query(TrackingSession).filter(
            TrackingSession.staff_id == staff.id,
            TrackingSession.status == SessionStatus.ACTIVE
        ).first()

        now = utc_now()

        if not active_session:
            active_session = db.query(TrackingSession).filter(
                TrackingSession.staff_id == staff.id
            ).order_by(TrackingSession.id.desc()).first()
            if not active_session:
                raise ValueError("No tracking session found for staff")

        # Record end location and wrap up session
        active_session.logout_time = now
        active_session.status = SessionStatus.COMPLETED
        if request.end_latitude is not None:
            active_session.end_latitude = request.end_latitude
            active_session.end_longitude = request.end_longitude
            active_session.end_address = request.end_address
            
            # Record final point
            end_point = LocationPoint(
                staff_id=staff.id,
                session_id=active_session.id,
                latitude=request.end_latitude,
                longitude=request.end_longitude,
                battery_level=request.battery_level,
                recorded_at=now
            )
            db.add(end_point)

        if request.battery_level is not None:
            active_session.device_battery_end = request.battery_level

        staff.status = StaffStatus.OFF_DUTY
        db.commit()
        db.refresh(active_session)

        # Update daily summary
        update_daily_summary(db, staff.id, active_session.login_time.date())

        # Update live cache
        live_data = {
            "staff_id": staff.id,
            "employee_code": staff.employee_code,
            "name": staff.name,
            "status": "OFF_DUTY",
            "session_id": active_session.id,
            "last_update": now.isoformat(),
            "today_distance_km": active_session.total_distance_km
        }
        pubsub_manager.update_staff_cache(staff.id, live_data)

        return active_session

    @staticmethod
    def toggle_break(
        db: Session,
        staff: Staff
    ) -> Staff:
        """
        Toggle break status for field staff while maintaining background location monitoring.
        """
        if staff.status == StaffStatus.ON_BREAK:
            staff.status = StaffStatus.ACTIVE
        else:
            staff.status = StaffStatus.ON_BREAK
        db.commit()
        db.refresh(staff)

        now = utc_now()
        live_data = {
            "staff_id": staff.id,
            "employee_code": staff.employee_code,
            "name": staff.name,
            "status": staff.status.value,
            "last_update": now.isoformat()
        }
        pubsub_manager.update_staff_cache(staff.id, live_data)
        return staff

    @staticmethod
    def ingest_single_location(
        db: Session,
        staff: Staff,
        loc: LocationInput,
        session_id: Optional[int] = None
    ) -> LocationPoint:
        """
        Ingest a single GPS location point with duplicate prevention and anomaly detection.
        """
        recorded_naive = to_naive_utc(loc.timestamp)

        # If session_id not specified, look for active session
        if not session_id:
            active_session = db.query(TrackingSession).filter(
                TrackingSession.staff_id == staff.id,
                TrackingSession.status == SessionStatus.ACTIVE
            ).first()
            if not active_session:
                active_session = TrackingSession(
                    staff_id=staff.id,
                    login_time=recorded_naive,
                    start_latitude=loc.latitude,
                    start_longitude=loc.longitude,
                    status=SessionStatus.ACTIVE
                )
                db.add(active_session)
                staff.status = StaffStatus.ACTIVE
                db.commit()
                db.refresh(active_session)
            session_id = active_session.id
        else:
            active_session = db.query(TrackingSession).filter(TrackingSession.id == session_id).first()
            if not active_session:
                raise ValueError("Specified tracking session not found")

        # Duplicate check by client_id
        if loc.client_id:
            existing = db.query(LocationPoint).filter(LocationPoint.client_id == loc.client_id).first()
            if existing:
                return existing

        # Get last recorded point for this session to calculate distance delta and speed
        last_point = db.query(LocationPoint).filter(
            LocationPoint.session_id == session_id
        ).order_by(LocationPoint.recorded_at.desc()).first()

        # Check for anomalies
        is_anomaly, anomaly_reason = check_and_record_anomaly(
            db=db,
            session=active_session,
            staff_id=staff.id,
            latitude=loc.latitude,
            longitude=loc.longitude,
            accuracy=loc.accuracy,
            recorded_at=recorded_naive,
            is_mock=loc.is_mock or False,
            last_point=last_point
        )

        new_point = LocationPoint(
            client_id=loc.client_id,
            staff_id=staff.id,
            session_id=session_id,
            latitude=loc.latitude,
            longitude=loc.longitude,
            accuracy=loc.accuracy,
            speed=loc.speed,
            bearing=loc.bearing,
            altitude=loc.altitude,
            battery_level=loc.battery_level,
            is_mock=loc.is_mock or False,
            is_anomaly=is_anomaly,
            anomaly_reason=anomaly_reason,
            recorded_at=recorded_naive
        )
        db.add(new_point)

        # Update session distance if not an anomaly
        if not is_anomaly and last_point and not last_point.is_anomaly:
            d = haversine_distance_km(
                last_point.latitude, last_point.longitude,
                loc.latitude, loc.longitude
            )
            if d >= 0.015:
                active_session.total_distance_km = round(active_session.total_distance_km + d, 3)

        db.commit()
        db.refresh(new_point)

        # Update live cache
        live_update = {
            "staff_id": staff.id,
            "employee_code": staff.employee_code,
            "name": staff.name,
            "status": "ACTIVE",
            "session_id": session_id,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "accuracy": loc.accuracy,
            "speed": loc.speed,
            "battery_level": loc.battery_level,
            "last_update": recorded_naive.isoformat(),
            "today_distance_km": round(active_session.total_distance_km, 2)
        }
        pubsub_manager.update_staff_cache(staff.id, live_update)

        return new_point

    @staticmethod
    def ingest_batch_locations(
        db: Session,
        staff: Staff,
        batch: BatchLocationInput
    ) -> BatchLocationResponse:
        """
        Ingest batch of offline GPS locations with deduplication and idempotency.
        """
        session_id = batch.session_id
        if not session_id:
            active_session = db.query(TrackingSession).filter(
                TrackingSession.staff_id == staff.id,
                TrackingSession.status == SessionStatus.ACTIVE
            ).first()
            if not active_session:
                active_session = TrackingSession(
                    staff_id=staff.id,
                    login_time=utc_now(),
                    status=SessionStatus.ACTIVE
                )
                db.add(active_session)
                staff.status = StaffStatus.ACTIVE
                db.commit()
                db.refresh(active_session)
            session_id = active_session.id
        else:
            active_session = db.query(TrackingSession).filter(TrackingSession.id == session_id).first()
            if not active_session:
                raise ValueError("Session not found for batch ingestion")

        accepted_ids = []
        failed_ids = []
        skipped_duplicates = 0

        # Sort batch points chronologically
        sorted_locations = sorted(batch.locations, key=lambda x: to_naive_utc(x.timestamp))

        last_point = db.query(LocationPoint).filter(
            LocationPoint.session_id == session_id
        ).order_by(LocationPoint.recorded_at.desc()).first()

        for loc in sorted_locations:
            client_key = loc.client_id or f"{loc.latitude}_{loc.longitude}_{loc.timestamp.isoformat()}"
            recorded_naive = to_naive_utc(loc.timestamp)

            # Check if already exists in database
            if loc.client_id:
                existing = db.query(LocationPoint).filter(LocationPoint.client_id == loc.client_id).first()
                if existing:
                    skipped_duplicates += 1
                    accepted_ids.append(client_key)
                    continue

            try:
                is_anomaly, anomaly_reason = check_and_record_anomaly(
                    db=db,
                    session=active_session,
                    staff_id=staff.id,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    accuracy=loc.accuracy,
                    recorded_at=recorded_naive,
                    is_mock=loc.is_mock or False,
                    last_point=last_point
                )

                new_pt = LocationPoint(
                    client_id=loc.client_id,
                    staff_id=staff.id,
                    session_id=session_id,
                    latitude=loc.latitude,
                    longitude=loc.longitude,
                    accuracy=loc.accuracy,
                    speed=loc.speed,
                    bearing=loc.bearing,
                    altitude=loc.altitude,
                    battery_level=loc.battery_level,
                    is_mock=loc.is_mock or False,
                    is_anomaly=is_anomaly,
                    anomaly_reason=anomaly_reason,
                    recorded_at=recorded_naive
                )
                db.add(new_pt)

                # Distance accumulation
                if not is_anomaly and last_point and not last_point.is_anomaly:
                    d = haversine_distance_km(
                        last_point.latitude, last_point.longitude,
                        loc.latitude, loc.longitude
                    )
                    if d >= 0.015:
                        active_session.total_distance_km = round(active_session.total_distance_km + d, 3)

                last_point = new_pt
                accepted_ids.append(client_key)
            except Exception:
                failed_ids.append(client_key)

        db.commit()
        db.refresh(active_session)

        # Update daily summary
        update_daily_summary(db, staff.id, active_session.login_time.date())

        # Update live cache with the most recent point in batch
        if sorted_locations:
            latest = sorted_locations[-1]
            pubsub_manager.update_staff_cache(staff.id, {
                "staff_id": staff.id,
                "employee_code": staff.employee_code,
                "name": staff.name,
                "status": "ACTIVE",
                "session_id": session_id,
                "latitude": latest.latitude,
                "longitude": latest.longitude,
                "accuracy": latest.accuracy,
                "speed": latest.speed,
                "battery_level": latest.battery_level,
                "last_update": to_naive_utc(latest.timestamp).isoformat(),
                "today_distance_km": round(active_session.total_distance_km, 2)
            })

        return BatchLocationResponse(
            session_id=session_id,
            total_received=len(batch.locations),
            total_accepted=len(accepted_ids),
            accepted_client_ids=accepted_ids,
            failed_client_ids=failed_ids,
            skipped_duplicates=skipped_duplicates,
            current_distance_km=round(active_session.total_distance_km, 2)
        )
