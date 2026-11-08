"""Pydantic v2 schemas for processing requests and job status tracking."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProcessingRequest(BaseModel):
    enhancement_enabled: bool = True
    ocr_enabled: bool = True
    compare_original: bool = True
    source_language: str = "en"
    source_script: Optional[str] = None


class JobResponse(BaseModel):
    job_id: str
    manuscript_id: str
    status: str
    progress: int = 0
    current_stage: Optional[str] = None
    message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[dict] = None


class JobStatusResponse(BaseModel):
    job_id: str
    manuscript_id: str
    status: str
    progress: int
    current_stage: Optional[str] = None
    message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[dict] = None
