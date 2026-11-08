"""Pydantic v2 schemas for manuscript upload, detail, and listing."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class ManuscriptUploadResponse(BaseModel):
    manuscript_id: str
    title: Optional[str] = None
    original_filename: str
    file_type: str
    page_count: int
    status: str
    created_at: datetime


class ManuscriptDetail(BaseModel):
    id: str
    title: Optional[str] = None
    original_filename: str
    file_type: str
    source_language: Optional[str] = None
    source_script: Optional[str] = None
    page_count: int
    status: str
    preview_url: Optional[str] = None
    processing_status: Optional[str] = None
    verification_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ManuscriptListItem(BaseModel):
    id: str
    title: Optional[str] = None
    original_filename: str
    file_type: str
    source_language: Optional[str] = None
    page_count: int
    status: str
    verification_status: Optional[str] = None
    created_at: datetime
