# AKSHARARECOVER AI – Backend Architecture & Preservation Engine

## 1. Project Overview

**AKSHARARECOVER AI** is an AI-powered historical manuscript preservation platform designed to safeguard, enhance, transcribe, translate, and archive ancient manuscripts and palm-leaf documents.

### Key Objectives
1. **Preservation**: Accept JPG, JPEG, PNG, or multi-page PDF manuscript scans and preserve original files immutably.
2. **Computer Vision Enhancement**: Adaptively enhance faded, low-contrast, or degraded documents using OpenCV (CLAHE, non-local means denoising, adaptive thresholding, sharpening).
3. **Condition & Damage Heuristics**: Analyze uneven illumination, stains/dark regions, low contrast, noise, and scratch artifacts with visual overlay maps.
4. **Historical OCR**: Extract text from original and enhanced manuscripts with line-level bounding boxes and real model confidence scores.
5. **Confidence & Uncertainty Analysis**: Identify uncertain regions based on configurable confidence thresholds (default: 0.70).
6. **English Translation**: Translate Indic text to English using NLLB-200 or an external translation API, supporting contextual and literal translation modes.
7. **Human-in-the-Loop Corrections**: Versioned transcription and translation corrections; marks dependent translations as stale when transcriptions are altered.
8. **Digital Archive & Search**: Searchable archive across manuscript titles, filenames, extracted transcriptions, corrections, and translations.
9. **Real Database-Driven Analytics**: Calculate metrics strictly from database records without fabricated percentages.

---

## 2. Architecture & Directory Structure

```text
backend/
├── app/
│   ├── main.py                     # FastAPI application entrypoint & lifecycle
│   ├── config.py                   # Pydantic Settings configuration & env validation
│   │
│   ├── routes/
│   │   ├── manuscripts.py          # Upload, retrieval, results, and transcription corrections
│   │   ├── processing.py           # Async processing triggers and job progress polling
│   │   ├── translation.py          # Translation generation and human translation editing
│   │   ├── archive.py              # Verification status, cross-field search, safe file serving
│   │   └── analytics.py            # Live database analytics
│   │
│   ├── services/
│   │   ├── upload_service.py       # File validation, storage, PDF page conversion, previews
│   │   ├── image_processing.py     # OpenCV enhancement (CLAHE, denoise, sharpening)
│   │   ├── damage_detection.py     # Heuristic damage analysis and visual overlays
│   │   ├── ocr_service.py          # OCR engine interface (PaddleOCR & EasyOCR)
│   │   ├── confidence_service.py   # Confidence extraction and uncertainty flagging
│   │   ├── translation_service.py  # NLLB-200 local model & API translation engine
│   │   ├── verification_service.py # Audit trails for human verification
│   │   ├── archive_service.py      # Pagination, details, comparisons, and search
│   │   └── job_service.py          # Asynchronous pipeline orchestration & stage tracker
│   │
│   ├── ai/
│   │   ├── models.py               # Model caching & status reporter
│   │   ├── model_loader.py         # Lazy model loading utilities
│   │   ├── device_manager.py       # CUDA / CPU device selection & GPU detection
│   │   └── engine_registry.py      # Pluggable OCR & Translation registry
│   │
│   ├── database/
│   │   ├── database.py             # SQLAlchemy 2.x engine, SQLite WAL configuration
│   │   ├── models.py               # 7 Relational database tables with UUID keys
│   │   └── migrations/             # Alembic migration environment
│   │
│   ├── schemas/                    # Pydantic v2 validation models
│   │   ├── common.py               # Standard response envelope: {success, message, data, error}
│   │   ├── manuscript.py
│   │   ├── processing.py
│   │   ├── ocr.py
│   │   ├── translation.py
│   │   ├── verification.py
│   │   └── analytics.py
│   │
│   └── utils/
│       ├── file_validation.py      # Extension, MIME, magic bytes, decompression bomb checks
│       ├── image_utils.py          # PIL/OpenCV conversions and thumbnail preview generators
│       ├── text_utils.py           # Unicode NFC normalization, CER and WER calculations
│       ├── errors.py               # Custom exceptions & handlers (no stack traces to frontend)
│       └── logging.py              # Structured application logger
│
├── uploads/                        # Protected storage directory (served via /api/files/...)
│   ├── originals/                  # Original high-res uploads and converted PDF pages
│   ├── previews/                   # 800px thumbnail previews
│   └── processed/                  # Enhanced images and damage overlay visualizations
│
├── tests/                          # Automated Pytest suite
│   ├── conftest.py                 # Isolated test database and image fixtures
│   ├── test_health.py
│   ├── test_upload.py
│   ├── test_cv_and_quality.py
│   ├── test_ocr_and_confidence.py
│   ├── test_translation.py
│   └── test_manuscript_lifecycle.py
│
├── evaluation/                     # Accuracy & Image Evaluation scripts
│   ├── evaluate_ocr.py             # Character Error Rate (CER) & Word Error Rate (WER)
│   ├── evaluate_images.py          # PSNR & SSIM metrics
│   └── sample_ground_truth/        # Ground-truth reference texts
│
├── requirements.txt
├── .env.example
├── .gitignore
├── alembic.ini
└── README.md
```

---

## 3. Technology Stack

- **Framework**: Python 3.11+ / 3.13, FastAPI, Uvicorn, Pydantic v2
- **Database**: SQLite with WAL mode enabled (local development), PostgreSQL ready (production) via SQLAlchemy 2.0 & Alembic
- **Computer Vision**: OpenCV (`cv2`), Pillow (`PIL`), NumPy, PyMuPDF (`fitz`)
- **OCR Engine**: Pluggable interface supporting PaddleOCR and EasyOCR with Indic script capabilities
- **Translation**: NLLB-200 (`facebook/nllb-200-distilled-600M`) via HuggingFace Transformers, with pluggable external API fallback
- **Hardware Acceleration**: Automatic NVIDIA GPU / CUDA detection with CPU fallback

---

## 4. Setup and Installation

### 4.1 Prerequisites
- Python 3.11 to 3.13 installed
- Git
- NVIDIA GPU (optional, e.g., RTX 4060 with CUDA drivers)

### 4.2 Create Virtual Environment
```bash
# In the project root directory:
py -m venv venv

# Activate on Windows:
.\venv\Scripts\activate

# Or on Linux/macOS:
source venv/bin/activate
```

### 4.3 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4.4 Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key configuration parameters in `.env`:
| Parameter | Default | Description |
|---|---|---|
| `APP_NAME` | `AKSHARARECOVER_AI` | Name of application |
| `DATABASE_URL` | `sqlite:///./akshararecover.db` | Database connection string |
| `UPLOAD_DIR` | `uploads` | Storage directory for uploads |
| `MAX_UPLOAD_SIZE_MB` | `20` | Maximum file size allowed |
| `MAX_PDF_PAGES` | `30` | Maximum pages in uploaded PDF |
| `OCR_ENGINE` | `paddleocr` | OCR Engine (`paddleocr`, `easyocr`) |
| `OCR_CONFIDENCE_THRESHOLD` | `0.70` | Threshold below which text is flagged uncertain |
| `TRANSLATION_ENGINE` | `nllb` | Translation engine (`nllb`, `api`, `none`) |
| `AI_DEVICE` | `auto` | `auto`, `cuda`, or `cpu` |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed frontend origins |

---

## 5. Running the Backend

### 5.1 Start the Development Server
```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Once started:
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 6. API Contract and Endpoints

All responses follow the agreed standard JSON response envelope:
```json
{
  "success": true,
  "message": "Description of action",
  "data": {},
  "error": null
}
```

### 6.1 Summary of Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/manuscripts/upload` | Upload manuscript (JPG, PNG, PDF) |
| `POST` | `/api/manuscripts/{id}/process` | Start asynchronous enhancement & OCR (Returns 202) |
| `GET` | `/api/jobs/{job_id}` | Poll background processing job status and progress |
| `GET` | `/api/manuscripts/{id}/results` | Retrieve full OCR, enhancement, and translation results |
| `GET` | `/api/manuscripts/{id}/compare` | Retrieve side-by-side original/enhanced images and OCR |
| `PATCH`| `/api/manuscripts/{id}/transcription` | Correct transcription; marks translation stale |
| `POST` | `/api/manuscripts/{id}/translate` | Generate English translation |
| `PATCH`| `/api/manuscripts/{id}/translation` | Manually edit English translation |
| `POST` | `/api/manuscripts/{id}/verify` | Human verification status audit record |
| `GET` | `/api/manuscripts` | List archived manuscripts with pagination & filters |
| `GET` | `/api/manuscripts/{id}` | Retrieve individual manuscript metadata |
| `GET` | `/api/search?q={query}` | Search across titles, transcriptions, and translations |
| `GET` | `/api/analytics` | Real platform analytics calculated from database |
| `GET` | `/api/files/{category}/{filename}` | Safe file-serving with path traversal protection |
| `GET` | `/health` | Application, database, and hardware device health |

---

## 7. Sample cURL Commands

### 7.1 Upload a Manuscript
```bash
curl -X POST "http://127.0.0.1:8000/api/manuscripts/upload" \
  -F "file=@sample_manuscript.jpg;type=image/jpeg" \
  -F "title=Bhagavad Gita Palm Leaf Chapter 1" \
  -F "source_language=mal" \
  -F "source_script=Malayalam"
```

### 7.2 Start Processing (Returns HTTP 202)
```bash
curl -X POST "http://127.0.0.1:8000/api/manuscripts/<MANUSCRIPT_ID>/process" \
  -H "Content-Type: application/json" \
  -d '{
    "enhancement_enabled": true,
    "ocr_enabled": true,
    "compare_original": true,
    "source_language": "mal",
    "source_script": "Malayalam"
  }'
```

### 7.3 Poll Job Progress
```bash
curl -X GET "http://127.0.0.1:8000/api/jobs/<JOB_ID>"
```

### 7.4 Correct Transcription
```bash
curl -X PATCH "http://127.0.0.1:8000/api/manuscripts/<MANUSCRIPT_ID>/transcription" \
  -H "Content-Type: application/json" \
  -d '{
    "corrected_text": "ധർമ്മക്ഷേത്രേ കുരുക്ഷേത്രേ സമവേതാ യുയുത്സവഃ",
    "reviewer": "Prof. Historian",
    "notes": "Corrected ligature in line 2"
  }'
```

### 7.5 Generate Translation
```bash
curl -X POST "http://127.0.0.1:8000/api/manuscripts/<MANUSCRIPT_ID>/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "source_language": "mal",
    "target_language": "en",
    "translation_mode": "contextual"
  }'
```

### 7.6 Verify Manuscript
```bash
curl -X POST "http://127.0.0.1:8000/api/manuscripts/<MANUSCRIPT_ID>/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "verification_status": "verified",
    "reviewer": "Senior Epigraphist",
    "reviewer_notes": "Transcription and translation cross-verified with manuscript rubbing"
  }'
```

---

## 8. Automated Testing & Evaluation

### 8.1 Run the Test Suite
```bash
cd backend
pytest -v
```

### 8.2 Run Model Evaluation Scripts
```bash
# CER and WER evaluation
python evaluation/evaluate_ocr.py

# PSNR and SSIM image quality metrics
python evaluation/evaluate_images.py
```

---

## 9. Frontend Integration Guide (React)

1. **Base URL**: Set React API client base URL to `http://127.0.0.1:8000`.
2. **CORS**: Configured in `.env` (`CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`).
3. **Envelope**: Always read `response.data.data` when `response.data.success === true`.
4. **Job Polling**: After calling `/api/manuscripts/{id}/process`, capture `job_id` and poll `GET /api/jobs/{job_id}` every 1–2 seconds until `status === "completed"` or `"failed"`.
5. **Image URLs**: Stable image URLs are returned in `/api/manuscripts/{id}/results` (e.g., `/api/files/previews/{id}_preview.jpg`). Prepend the backend host URL to display them in `<img>` tags.
