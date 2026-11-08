"""Pydantic v2 schemas for verification and transcription correction."""

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class VerificationRequest(BaseModel):
    verification_status: str
    reviewer: Optional[str] = None
    reviewer_notes: Optional[str] = None
    transcription_version: Optional[int] = None
    translation_version: Optional[int] = None

    @field_validator("verification_status")
    @classmethod
    def validate_status(cls, v):
        allowed = ["pending", "verified", "needs_review", "rejected"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class TranscriptionCorrectionRequest(BaseModel):
    corrected_text: str
    reviewer: Optional[str] = None
    notes: Optional[str] = None
