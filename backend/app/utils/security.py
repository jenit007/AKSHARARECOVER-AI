"""Security utilities: password hashing, JWT session tokens, HTTP-only cookies, rate limiting, and ownership guards."""

import logging
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, Request, Response
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.database import get_db
from app.database.models import User, Manuscript, HeritageRecord, ConsentRecord
from app.utils.errors import (
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
)

logger = logging.getLogger("akshararecover.security")


# ==============================================================================
# 1. PASSWORD HASHING (BCRYPT)
# ==============================================================================

def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt with a cryptographic salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time verification of a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


# ==============================================================================
# 2. JWT & HTTP-ONLY SESSION COOKIE MANAGEMENT
# ==============================================================================

def create_access_token(user_id: str, email: str) -> tuple[str, str]:
    """Create a signed JWT access token and a CSRF token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    csrf_token = secrets.token_urlsafe(24)

    payload = {
        "sub": user_id,
        "email": email,
        "csrf": csrf_token,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": secrets.token_hex(8),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, csrf_token


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT access token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Your session has expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid authentication session. Please sign in again.")


def set_auth_cookies(response: Response, access_token: str, csrf_token: str) -> None:
    """Attach HTTP-only session cookie and readable CSRF cookie to the response."""
    settings = get_settings()
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE or settings.APP_ENV == "production",
        samesite=settings.COOKIE_SAMESITE,
        max_age=max_age,
        path="/",
    )
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE or settings.APP_ENV == "production",
        samesite=settings.COOKIE_SAMESITE,
        max_age=max_age,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear session and CSRF cookies on logout."""
    settings = get_settings()
    response.delete_cookie(key=settings.COOKIE_NAME, path="/")
    response.delete_cookie(key=settings.CSRF_COOKIE_NAME, path="/")


# ==============================================================================
# 3. LOGIN RATE LIMITER (SLIDING WINDOW)
# ==============================================================================

class LoginRateLimiter:
    """In-memory sliding window rate limiter for authentication endpoints."""

    _attempts: dict[str, list[float]] = defaultdict(list)

    @classmethod
    def check_and_record(cls, key: str) -> None:
        settings = get_settings()
        now = time.time()
        window = settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
        max_attempts = settings.LOGIN_RATE_LIMIT_MAX_ATTEMPTS

        # Prune expired timestamps
        cls._attempts[key] = [ts for ts in cls._attempts[key] if now - ts < window]

        if len(cls._attempts[key]) >= max_attempts:
            raise RateLimitError(
                f"Too many login attempts. Please wait {window // 60} minutes before trying again."
            )

        cls._attempts[key].append(now)

    @classmethod
    def reset_key(cls, key: str) -> None:
        cls._attempts.pop(key, None)

    @classmethod
    def reset_all(cls) -> None:
        cls._attempts.clear()


# ==============================================================================
# 4. AUTHENTICATION & OWNERSHIP DEPENDENCIES
# ==============================================================================

def _extract_token_from_request(request: Request) -> Optional[str]:
    """Extract JWT from HTTP-only session cookie or Authorization Bearer header."""
    settings = get_settings()
    cookie_token = request.cookies.get(settings.COOKIE_NAME)
    if cookie_token:
        return cookie_token

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()

    return None


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the authenticated User if a valid session exists, otherwise None."""
    token = _extract_token_from_request(request)
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
        return user
    except Exception:
        return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Require an authenticated active User or raise HTTP 401."""
    token = _extract_token_from_request(request)
    if not token:
        raise AuthenticationError("Authentication required. Please sign in to continue.")

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid authentication token.")

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise AuthenticationError("User account not found or inactive. Please sign in again.")

    return user


def is_manuscript_publicly_shared(db: Session, manuscript_id: str, share_token: Optional[str] = None) -> bool:
    """Check whether a manuscript has an explicitly PUBLIC heritage record."""
    record = db.query(HeritageRecord).filter(HeritageRecord.manuscript_id == manuscript_id).first()
    if not record:
        return False
    if record.visibility == "PUBLIC":
        if share_token and record.unique_slug == share_token:
            return True
        return True
    return False


def verify_manuscript_ownership(
    db: Session,
    manuscript_id: str,
    current_user: User,
) -> Manuscript:
    """Verify the manuscript exists and belongs to current_user, raising 404 or 403 otherwise."""
    manuscript = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
    if not manuscript:
        raise NotFoundError(f"Manuscript with ID '{manuscript_id}' not found.")

    if manuscript.user_id and manuscript.user_id != current_user.id:
        raise AuthorizationError("You do not have permission to access or modify this manuscript.")

    if manuscript.user_id is None:
        raise AuthorizationError("This manuscript is not associated with your account.")

    return manuscript


def verify_manuscript_read_access(
    db: Session,
    manuscript_id: str,
    current_user: Optional[User],
    share_token: Optional[str] = None,
) -> Manuscript:
    """
    Verify read access to a manuscript:
    - Allowed if current_user is the owner of the manuscript.
    - Allowed if the manuscript's HeritageRecord visibility is explicitly 'PUBLIC'.
    - Otherwise raises 401 (if unauthenticated) or 403 (if owned by another user and private).
    """
    manuscript = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
    if not manuscript:
        raise NotFoundError(f"Manuscript with ID '{manuscript_id}' not found.")

    if current_user and manuscript.user_id == current_user.id:
        return manuscript

    if is_manuscript_publicly_shared(db, manuscript_id, share_token=share_token):
        return manuscript

    if not current_user:
        raise AuthenticationError("Authentication required to view this private manuscript record.")

    raise AuthorizationError("You do not have permission to view this private manuscript record.")
