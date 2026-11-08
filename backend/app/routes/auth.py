"""Authentication routes: registration, login, logout, session validation, and user profile."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Manuscript, ProcessingJob, VerificationRecord, HeritageRecord
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserProfileResponse,
    UserStatsSummary,
)
from app.schemas.common import success_response
from app.services.archive_service import _existing_file_url
from app.utils.errors import AuthenticationError, ConflictError
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
    get_optional_user,
    LoginRateLimiter,
)

logger = logging.getLogger("akshararecover.routes.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _compute_user_stats(db: Session, user_id: str) -> dict:
    """Calculate real manuscript statistics for a user from the database."""
    manuscripts = db.query(Manuscript).filter(Manuscript.user_id == user_id).all()
    total_uploaded = len(manuscripts)

    completed_count = 0
    processing_count = 0
    failed_count = 0
    verified_count = 0

    for m in manuscripts:
        latest_job = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.manuscript_id == m.id)
            .order_by(desc(ProcessingJob.created_at))
            .first()
        )
        job_status = latest_job.status if latest_job else None

        if m.status == "verified":
            verified_count += 1
            completed_count += 1
        elif m.status == "processed" or job_status == "completed":
            completed_count += 1
        elif job_status == "failed" or m.status == "failed":
            failed_count += 1
        elif job_status in ("pending", "processing") or m.status == "processing":
            processing_count += 1

    return {
        "total_uploaded": total_uploaded,
        "completed_count": completed_count,
        "processing_count": processing_count,
        "failed_count": failed_count,
        "verified_count": verified_count,
    }


def _serialize_user(user: User, stats: dict | None = None) -> dict:
    data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }
    if stats is not None:
        data["stats"] = stats
    return data


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    req: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Register a new user account, hash password with bcrypt, persist to database,
    and establish an authenticated HTTP-only session cookie.
    """
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise ConflictError(
            "An account with this email address already exists. Please sign in or use a different email."
        )

    now = datetime.now(timezone.utc)
    user = User(
        full_name=req.full_name,
        email=req.email,
        password_hash=hash_password(req.password),
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token, csrf_token = create_access_token(user.id, user.email)
    set_auth_cookies(response, access_token, csrf_token)

    stats = _compute_user_stats(db, user.id)
    logger.info("Registered new user account: %s (%s)", user.email, user.id)

    return success_response(
        data={
            "user": _serialize_user(user, stats=stats),
            "csrf_token": csrf_token,
        },
        message="Account registered successfully",
    )


@router.post("/login")
def login_user(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticate user with email and password, enforce sliding-window rate limiting,
    and set HTTP-only session cookie.
    """
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{req.email}"
    LoginRateLimiter.check_and_record(rate_key)

    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise AuthenticationError("Invalid email address or password.")

    if not user.is_active:
        raise AuthenticationError("This account has been deactivated.")

    # Successful login: clear rate limit counter for this key
    LoginRateLimiter.reset_key(rate_key)

    access_token, csrf_token = create_access_token(user.id, user.email)
    set_auth_cookies(response, access_token, csrf_token)

    stats = _compute_user_stats(db, user.id)
    logger.info("User logged in: %s (%s)", user.email, user.id)

    return success_response(
        data={
            "user": _serialize_user(user, stats=stats),
            "csrf_token": csrf_token,
        },
        message="Signed in successfully",
    )


@router.post("/logout")
def logout_user(response: Response):
    """Invalidate and clear current authentication session cookies."""
    clear_auth_cookies(response)
    return success_response(
        data={"logged_out": True},
        message="Signed out successfully",
    )


@router.get("/session")
def check_active_session(
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Non-throwing session status check for initial frontend hydration on public and private routes."""
    if not current_user:
        return success_response(
            data={"authenticated": False, "user": None},
            message="No active session",
        )
    stats = _compute_user_stats(db, current_user.id)
    return success_response(
        data={
            "authenticated": True,
            "user": _serialize_user(current_user, stats=stats),
        },
        message="Session active",
    )


@router.get("/me")
def get_current_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the currently authenticated user's profile and real manuscript statistics."""
    stats = _compute_user_stats(db, current_user.id)
    return success_response(
        data={
            "user": _serialize_user(current_user, stats=stats),
        },
        message="Session active",
    )


@router.get("/profile")
def get_user_profile_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return full user profile, real database statistics, and recent manuscripts."""
    stats = _compute_user_stats(db, current_user.id)

    recent_manuscripts = (
        db.query(Manuscript)
        .filter(Manuscript.user_id == current_user.id)
        .order_by(desc(Manuscript.created_at))
        .limit(5)
        .all()
    )

    recent_items = []
    for m in recent_manuscripts:
        latest_job = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.manuscript_id == m.id)
            .order_by(desc(ProcessingJob.created_at))
            .first()
        )
        heritage = db.query(HeritageRecord).filter(HeritageRecord.manuscript_id == m.id).first()
        preview_url = _existing_file_url("previews", m.preview_path)

        recent_items.append({
            "id": m.id,
            "title": m.title or m.original_filename,
            "original_filename": m.original_filename,
            "source_language": m.source_language,
            "source_script": m.source_script,
            "status": m.status,
            "processing_status": latest_job.status if latest_job else (
                "completed" if m.status in ("processed", "verified") else "uploaded"
            ),
            "preview_url": preview_url,
            "has_heritage_record": heritage is not None,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "completed_at": latest_job.completed_at.isoformat() if (latest_job and latest_job.completed_at) else None,
        })

    return success_response(
        data={
            "user": _serialize_user(current_user, stats=stats),
            "stats": stats,
            "recent_manuscripts": recent_items,
        },
        message="User profile retrieved",
    )
