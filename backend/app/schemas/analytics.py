"""Pydantic v2 schemas for analytics and OCR evaluation metrics."""

from pydantic import BaseModel
from typing import Optional, Any


class OCREvaluation(BaseModel):
    cer: Optional[float] = None
    wer: Optional[float] = None
    evaluated_samples: int = 0


class AnalyticsResponse(BaseModel):
    total_manuscripts: int = 0
    processed_manuscripts: int = 0
    successful_ocr_jobs: int = 0
    failed_jobs: int = 0
    translations_completed: int = 0
    awaiting_verification: int = 0
    verified_manuscripts: int = 0
    average_processing_time_seconds: Optional[float] = None
    ocr_evaluation: OCREvaluation = OCREvaluation()
    enhancement_statistics: dict = {}
