import os
from functools import lru_cache
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    # Application
    APP_NAME: str = "AKSHARARECOVER_AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Authentication & Security
    SECRET_KEY: str = "akshara-recover-ai-dev-secret-key-change-in-prod-9f8e7d6c5b4a"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    COOKIE_NAME: str = "akshara_session"
    CSRF_COOKIE_NAME: str = "akshara_csrf"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS: int = 10
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 300

    # Public URLs
    PUBLIC_FRONTEND_URL: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str = f"sqlite:///{(BACKEND_DIR / 'akshararecover.db').as_posix()}"

    # Upload
    UPLOAD_DIR: str = str(BACKEND_DIR / "uploads")
    MAX_UPLOAD_SIZE_MB: int = 20
    MAX_PDF_PAGES: int = 30
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,webp,tif,tiff,pdf"

    # OCR
    OCR_ENGINE: str = "easyocr"
    OCR_LANGUAGE: str = "en"
    OCR_CONFIDENCE_THRESHOLD: float = 0.70

    # Translation
    TRANSLATION_ENGINE: str = "nllb"
    TRANSLATION_MODEL: str = "facebook/nllb-200-distilled-600M"
    TRANSLATION_API_KEY: str = ""
    TRANSLATION_API_URL: str = ""

    # AI / Hardware
    AI_DEVICE: str = "auto"
    AI_BATCH_SIZE: int = 1

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    # Logging
    LOG_LEVEL: str = "INFO"

    def model_post_init(self, __context) -> None:
        if self.APP_ENV != "test":
            if self.DATABASE_URL in ("sqlite:///./akshararecover.db", "sqlite:///akshararecover.db"):
                self.DATABASE_URL = f"sqlite:///{(BACKEND_DIR / 'akshararecover.db').as_posix()}"
            if self.UPLOAD_DIR in ("uploads", "./uploads"):
                self.UPLOAD_DIR = str(BACKEND_DIR / "uploads")

    # --- Computed properties ---

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [e.strip().lower() for e in self.ALLOWED_EXTENSIONS.split(",") if e.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def upload_originals_dir(self) -> Path:
        return Path(self.UPLOAD_DIR) / "originals"

    @property
    def upload_previews_dir(self) -> Path:
        return Path(self.UPLOAD_DIR) / "previews"

    @property
    def upload_processed_dir(self) -> Path:
        return Path(self.UPLOAD_DIR) / "processed"

    def ensure_upload_dirs(self):
        """Create upload directories if they don't exist."""
        for d in [self.upload_originals_dir, self.upload_previews_dir, self.upload_processed_dir]:
            d.mkdir(parents=True, exist_ok=True)

    model_config = {
        "env_file": str(BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance."""
    return Settings()
