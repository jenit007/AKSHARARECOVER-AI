"""Pydantic v2 schemas for OCR results and image comparison outputs."""

from pydantic import BaseModel
from typing import Optional, Any


class OCRLine(BaseModel):
    text: str
    confidence: Optional[float] = None
    bounding_box: Optional[list] = None
    is_uncertain: bool = False


class OCRPageResult(BaseModel):
    page_number: int
    full_text: str = ""
    lines: list[OCRLine] = []


class OCROutput(BaseModel):
    engine: Optional[str] = None
    model_name: Optional[str] = None
    language: Optional[str] = None
    pages: list[OCRPageResult] = []


class ImageComparisonPage(BaseModel):
    page_number: int
    original_image_url: Optional[str] = None
    enhanced_image_url: Optional[str] = None
    damage_overlay_url: Optional[str] = None
    original_ocr_text: Optional[str] = None
    enhanced_ocr_text: Optional[str] = None
    quality_metrics: Optional[dict] = None
