"""Pydantic v2 schemas for authentication, registration, and user profile."""

import re
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator, model_validator


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=250)
    email: str = Field(..., min_length=5, max_length=250)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Please enter a valid email address.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one letter and one number.")
        return v

    @model_validator(mode="after")
    def validate_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match.")
        return self


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=250)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Please enter a valid email address.")
        return cleaned


class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserStatsSummary(BaseModel):
    total_uploaded: int = 0
    completed_count: int = 0
    processing_count: int = 0
    failed_count: int = 0
    verified_count: int = 0
