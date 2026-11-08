"""Common Pydantic schemas and response helpers."""

from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime


class ErrorDetail(BaseModel):
    code: str
    details: list[Any] = []


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Any = None
    error: Optional[ErrorDetail] = None


class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class PaginatedResponse(BaseModel):
    items: list[Any]
    pagination: PaginationInfo


def success_response(data: Any = None, message: str = "Operation completed successfully") -> dict:
    return {"success": True, "message": message, "data": data, "error": None}


def error_response(message: str = "Operation failed", code: str = "ERROR", details: list | None = None) -> dict:
    return {
        "success": False,
        "message": message,
        "data": None,
        "error": {"code": code, "details": details or []},
    }
