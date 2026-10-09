# CogniTrack Field Operations & Telemetry Platform

CogniTrack is an enterprise-grade, battery-efficient field staff tracking, task dispatch, and telemetry management platform.

---

## 1. System Architecture

```text
                                 COGNITRACK PLATFORM
                                         │
                                         ▼
                               PostgreSQL Database
                            (DB_NAME=cognitrack, 5432)
                                         │
                                         ▼
                            FastAPI Python Backend
                            (http://127.0.0.1:8000)
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 React Admin Dashboard           React Native Mobile App
                (http://127.0.0.1:5173)         (http://127.0.0.1:3000 / APK)
```

---

## 2. Technology Stack & Key Subsystems

### 1. Python Backend (`/backend`)
* **Framework:** Python 3.11+ / FastAPI & Uvicorn
* **Database:** PostgreSQL (`cognitrack` database) with SQLAlchemy ORM
* **Cache & Pub/Sub:** Redis (with in-memory fallback for standalone deployment)
* **Authentication:** JWT (Bearer Tokens) with password hashing
* **Export Services:** OpenPyXL (Excel `.xlsx`) and ReportLab (PDF Reports `.pdf`)
* **Test Suite:** Pytest (19 unit/integration test cases)

### 2. Admin Web Portal (`/admin`)
* **Framework:** React 19 + TypeScript + Vite
* **Map Engine:** Leaflet.js with CARTO / OpenStreetMap vector layers
* **UI Features:** Live Staff Radar, Route Trajectory Visualizer, Task Dispatch Center, GPS Anomaly Audits, Excel/PDF Exports

### 3. Mobile User Application (`/mobile`)
* **Framework:** Expo / React Native Web + TypeScript + Vite
* **Native Android:** Android Foreground Location Service (`ForegroundLocationService.java`, `LocationPackage.java`)
* **Permissions:** Mandatory browser & device location permission prompt on login
* **Shift Control:** Dedicated **LOG IN**, **BREAK**, and **LOG OFF** duty card

---

## 3. Simplified 2-Role Security Architecture

The platform strictly enforces **2 roles**:

| Role | Access Level | Seed Login Credentials |
| :--- | :--- | :--- |
| **`ADMIN`** | Admin Portal, Task Dispatch, GPS Audit, Reports, Staff Directory | **`ADMIN001`** / `Password@123` |
| **`USER`** | Mobile Telemetry App, Duty Shift Controls, Assigned Schedules | **`EMP101`** (Rahul Kumar) / `Password@123`<br>**`EMP102`** (Suresh Varma) / `Password@123`<br>**`EMP104`** (Priya Sharma) / `Password@123` |

---

## 4. Key Workflows & User Experiences

### 📲 Mobile App User Workflow
1. **Location Permission on Login**:
   - Tapping **Sign In** prompts for location permissions (`http://127.0.0.1:3000 wants to know your location`).
   - If granted $\rightarrow$ Logged in. If denied $\rightarrow$ Displays location requirement warning.
2. **Shift Status Control Card**:
   - **`LOG IN`** (Green): Starts duty shift and continuous GPS location tracking.
   - **`BREAK`** (Amber): Pauses shift while **keeping location monitoring active** in the background.
   - **`LOG OFF`** (Red): Ends duty shift and stops background location telemetry.
3. **Today's Schedule & Expanded Tasks**:
   - Home screen shows Today's active schedule summary.
   - Tapping the card opens the full list with filter tabs for **All Tasks**, **Pending Tasks**, and **Completed Tasks**.

### 💻 Admin Operations Portal Workflow
1. **Live Staff Radar**: Real-time staff pins (🟢 Active, 🟡 On Break, 🔴 Offline) with speed, battery %, and geofence accuracy.
2. **Route Trajectory Visualizer**: Interactive polyline playback of daily breadcrumbs with start/end markers.
3. **Task Dispatch**: Create and assign marketing/customer field tasks to staff members.
4. **GPS Anomaly Audit**: Audit flagged telemetry events (speed jumps $>140\text{ km/h}$, poor accuracy $>50\text{m}$).
5. **One-Click Reports**: Download aggregated Excel (`.xlsx`) workbooks and formatted PDF (`.pdf`) performance reports.

---

## 5. Quick Start (Running Locally)

### Step 1: Initialize & Seed PostgreSQL Database
```powershell
cd c:\FST\backend
.\venv\Scripts\python.exe seed.py --reset
```

### Step 2: Start Backend API Server
```powershell
cd c:\FST\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Step 3: Start Admin Web Dashboard
```powershell
cd c:\FST\admin
npm run dev
```
- Admin Portal: [http://127.0.0.1:5173](http://127.0.0.1:5173) (Login: `ADMIN001` / `Password@123`)

### Step 4: Start Mobile Web App
```powershell
cd c:\FST\mobile
npm run dev
```
- Mobile App: [http://127.0.0.1:3000](http://127.0.0.1:3000) (Login: `EMP101` / `Password@123`)

---

## 6. Production Deployment

### Option A: 1-Click Production Docker Deployment
Launch all services (PostgreSQL, Redis, FastAPI Backend, Admin Web, Mobile Web) in Docker containers:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Option B: Building Native Android `.apk` File
To generate a downloadable `.apk` file for Android phones:

```bash
cd mobile
npm install -g eas-cli
npx eas login
npx eas build -p android --profile preview
```
- Download the generated `app-release.apk` and distribute directly to field users.
