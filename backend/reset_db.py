import sys
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.staff import Staff, StaffRole, StaffStatus
from app.models.tracking import TrackingSession, LocationPoint, GPSAnomaly
from app.models.summary import DailySummary, WeeklySummary
from app.models.job import Job

def reset_and_clean_database(create_initial_admin: bool = True):
    print("[INFO] Connecting to Supabase / PostgreSQL database...")
    print("[INFO] Clearing existing tables and removing all users...")
    
    # Drop all existing tables
    Base.metadata.drop_all(bind=engine)
    print("[SUCCESS] All existing tables and user records dropped.")
    
    # Recreate clean tables
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] Clean database schema created successfully.")
    
    db = SessionLocal()
    try:
        if create_initial_admin:
            print("[INFO] Creating single initial System Admin user...")
            admin = Staff(
                employee_code="ADMIN001",
                name="System Administrator",
                phone="+91 98000 11223",
                email="admin@extrahand.in",
                password_hash=get_password_hash("Admin@123"),
                role=StaffRole.ADMIN,
                status=StaffStatus.ACTIVE,
                department="Operations Headquarters"
            )
            db.add(admin)
            db.commit()
            print("[SUCCESS] Initial admin user created: admin@extrahand.in / Admin@123")
        else:
            print("[SUCCESS] Database is completely empty with zero users.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding admin failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_clean_database(create_initial_admin=True)
