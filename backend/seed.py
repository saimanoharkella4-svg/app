import math
from datetime import datetime, timezone, timedelta, date
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.staff import Staff, StaffRole, StaffStatus
from app.models.tracking import TrackingSession, LocationPoint, GPSAnomaly, SessionStatus
from app.models.summary import DailySummary, WeeklySummary
from app.models.job import Job, JobStatus
from app.services.summary_service import update_daily_summary, update_weekly_summary
from app.services.redis_service import pubsub_manager


def ensure_database_exists():
    from app.core.config import settings
    url = settings.DATABASE_URL
    if url.startswith("postgresql"):
        import psycopg
        from urllib.parse import urlparse
        parsed = urlparse(url)
        db_name = parsed.path.lstrip('/')
        if not db_name:
            return
        
        maintenance_url = url.rsplit('/', 1)[0] + '/postgres'
        try:
            with psycopg.connect(maintenance_url, autocommit=True) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
                    exists = cur.fetchone()
                    if not exists:
                        print(f"[INFO] Database '{db_name}' does not exist. Creating database...")
                        cur.execute(f'CREATE DATABASE "{db_name}"')
                        print(f"[SUCCESS] Database '{db_name}' created successfully.")
        except Exception as e:
            print(f"[WARN] Could not auto-create database '{db_name}': {e}")


def seed_database(reset: bool = False):
    ensure_database_exists()
    print("[INFO] Initializing schema and seeding database...")
    if reset:
        print("[INFO] Reset requested. Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_admin = db.query(Staff).filter(Staff.employee_code == "ADMIN001").first()
        if existing_admin and not reset:
            print("Database already contains seed data. Refreshing live cache...")
            db.close()
            return

        # 1. Create System Admin
        admin = Staff(
            employee_code="ADMIN001",
            name="Vikram Rao",
            phone="+91 98000 11223",
            email="admin@extrahand.in",
            password_hash=get_password_hash("Password@123"),
            role=StaffRole.ADMIN,
            status=StaffStatus.ACTIVE,
            department="Operations Headquarters"
        )
        db.add(admin)
        db.commit()

        # 2. Create Field Users
        rahul = Staff(
            employee_code="EMP101",
            name="Rahul Kumar",
            phone="+91 98765 43210",
            email="rahul@extrahand.in",
            password_hash=get_password_hash("Password@123"),
            role=StaffRole.USER,
            status=StaffStatus.ACTIVE,
            department="HVAC & Electrical"
        )
        suresh = Staff(
            employee_code="EMP102",
            name="Suresh Varma",
            phone="+91 98765 43211",
            email="suresh@extrahand.in",
            password_hash=get_password_hash("Password@123"),
            role=StaffRole.USER,
            status=StaffStatus.ACTIVE,
            department="Plumbing Services"
        )
        ravi = Staff(
            employee_code="EMP103",
            name="Ravi Teja",
            phone="+91 98765 43212",
            email="ravi@extrahand.in",
            password_hash=get_password_hash("Password@123"),
            role=StaffRole.USER,
            status=StaffStatus.OFF_DUTY,
            department="Deep Cleaning"
        )
        priya = Staff(
            employee_code="EMP104",
            name="Priya Sharma",
            phone="+91 98765 43213",
            email="priya@extrahand.in",
            password_hash=get_password_hash("Password@123"),
            role=StaffRole.USER,
            status=StaffStatus.ACTIVE,
            department="Appliance Repair"
        )
        anil = Staff(
            employee_code="EMP105",
            name="Anil Reddy",
            phone="+91 98765 43214",
            email="anil@extrahand.in",
            password_hash=get_password_hash("Password@123"),
            role=StaffRole.USER,
            status=StaffStatus.OFF_DUTY,
            department="Carpentry & Handyman"
        )
        db.add_all([rahul, suresh, ravi, priya, anil])
        db.commit()

        now = datetime.now(timezone.utc)
        today = now.date()

        # 3. Create Today's Active Session & Points for Rahul Kumar
        # Start at 09:05 AM in Hyderabad (Banjara Hills -> Jubilee Hills -> Madhapur -> Hitec City)
        rahul_start_time = datetime(today.year, today.month, today.day, 9, 5, 0, tzinfo=timezone.utc)
        rahul_session = TrackingSession(
            staff_id=rahul.id,
            login_time=rahul_start_time,
            start_latitude=17.4156,
            start_longitude=78.4350,
            start_address="Banjara Hills Rd 12, Hyderabad",
            total_distance_km=31.6,
            status=SessionStatus.ACTIVE,
            device_battery_start=95
        )
        db.add(rahul_session)
        db.commit()
        db.refresh(rahul_session)

        # Generate realistic trajectory points (Hyderabad route)
        # Waypoints: Banjara Hills (17.4156, 78.4350) -> Jubilee Hills Checkpost (17.4285, 78.4112)
        # -> Madhapur Cyber Towers (17.4504, 78.3808) -> Gachibowli DLF (17.4474, 78.3565)
        # -> Kondapur (17.4699, 78.3578)
        waypoints_rahul = [
            (17.4156, 78.4350, 0, 95),
            (17.4180, 78.4300, 10, 94),
            (17.4215, 78.4230, 20, 92),
            (17.4250, 78.4160, 30, 91),
            (17.4285, 78.4112, 45, 89),
            (17.4320, 78.4050, 60, 88),
            (17.4380, 78.3980, 75, 86),
            (17.4440, 78.3890, 90, 84),
            (17.4504, 78.3808, 110, 82),
            (17.4490, 78.3720, 130, 80),
            (17.4480, 78.3640, 150, 78),
            (17.4474, 78.3565, 175, 75),
            (17.4580, 78.3570, 200, 73),
            (17.4650, 78.3575, 230, 70),
            (17.4699, 78.3578, 260, 68),
        ]

        for idx, (lat, lon, min_offset, batt) in enumerate(waypoints_rahul):
            pt_time = rahul_start_time + timedelta(minutes=min_offset)
            pt = LocationPoint(
                client_id=f"EMP101-SYNC-{idx:04d}",
                staff_id=rahul.id,
                session_id=rahul_session.id,
                latitude=lat,
                longitude=lon,
                accuracy=8.5,
                speed=18.5,
                bearing=285.0,
                altitude=512.0,
                battery_level=batt,
                is_mock=False,
                is_anomaly=False,
                recorded_at=pt_time
            )
            db.add(pt)

        # 4. Create Active Session for Suresh Varma (Secunderabad route)
        suresh_start_time = datetime(today.year, today.month, today.day, 9, 15, 0, tzinfo=timezone.utc)
        suresh_session = TrackingSession(
            staff_id=suresh.id,
            login_time=suresh_start_time,
            start_latitude=17.4399,
            start_longitude=78.4983,
            start_address="Secunderabad Clock Tower",
            total_distance_km=24.5,
            status=SessionStatus.ACTIVE,
            device_battery_start=98
        )
        db.add(suresh_session)
        db.commit()
        db.refresh(suresh_session)

        waypoints_suresh = [
            (17.4399, 78.4983, 0, 98),
            (17.4450, 78.4910, 20, 96),
            (17.4520, 78.4850, 45, 94),
            (17.4600, 78.4780, 80, 91),
            (17.4680, 78.4720, 120, 88),
            (17.4750, 78.4650, 160, 85),
            (17.4820, 78.4550, 200, 81),
            (17.4900, 78.4480, 240, 78),
        ]
        for idx, (lat, lon, min_offset, batt) in enumerate(waypoints_suresh):
            pt_time = suresh_start_time + timedelta(minutes=min_offset)
            pt = LocationPoint(
                client_id=f"EMP102-SYNC-{idx:04d}",
                staff_id=suresh.id,
                session_id=suresh_session.id,
                latitude=lat,
                longitude=lon,
                accuracy=9.0,
                speed=22.0,
                bearing=310.0,
                altitude=520.0,
                battery_level=batt,
                is_mock=False,
                is_anomaly=False,
                recorded_at=pt_time
            )
            db.add(pt)

        # 5. Create Active Session for Priya Sharma (Kukatpally)
        priya_start_time = datetime(today.year, today.month, today.day, 9, 30, 0, tzinfo=timezone.utc)
        priya_session = TrackingSession(
            staff_id=priya.id,
            login_time=priya_start_time,
            start_latitude=17.4947,
            start_longitude=78.3996,
            start_address="Kukatpally Housing Board (KPHB)",
            total_distance_km=18.2,
            status=SessionStatus.ACTIVE,
            device_battery_start=92
        )
        db.add(priya_session)
        db.commit()
        db.refresh(priya_session)

        waypoints_priya = [
            (17.4947, 78.3996, 0, 92),
            (17.4910, 78.3920, 30, 89),
            (17.4870, 78.3850, 60, 86),
            (17.4830, 78.3780, 90, 84),
            (17.4780, 78.3710, 120, 82),
        ]
        for idx, (lat, lon, min_offset, batt) in enumerate(waypoints_priya):
            pt = LocationPoint(
                client_id=f"EMP104-SYNC-{idx:04d}",
                staff_id=priya.id,
                session_id=priya_session.id,
                latitude=lat,
                longitude=lon,
                accuracy=7.2,
                speed=15.0,
                bearing=220.0,
                altitude=505.0,
                battery_level=batt,
                is_mock=False,
                is_anomaly=False,
                recorded_at=priya_start_time + timedelta(minutes=min_offset)
            )
            db.add(pt)

        # 6. Sample GPS Anomaly for Audit
        sample_anomaly = GPSAnomaly(
            staff_id=rahul.id,
            session_id=rahul_session.id,
            anomaly_type="POOR_ACCURACY",
            description="Poor GPS accuracy (65.4m > threshold 50.0m) detected in basement parking",
            severity="LOW",
            detected_at=rahul_start_time + timedelta(minutes=15),
            reviewed=False
        )
        db.add(sample_anomaly)

        # 7. Create CogniTrack 7-Day Assigned Location Schedules for Marketing Staff
        # Past 6 days, Today, and Upcoming days
        jobs_data = []

        # Past days (Mon-Sat)
        current_monday = today - timedelta(days=today.weekday())
        
        # Seed Past 6 Days for Rahul
        past_locations_rahul = [
            (current_monday, "Banjara Hills Rd 12 Commercial Hub", "Banjara Hills Rd 12, Hyderabad", 17.4156, 78.4350, 9, 30, JobStatus.COMPLETED),
            (current_monday, "Jubilee Hills Checkpost Outlets", "Road No 36, Jubilee Hills, Hyderabad", 17.4285, 78.4112, 14, 0, JobStatus.COMPLETED),
            (current_monday + timedelta(days=1), "Madhapur Tech Zone", "Inorbit Mall Rd, Madhapur, Hyderabad", 17.4504, 78.3808, 10, 0, JobStatus.COMPLETED),
            (current_monday + timedelta(days=2), "Gachibowli Financial District", "DLF Cyber City, Gachibowli", 17.4474, 78.3565, 11, 30, JobStatus.COMPLETED),
            (current_monday + timedelta(days=3), "Kondapur Retail Sector", "Main Rd, Kondapur, Hyderabad", 17.4699, 78.3578, 10, 15, JobStatus.COMPLETED),
            (current_monday + timedelta(days=4), "Hitec City Cyber Towers", "Cyber Towers Flyover, Hitec City", 17.4504, 78.3808, 14, 30, JobStatus.COMPLETED),
            (current_monday + timedelta(days=5), "Kukatpally Housing Board", "KPHB Colony Phase 3, Hyderabad", 17.4947, 78.3996, 11, 0, JobStatus.COMPLETED),
        ]

        for idx, (d_dt, name, addr, lat, lon, h, m, st) in enumerate(past_locations_rahul):
            jobs_data.append((
                f"LOC-HIST-{idx+101}", name, "+91 98765 43210", "Field Merchant Verification", addr, lat, lon, d_dt, h, m, rahul.id, st
            ))

        # Today's Locations for Rahul, Suresh, Priya
        today_locations = [
            ("LOC-TODAY-101", "Jubilee Hills Square", "+91 99881 22334", "Merchant Onboarding & Audit", "Villa 42, Jubilee Hills Road 36", 17.4320, 78.4050, today, 9, 30, rahul.id, JobStatus.COMPLETED),
            ("LOC-TODAY-102", "Madhapur Cyber Cluster", "+91 99881 55667", "POS Device Installation", "Plot 18, Inorbit Mall Road, Madhapur", 17.4504, 78.3808, today, 11, 45, rahul.id, JobStatus.COMPLETED),
            ("LOC-TODAY-103", "DLF Gachibowli Tech Park", "+91 99881 88990", "Corporate Client Verification", "Flat 502, DLF Cyber City, Gachibowli", 17.4474, 78.3565, today, 14, 0, rahul.id, JobStatus.IN_PROGRESS),
            ("LOC-TODAY-104", "L&T Serene County", "+91 99882 11223", "Retailer Outlet Sign-up", "Tower B, L&T Serene County, Gachibowli", 17.4480, 78.3640, today, 16, 30, rahul.id, JobStatus.ASSIGNED),
            
            ("LOC-TODAY-105", "Secunderabad Commercial Belt", "+91 99883 33445", "Field QR Onboarding", "East Marredpally, Secunderabad", 17.4520, 78.4850, today, 10, 0, suresh.id, JobStatus.COMPLETED),
            ("LOC-TODAY-106", "Bowenpally Market Yard", "+91 99883 66778", "Vendor Audit & Geo-tagging", "Bowenpally, Secunderabad", 17.4750, 78.4650, today, 13, 15, suresh.id, JobStatus.IN_PROGRESS),
            ("LOC-TODAY-107", "Alwal Plaza Center", "+91 99883 99001", "Merchant Relationship Visit", "Alwal Hills, Secunderabad", 17.4900, 78.4480, today, 15, 30, suresh.id, JobStatus.ASSIGNED),

            ("LOC-TODAY-108", "KPHB Colony Phase 3", "+91 99884 11223", "Store Telemetry Audit", "Phase 3, KPHB Colony", 17.4910, 78.3920, today, 10, 30, priya.id, JobStatus.COMPLETED),
            ("LOC-TODAY-109", "Miyapur Metro Station Outlets", "+91 99884 44556", "Partner Store Verification", "Miyapur Main Road", 17.4830, 78.3780, today, 14, 0, priya.id, JobStatus.IN_PROGRESS),
        ]

        for j_code, cust, phone, svc, addr, lat, lon, d_dt, h, m, staff_id, j_status in today_locations:
            jobs_data.append((j_code, cust, phone, svc, addr, lat, lon, d_dt, h, m, staff_id, j_status))

        # Upcoming 3 Days Locations
        upcoming_1 = today + timedelta(days=1)
        upcoming_2 = today + timedelta(days=2)
        upcoming_3 = today + timedelta(days=3)

        upcoming_locations = [
            ("LOC-UP-201", "Ameerpet Education Hub", "+91 99885 11111", "Institution Merchant Verification", "Ameerpet Cross Roads", 17.4375, 78.4482, upcoming_1, 10, 0, rahul.id, JobStatus.ASSIGNED),
            ("LOC-UP-202", "Begumpet Airport Plaza", "+91 99885 22222", "Corporate Outlets Sign-up", "Begumpet Main Road", 17.4440, 78.4670, upcoming_1, 14, 30, rahul.id, JobStatus.ASSIGNED),
            ("LOC-UP-203", "Somajiguda Circle", "+91 99885 33333", "Financial Outlet Audit", "Somajiguda, Hyderabad", 17.4250, 78.4580, upcoming_2, 11, 0, suresh.id, JobStatus.ASSIGNED),
            ("LOC-UP-204", "Panjagutta Galleria Mall", "+91 99885 44444", "Mall Partner Onboarding", "Panjagutta Main Rd", 17.4270, 78.4510, upcoming_3, 10, 30, priya.id, JobStatus.ASSIGNED),
        ]

        for j_code, cust, phone, svc, addr, lat, lon, d_dt, h, m, staff_id, j_status in upcoming_locations:
            jobs_data.append((j_code, cust, phone, svc, addr, lat, lon, d_dt, h, m, staff_id, j_status))

        for j_code, cust, phone, svc, addr, lat, lon, d_dt, h, m, staff_id, j_status in jobs_data:
            sched = datetime(d_dt.year, d_dt.month, d_dt.day, h, m, 0, tzinfo=timezone.utc)
            arr_t = sched if j_status in [JobStatus.IN_PROGRESS, JobStatus.COMPLETED] else None
            comp_t = (sched + timedelta(minutes=45)) if j_status == JobStatus.COMPLETED else None
            job = Job(
                job_number=j_code,
                customer_name=cust,
                customer_phone=phone,
                service_type=svc,
                address=addr,
                latitude=lat,
                longitude=lon,
                scheduled_time=sched,
                status=j_status,
                staff_id=staff_id,
                arrival_time=arr_t,
                completion_time=comp_t,
                time_on_site_minutes=45 if j_status == JobStatus.COMPLETED else None,
                notes=f"Scheduled visit for {cust} - {svc}. Verified location coordinates.",
                photo_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80" if j_status == JobStatus.COMPLETED else None,
                outcome="Store verified and location geo-tagged successfully." if j_status == JobStatus.COMPLETED else "Pending arrival",
                verification_status="APPROVED" if j_status == JobStatus.COMPLETED else "PENDING",
                follow_up_required=False,
                region="Hyderabad North" if staff_id in [rahul.id, priya.id] else "Hyderabad South"
            )
            db.add(job)
        db.commit()

        # 8. Create Historical Daily Summaries for Rahul (Past 6 days for rich weekly report!)
        # Matching prompt example: Monday 8h 20m 42km, Tuesday 7h 55m 51km, Wednesday 8h 12m 48km,
        # Thursday 8h 10m 39km, Friday 7h 44m 53km, Saturday 8h 00m 53km
        current_monday = today - timedelta(days=today.weekday())
        history_days = [
            (current_monday, 500, 42.0, 48, 6, 6),
            (current_monday + timedelta(days=1), 475, 51.0, 52, 7, 7),
            (current_monday + timedelta(days=2), 492, 48.0, 50, 6, 5),
            (current_monday + timedelta(days=3), 490, 39.0, 44, 7, 6),
            (current_monday + timedelta(days=4), 464, 53.0, 55, 6, 6),
            (current_monday + timedelta(days=5), 480, 53.0, 51, 6, 6),
        ]

        for d_date, mins, dist, pts, j_ass, j_cmp in history_days:
            if d_date < today:
                ds = DailySummary(
                    staff_id=rahul.id,
                    date=d_date,
                    login_time=datetime(d_date.year, d_date.month, d_date.day, 9, 0, 0, tzinfo=timezone.utc),
                    logout_time=datetime(d_date.year, d_date.month, d_date.day, 9, 0, 0, tzinfo=timezone.utc) + timedelta(minutes=mins),
                    working_minutes=mins,
                    distance_km=dist,
                    location_count=pts,
                    jobs_assigned=j_ass,
                    jobs_completed=j_cmp
                )
                db.add(ds)

        # Also add summary for today
        update_daily_summary(db, rahul.id, today)
        update_daily_summary(db, suresh.id, today)
        update_daily_summary(db, priya.id, today)

        # Weekly summaries
        update_weekly_summary(db, rahul.id, current_monday, current_monday + timedelta(days=6))
        update_weekly_summary(db, suresh.id, current_monday, current_monday + timedelta(days=6))
        update_weekly_summary(db, priya.id, current_monday, current_monday + timedelta(days=6))

        db.commit()
        print("[SUCCESS] Database successfully seeded with staff, sessions, GPS points, jobs, and summaries!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seed: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    reset_flag = "--reset" in sys.argv
    seed_database(reset=reset_flag)
