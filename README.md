# AKSHARARECOVER AI

**AI-Powered Restoration Support & Digital Preservation Platform for Historical Palm-Leaf Manuscripts**  
**Developed by Team SCRIPTORIA** • *"Bringing Forgotten Knowledge Back to Life."*

---

## Overview

**AKSHARARECOVER AI** (*The Living Archive*) is a full-stack computer vision, optical character recognition (OCR), scholarly translation, and archival preservation platform engineered for historical Kerala palm-leaf manuscripts (*Taliola* / *Olai*) and classical South Asian epigraphical folios.

Built for archival institutions, epigraphers, manuscript libraries, and digital humanities researchers, the platform executes a non-destructive five-stage preservation pipeline while enforcing strict account-level data isolation, cryptographic session security, and human-in-the-loop scholarly verification.

---

## Core Capabilities

### 1. Non-Destructive Five-Stage AI & Computer Vision Pipeline
- **Stage 01 — Adaptive Image Enhancement**: Single-channel luminance conversion (`cv2.cvtColor`), Non-Local Means denoising (`cv2.fastNlMeansDenoising`), Contrast Limited Adaptive Histogram Equalization (`cv2.createCLAHE`), and unsharp edge sharpening (`cv2.addWeighted`). Generates 32-bin intensity histograms (`cv2.calcHist`) and quantitative signal diagnostics (mean luminance, standard deviation contrast, Laplacian edge sharpness, and noise estimation) while preserving the raw archival scan untouched.
- **Stage 02 — Optical Damage Identification**: Deterministic computer vision segmentation isolating darkened organic staining, faded ink washout zones, and linear surface fractures (`cv2.HoughLinesP`) with contour bounding boxes scaled to native folio dimensions.
- **Stage 03 — Enhanced-Image OCR & Epigraphical Review**: Multi-engine sequence recognition (`EasyOCR` / `Tesseract`) benchmarking raw vs. CLAHE-enhanced images, computing per-line confidence distributions, flagging low-confidence segments (`< 0.70`), and providing versioned human transcription correction (`TranscriptionCorrection`).
- **Stage 04 — Bilingual Scholarly Translation**: Configurable translation pipeline supporting neural translation (`NLLB-200` / external API) and direct human scholarly English translation entry with provenance tracking and stale-state detection when source transcriptions are revised.
- **Stage 05 — Digital Heritage Record & QR Passport**: Packages the preserved manuscript, stage completion telemetry, cultural entities, verification audit trail, and metadata into a permanent Digital Heritage Record with a scannable QR code, owner-controlled `PRIVATE` / `PUBLIC` sharing permissions, and structured JSON dossier export.

### 2. Personal Manuscript Repository & Archival Workspace
- **Account-Scoped Library (`/my-manuscripts`)**: Full-text search across titles, UUIDs, filenames, and descriptions; status filtering (`All`, `Completed`, `Processing`, `Failed`); chronological sorting; side-by-side original and enhanced thumbnails; and one-click JSON dossier export.
- **Archivist Profile (`/profile`)**: Live database-backed metrics tracking total uploaded, completed, in-progress, failed, and scholarly verified folios.

### 3. Enterprise Security & Access Control
- **Cryptographic Authentication**: Password hashing via `bcrypt` (12 rounds), signed `HS256` JWT sessions in `HttpOnly` cookies, and double-submit CSRF tokens (`X-CSRF-Token`).
- **Rate Limiting & File Validation**: Sliding-window login rate limiting (`HTTP 429`) and strict upload validation verifying file extension, MIME type, magic bytes, image decoding integrity (`Pillow`), and PDF page bounds (`PyMuPDF`).
- **Strict Ownership Isolation**: Every manuscript, processing job, file asset (`/api/files/*`), and heritage record enforces ownership checks (`HTTP 401` / `HTTP 403`), with token-gated public access (`?token=`) enabled only when an owner explicitly switches a record's visibility to `PUBLIC`.

---

## System Architecture

```
AKSHARARECOVER-AI/
├── backend/                        # FastAPI + SQLAlchemy 2.x + OpenCV + EasyOCR
│   ├── app/
│   │   ├── database/               # SQLAlchemy ORM models, engine config & Alembic migrations
│   │   ├── pipelines/              # Image enhancement, damage heuristics, OCR & translation
│   │   ├── routes/                 # REST API endpoints (auth, manuscripts, processing, archive)
│   │   ├── schemas/                # Pydantic v2 request/response validation schemas
│   │   ├── services/               # Business logic, job orchestration & heritage records
│   │   ├── utils/                  # Security, bcrypt/JWT, file validation & structured errors
│   │   ├── config.py               # Environment-driven configuration (pydantic-settings)
│   │   └── main.py                 # FastAPI application entrypoint & middleware
│   ├── tests/                      # Automated pytest suite
│   ├── alembic.ini                 # Database migration configuration
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment template
└── frontend/                       # React 19 + Vite + Tailwind CSS + Recharts + Framer Motion
    ├── src/
    │   ├── components/             # Layout, 5-stage workbench, comparison sliders & charts
    │   ├── context/                # AuthContext, ManuscriptContext & ToastContext
    │   ├── pages/                  # Informational pages, Auth, Library, Lab & Results report
    │   ├── services/               # Axios API client & domain service modules
    │   ├── App.jsx                 # Application router & protected route guards
    │   └── index.css               # Heritage Botanical design tokens & global styles
    ├── package.json                # Frontend dependencies & scripts
    ├── vite.config.js              # Vite build & development proxy configuration
    └── .env.example                # Frontend environment template
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Tailwind CSS 3, Framer Motion, Recharts, Lucide React, `qrcode.react`, Axios |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| **Computer Vision & AI** | OpenCV (`opencv-python-headless`), NumPy, Pillow, PyMuPDF (`fitz`), EasyOCR, PyTorch |
| **Security & Storage** | `bcrypt`, `PyJWT`, HTTP-Only Session Cookies, CSRF Protection, SQLite (Development) / PostgreSQL (Production) |

---

## Local Development Setup

### Prerequisites
- **Python** 3.11 or higher
- **Node.js** 20.x or higher and `npm`

### 1. Clone the Repository
```bash
git clone https://github.com/jenit007/AKSHARARECOVER-AI.git
cd AKSHARARECOVER-AI
```

### 2. Configure Backend Environment
```bash
cd backend
python -m venv ../venv

# Windows (PowerShell)
..\venv\Scripts\Activate.ps1
# macOS / Linux
# source ../venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Apply database migrations:
```bash
alembic upgrade head
```

Start the FastAPI backend server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API and interactive OpenAPI documentation will be available at `http://127.0.0.1:8000/docs`.

### 3. Configure Frontend Environment
Open a second terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. During local development, leave `VITE_API_BASE_URL` empty in `frontend/.env` so requests proxy through Vite (`/api` → `http://127.0.0.1:8000`) on the same origin.

---

## Running Tests & Quality Checks

### Backend Test Suite (`pytest`)
```bash
cd backend
..\venv\Scripts\python.exe -m pytest -v
```

### Frontend Linter & Production Build
```bash
cd frontend
npm run lint
npm run build
```

---

## Production Deployment Guide

1. **Environment Security**:
   - Set `APP_ENV=production` and `DEBUG=false` in `backend/.env`.
   - Generate a cryptographically strong `SECRET_KEY` (`python -c "import secrets; print(secrets.token_urlsafe(48))"`).
   - Set `COOKIE_SECURE=true` and configure `CORS_ORIGINS` and `PUBLIC_FRONTEND_URL` to your production HTTPS domain.
2. **Database**:
   - Configure `DATABASE_URL` to a managed PostgreSQL instance (`postgresql+psycopg2://user:password@host:5432/akshararecover`) and run `alembic upgrade head`.
3. **Persistent Storage**:
   - Mount a persistent volume to `backend/uploads` so `originals/`, `previews/`, and `processed/` artifacts survive container restarts.
4. **Frontend Build**:
   - Run `npm run build` in `frontend/` and serve the compiled `frontend/dist/` bundle behind Nginx, Cloudflare Pages, or Vercel with `/api` reverse-proxied to the FastAPI upstream.

---

## License & Attribution

Developed by **Team SCRIPTORIA** — *AKSHARARECOVER AI: The Living Archive*.
