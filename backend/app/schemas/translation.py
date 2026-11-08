"""Pydantic v2 schemas for translation requests, responses, and edits."""

from pydantic import BaseModel
from typing import Optional, Any


class TranslationRequest(BaseModel):
    source_text: Optional[str] = None
    source_language: str = "en"
    target_language: str = "en"
    translation_mode: str = "contextual"  # literal, contextual
    force_regenerate: bool = False


class TranslationResponse(BaseModel):
    manuscript_id: str
    source_text: Optional[str] = None
    translated_text: Optional[str] = None
    source_language: str
    target_language: str
    translation_model: Optional[str] = None
    model_version: Optional[str] = None
    transcription_version: int = 1
    uncertainty_notes: list[Any] = []
    created_at: Optional[str] = None


class TranslationEditRequest(BaseModel):
    corrected_translation: str
    reviewer: Optional[str] = None
    notes: Optional[str] = None
