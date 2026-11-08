"""AksharaRecover AI – FastAPI Backend Application Entrypoint."""

import html
import os
import sys

# Ensure UTF-8 output encoding on Windows consoles
os.environ["PYTHONIOENCODING"] = "utf-8"
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.database import init_db, get_engine, get_db
from app.database.models import User, HeritageRecord
from app.utils.logging import setup_logging
from app.utils.errors import register_exception_handlers
from app.utils.security import get_optional_user
from app.ai.device_manager import detect_device, get_device_info
from app.ai.models import get_model_status

from app.routes.auth import router as auth_router
from app.routes.manuscripts import router as manuscripts_router
from app.routes.processing import router as processing_router
from app.routes.translation import router as translation_router
from app.routes.archive import router as archive_router
from app.routes.analytics import router as analytics_router
from app.routes.journey import router as journey_router

logger = logging.getLogger("akshararecover")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    settings = get_settings()
    setup_logging(settings.LOG_LEVEL)
    logger.info("Starting %s (%s)...", settings.APP_NAME, settings.APP_ENV)

    # Ensure upload directories
    settings.ensure_upload_dirs()

    # Initialize Database
    try:
        init_db()
        logger.info("Database schemas initialized.")
        if settings.APP_ENV == "development":
            from scripts.seed_dev import seed_development_user
            db_gen = get_db()
            db = next(db_gen)
            try:
                seed_development_user(db)
                logger.info("Development test account verified.")
            finally:
                db.close()
    except Exception as exc:
        logger.error("Failed to initialize database: %s", exc)

    # Detect compute hardware (CPU / CUDA)
    device = detect_device(settings.AI_DEVICE)
    logger.info("AI Device selected: %s", device)

    yield

    logger.info("Shutting down %s...", settings.APP_NAME)


settings = get_settings()

app = FastAPI(
    title="AksharaRecover AI API",
    description="Backend API for AI-Powered Historical Manuscript Preservation — Team SCRIPTORIA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

# Include API Routers
app.include_router(auth_router)
app.include_router(manuscripts_router)
app.include_router(processing_router)
app.include_router(translation_router)
app.include_router(archive_router)
app.include_router(analytics_router)
app.include_router(journey_router)


@app.get("/journey", response_class=HTMLResponse, tags=["Journey"])
def serve_journey_page():
    """Serve the Real-Time Manuscript Processing Journey web application."""
    html_path = Path(__file__).parent / "static" / "journey.html"
    if html_path.exists():
        return FileResponse(str(html_path), media_type="text/html")
    return HTMLResponse("<h2>AksharaRecover AI Journey UI Loading...</h2>")


@app.get("/", tags=["System"])
def root(request: Request):
    """Serve Journey UI to explicit HTML browser navigation, and JSON API details to programmatic clients."""
    accept = request.headers.get("accept", "")
    if "text/html" in accept and "application/json" not in accept and "*/*" not in accept:
        html_path = Path(__file__).parent / "static" / "journey.html"
        if html_path.exists():
            return FileResponse(str(html_path), media_type="text/html")
    return {
        "app": settings.APP_NAME,
        "status": "running",
        "documentation": "/docs",
        "health": "/health",
        "journey": "/journey",
    }


@app.get("/passport/{slug}", response_class=HTMLResponse, tags=["Heritage"])
def serve_public_passport(
    slug: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Serve a verifiable Digital Heritage Passport view for QR code scans with privacy enforcement."""
    record = db.query(HeritageRecord).filter(HeritageRecord.unique_slug == slug).first()
    if not record:
        return HTMLResponse(
            "<html><body style='background:#101614;color:#FEFAE0;font-family:sans-serif;padding:40px;text-align:center;'>"
            "<h3>Heritage passport not found.</h3></body></html>",
            status_code=404,
        )

    is_owner = bool(current_user and record.user_id == current_user.id)
    if record.visibility != "PUBLIC" and not is_owner:
        return HTMLResponse(
            "<html><body style='background:#101614;color:#FEFAE0;font-family:sans-serif;padding:40px;text-align:center;'>"
            "<div style='max-width:480px;margin:0 auto;background:#17211d;border:1px solid #35443a;border-radius:12px;padding:28px;'>"
            "<h3 style='color:#d4a373;margin-top:0;'>Private Heritage Record</h3>"
            "<p style='color:#a9b3a8;font-size:14px;line-height:1.6;'>This Digital Heritage Record is currently private. "
            "Sign in as the manuscript owner or enable Public QR Sharing in Stage 05 to view this record.</p>"
            "</div></body></html>",
            status_code=403,
        )

    safe_title = html.escape(record.title or "Historical Manuscript")
    safe_desc = html.escape(record.description or "")
    safe_cat = html.escape(record.cultural_category or "Historical Manuscript")
    safe_art = html.escape(record.art_form or "Palm-Leaf Conservation")
    safe_region = html.escape(record.region or "Kerala, India")
    safe_lang = html.escape(record.language or "Not specified")
    safe_script = html.escape(record.script or "Not specified")
    safe_slug = html.escape(record.unique_slug or "")
    safe_status = html.escape(record.publication_status or "DRAFT")
    badge_bg = "#ccd5ae" if record.publication_status == "APPROVED" else "#faedcd"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{safe_title} — Digital Heritage Passport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
        <style>
            body {{ font-family: 'Inter', sans-serif; background: #101614; color: #f1f2e9; padding: 24px; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 90vh; }}
            .card {{ background: #17211d; border: 1px solid #35443a; border-radius: 16px; max-width: 560px; width: 100%; padding: 32px; box-shadow: 0 12px 36px rgba(0,0,0,0.45); }}
            h1 {{ font-family: 'Space Grotesk', sans-serif; font-size: 22px; margin: 0 0 8px 0; color: #fefae0; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 999px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; color: #101614; background: {badge_bg}; margin-bottom: 16px; }}
            .meta {{ font-size: 13px; border-top: 1px solid #35443a; padding: 10px 0; display: flex; justify-content: space-between; gap: 12px; }}
            .meta span:first-child {{ color: #a9b3a8; font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-transform: uppercase; }}
            .meta span:last-child {{ font-weight: 600; color: #fefae0; text-align: right; }}
            .desc {{ font-size: 14px; line-height: 1.6; color: #e9edc9; margin: 16px 0; }}
            .footer {{ font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #d4a373; text-align: center; margin-top: 24px; border-top: 1px dashed #35443a; padding-top: 14px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">&#x2713; {safe_status} &bull; {html.escape(record.visibility or 'PRIVATE')}</span>
            <h1>{safe_title}</h1>
            <div class="desc">{safe_desc}</div>
            <div class="meta"><span>Cultural Category</span><span>{safe_cat}</span></div>
            <div class="meta"><span>Conservation Domain</span><span>{safe_art}</span></div>
            <div class="meta"><span>Historical Region</span><span>{safe_region}</span></div>
            <div class="meta"><span>Language / Script</span><span>{safe_lang} / {safe_script}</span></div>
            <div class="meta"><span>Permanent Identifier</span><span>{safe_slug}</span></div>
            <div class="meta"><span>Record Version</span><span>v{record.version}</span></div>
            <div class="footer">AKSHARARECOVER AI &bull; THE LIVING ARCHIVE &bull; SCRIPTORIA</div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(html_content)


@app.get("/health", tags=["System"])
def health_check():
    """System health check endpoint verifying database connectivity and device status."""
    db_healthy = False
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_healthy = True
    except Exception as exc:
        logger.warning("Health check DB probe failed: %s", exc)

    device_info = get_device_info()
    models_status = get_model_status()

    return {
        "status": "healthy" if db_healthy else "degraded",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_connected": db_healthy,
        "device": device_info,
        "models": models_status,
    }
