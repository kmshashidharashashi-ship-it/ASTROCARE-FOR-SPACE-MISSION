# ASTROCARE 3D
### AI-Powered Astronaut Health Monitoring, 3D Digital Twin & Space Mission Medical Intelligence Platform

> **Project Positioning & Disclaimer:**  
> ASTROCARE 3D is an independent aerospace research, space medicine innovation, and technology demonstration platform relevant to NASA-related space exploration (e.g. Artemis IV Lunar Gateway and future deep space missions).  
> It does not imply that NASA officially owns, operates, approves, or endorses the software. All telemetry unless explicitly connected to real approved ground sensors is labelled as **SIMULATION MODE**. Experimental AI recommendations serve as clinical decision support for mission surgeons, not autonomous diagnosis.

---

## 1. Executive Summary & Capabilities

ASTROCARE 3D is a software platform engineered for mission-control surgeons, aerospace medical officers, and flight directors. It combines:

1. **Interactive 3D Astronaut Digital Twin**: Three.js and React Three Fiber anatomical model with smooth camera focusing, realistic heartbeat and respiratory animations driven by live telemetry, and independent selection of the Heart, Lungs, Brain, and Skeleton.
2. **Human Anatomy Explorer**: Multi-system space physiology explorer detailing microgravity pathophysiological shifts (cephalad fluid redistribution, cardiac atrophy, space motion sickness, osteoclastic bone resorption) and countermeasures.
3. **Real-Time Physiological Telemetry**: Continuous monitoring of Heart Rate, SpO2, Blood Pressure, Respiratory Rate, Body Temperature, and a dynamic 12-lead Lead II ECG oscilloscope.
4. **AI-Assisted Health Risk Intelligence**: Transparent Python machine learning using unsupervised Isolation Forest anomaly scoring, empirical Z-score deviation breakdown, and Flight Surgeon recommendations.
5. **Deep Space Radiation Monitoring**: Dosimeter flux tracking, cumulative mSv dose, NASA annual career limit progress (50 mSv/yr), and Solar Particle Event (SPE) warnings.
6. **Mental Wellness & Sleep Surveillance**: Astronaut sleep efficiency tracking, psychomotor vigilance score, subjective fatigue, stress ratings, and role-protected confidential journals.
7. **Spacecraft Environment (ECLSS)**: Cabin O2 %, CO2 mmHg, pressure kPa, cabin temperature, and relative humidity monitoring with automated hazard thresholds.
8. **Emergency Alert Center**: Real-time WebSocket incident broadcasting, severity classification (`NORMAL`, `MONITOR`, `WARNING`, `CRITICAL`), and acknowledgement audit trail.
9. **NASA Open-Data Explorer**: Integrated access to official NASA Open Science Data Repository (OSDR), GeneLab space biology studies, NASA POWER solar indices, and LSDA datasets.
10. **Medical Report Generator**: Automated PDF dossier compilation with telemetry summaries, risk history, and flight surgeon review notes.
11. **Interactive Hackathon Demonstration Mode**: 8-step guided interactive walkthrough with a prominent "TRIGGER SIMULATED ABNORMAL READING" capability that demonstrates the full ingestion → AI analysis → CRITICAL alert → WebSocket broadcast pipeline.
12. **AI Astronaut Medical Emergency Assistant**: Autonomous clinical decision-support module providing evidence-based medical checklists, medical officer assignment, priority flight surgeon escalation, and clinical incident history for acute microgravity conditions (Cardiovascular Arrhythmia, Airlock Hypoxia, Hyperthermia, Radiation SPE).

---

## 2. System Architecture

```
[Spacecraft Sensors / Telemetry Simulator]
               │
               ▼ (HTTP Ingestion / WebSocket)
     ┌────────────────────────┐
     │ FastAPI Backend Engine │
     │  - Pydantic Validation │
     │  - SQLAlchemy ORM      │
     │  - JWT Authentication  │
     └───────────┬────────────┘
                 ├──────────────────────────┐
                 ▼                          ▼
      ┌─────────────────────┐    ┌─────────────────────┐
      │ SQLite / PostgreSQL │    │   AI Risk Engine    │
      │  - users & audit    │    │ - Isolation Forest  │
      │  - health & alerts  │    │ - Baseline Z-Scores │
      │  - radiation & ECLSS│    │ - Explainable AI    │
      └─────────────────────┘    └──────────┬──────────┘
                 │                          │
                 ▼ (WebSocket Broadcast)   │
      ┌─────────────────────────────────────┴┐
      │  React + Vite Futuristic Frontend    │
      │   - Deep Space Navy (#050B16) Glass  │
      │   - Three.js / R3F 3D Digital Twin   │
      │   - Live ECG Canvas & Recharts       │
      │   - Role-Based Mission Control HUD   │
      └──────────────────────────────────────┘
```

---

## 3. Quick Start & Execution

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js v18+ & npm

### Backend Setup & Launch
```powershell
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the FastAPI server (Initializes DB, seeds demo users & crew automatically)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API and documentation will be available at:
- Swagger UI Docs: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

### Frontend Setup & Launch
```powershell
cd frontend

# 1. Install dependencies
npm install

# 2. Run Vite development server
npm run dev
```
The application interface will be live at: `http://localhost:5173`

> **Note:** The backend automatically serves the built frontend production files from `frontend/dist` when accessed directly at `http://localhost:8000/`.

---

## 4. Default Demo Accounts

For immediate testing, five pre-configured role-based credentials are ready to use:

| Role | Email | Password | Access Clearance |
| :--- | :--- | :--- | :--- |
| **Mission Commander** | `commander@astrocare.space` | `MissionCmd2026!` | Full Mission Oversight, Alert Authorization, Crew Management |
| **Flight Surgeon** | `surgeon@astrocare.space` | `FlightSurgeon2026!` | Confidential Medical Journals, Clinical Protocols, Prescriptions |
| **Medical Officer** | `medical@astrocare.space` | `MedOfficer2026!` | Telemetry Ingestion, Daily Check-in Logging, Vitals Triage |
| **Mission Analyst** | `analyst@astrocare.space` | `MissionAnalyst2026!` | Statistical Modeling, NASA Dataset Processing, Trend Analytics |
| **Administrator** | `admin@astrocare.space` | `AstroAdmin2026!` | Security Audit Trail, System Health, User Management |

---

## 5. Live Hackathon Demonstration Sequence

Navigate to `/demo` or click **START DEMO** in the top navigation bar.

1. **Step 1 — Open the Astronaut Digital Twin**: Medical laboratory HUD launches in SIMULATION MODE.
2. **Step 2 — Rotate & Zoom**: 360° orbital rotation, smooth camera inspection, and raycasting.
3. **Step 3 — Cardiovascular Inspection**: Select the Heart. Mesh illuminates in electric cyan, camera focuses, live Lead II ECG oscilloscope syncs with 72 BPM.
4. **Step 4 — Respiratory Inspection**: Select the Lungs. Pulmonary lobes illuminate with smooth breathing animation synced to respiratory rate (14.5 breaths/min).
5. **Step 5 — Neuro-Cognitive Inspection**: Select the Brain. Cerebral hemispheres illuminate in glowing violet; sleep duration, fatigue, and stress self-assessment display.
6. **Step 6 — Musculoskeletal Structure**: Select the Skeleton. Vertebrae, ribcage, and pelvis illuminate; spinal de-loading and resistive exercise loads display.
7. **Step 7 — Trigger Simulated Abnormal Reading**:
   Click **"TRIGGER SIMULATED ABNORMAL READING"**.
   - Ingests acute tachycardic / hypertensive episode (142 bpm, 158/98 mmHg).
   - Database stores reading marked `is_simulated=True`.
   - Isolation Forest detects acute anomaly (Score: 0.942, Category: `CRITICAL`).
   - 3D Heart turns flashing **emergency red**.
   - Emergency banner and audio-visual alert broadcast across WebSocket.
   - Recommended clinical countermeasure is displayed.
8. **Step 8 — Demonstration Summary**: All 8 stages validated, audit log saved.

---

## 6. Automated Testing

To run the automated backend test suite:
```powershell
cd backend
$env:PYTHONPATH="."
python -m pytest tests -v
```
All 57 automated tests covering Authentication, Registration, Role-based Access, Health Ingestion, Anomaly Detection, Radiation, and the Demonstration pipeline execute in under 5 seconds.

---

## 7. NASA Open-Data Sources Integrated

- **OSD-379**: NASA Twins Study (Longitudinal Multi-omics Spaceflight Impacts)
- **OSD-137**: ISS Spaceflight Immune Dysregulation & Cytokine Cascades
- **OSD-255**: LSDA Cardiovascular Deconditioning & Fluid Shifts
- **OSD-544**: Space Radiation Laboratory (NSRL) High-LET GCR Dosimetry
- **NASA POWER**: Top-of-Atmosphere Solar Irradiance & Space Climatology

---

## 8. License

Developed for spaceflight medicine research, aerospace innovation, and academic competitions. MIT License.
