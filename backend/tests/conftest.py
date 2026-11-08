"""Pytest configuration, fixtures, and isolated test database setup."""

import io
import os
import shutil
import tempfile
from datetime import datetime, timezone
import pytest
from pathlib import Path
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment before imports
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app as fastapi_app
from app.config import get_settings
from app.database.database import Base, get_db
from app.database.models import User
from app.utils.security import hash_password, create_access_token, LoginRateLimiter


@pytest.fixture(scope="session")
def test_upload_dir():
    """Create a temporary upload directory for tests and clean up after."""
    temp_dir = tempfile.mkdtemp(prefix="akshara_test_uploads_")
    settings = get_settings()
    settings.UPLOAD_DIR = temp_dir
    settings.ensure_upload_dirs()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def test_db(tmp_path):
    """File-backed isolated SQLite database for tests."""
    LoginRateLimiter.reset_all()
    db_file = tmp_path / "test_akshara.db"
    db_url = f"sqlite:///{db_file}"
    settings = get_settings()
    settings.DATABASE_URL = db_url

    from app.database import database as db_module
    db_module.engine = create_engine(db_url, connect_args={"check_same_thread": False})
    db_module.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_module.engine)
    Base.metadata.create_all(bind=db_module.engine)

    session = db_module.SessionLocal()
    try:
        yield session
    finally:
        session.close()
        db_module.engine.dispose()


@pytest.fixture(scope="function")
def test_user(test_db):
    """Create a primary authenticated user in the isolated test DB."""
    now = datetime.now(timezone.utc)
    user = User(
        full_name="Test Scholar",
        email="scholar@scriptoria.test",
        password_hash=hash_password("scholar123"),
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture(scope="function")
def second_user(test_db):
    """Create a second user for cross-user ownership isolation tests."""
    now = datetime.now(timezone.utc)
    user = User(
        full_name="Second Researcher",
        email="other@scriptoria.test",
        password_hash=hash_password("other1234"),
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture(scope="function")
def unauth_client(test_db, test_upload_dir):
    """Unauthenticated FastAPI TestClient."""
    def override_get_db():
        yield test_db

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as tc:
        yield tc
    fastapi_app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client(test_db, test_upload_dir, test_user):
    """Authenticated FastAPI TestClient (signed in as test_user via session cookie)."""
    def override_get_db():
        yield test_db

    settings = get_settings()
    token, csrf = create_access_token(test_user.id, test_user.email)

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        test_client.cookies.set(settings.COOKIE_NAME, token)
        test_client.cookies.set(settings.CSRF_COOKIE_NAME, csrf)
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def sample_image_bytes():
    """Generate a clean synthetic manuscript image with black text on cream background."""
    img = Image.new("RGB", (400, 200), color=(245, 240, 225))
    draw = ImageDraw.Draw(img)
    draw.text((30, 40), "AKSHARA RECOVER AI", fill=(20, 20, 20))
    draw.text((30, 80), "Historical Manuscript Text Page 1", fill=(30, 30, 30))
    draw.rectangle([25, 30, 375, 120], outline=(150, 100, 50), width=2)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


@pytest.fixture
def sample_png_bytes():
    """Generate a synthetic PNG image."""
    img = Image.new("RGB", (250, 150), color=(235, 230, 215))
    draw = ImageDraw.Draw(img)
    draw.text((20, 30), "Ancient Manuscript Sample", fill=(10, 10, 10))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def sample_pdf_bytes():
    """Generate a valid multi-page PDF using PyMuPDF."""
    try:
        import fitz
        doc = fitz.open()
        for i in range(2):
            page = doc.new_page(width=300, height=400)
            page.insert_text((50, 50), f"Manuscript Page {i+1}\nHistorical palm leaf transcript.")
        pdf_bytes = doc.write()
        doc.close()
        return pdf_bytes
    except ImportError:
        return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF"
