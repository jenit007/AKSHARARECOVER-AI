"""File validation utilities – extension, MIME, magic bytes, size."""

import io
from pathlib import Path

from app.config import get_settings
from app.utils.errors import FileTypeError, FileTooLargeError, ValidationError

import logging

logger = logging.getLogger("akshararecover.file_validation")

# File signature magic bytes
SIGNATURES = {
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "webp": [b"RIFF"],
    "tif": [b"II*\x00", b"MM\x00*"],
    "tiff": [b"II*\x00", b"MM\x00*"],
    "pdf": [b"%PDF"],
}

IMAGE_EXTENSIONS = ("jpg", "jpeg", "png", "webp", "tif", "tiff")


def validate_extension(filename: str) -> str:
    """Return the lowercase extension if allowed, else raise."""
    settings = get_settings()
    ext = Path(filename).suffix.lstrip(".").lower()
    if ext not in settings.allowed_extensions_list:
        raise FileTypeError(
            f"File extension '.{ext}' is not allowed. "
            f"Allowed: {', '.join(settings.allowed_extensions_list)}"
        )
    return ext


def validate_mime_type(content_type: str | None) -> str:
    """Validate the declared MIME type."""
    allowed_mimes = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/tiff",
        "application/pdf",
        "application/octet-stream",
    }
    if content_type and content_type.lower() not in allowed_mimes:
        raise FileTypeError(f"MIME type '{content_type}' is not supported.")
    return content_type or "application/octet-stream"


def validate_file_signature(data: bytes, extension: str) -> bool:
    """Verify the file starts with a valid magic-byte signature."""
    sigs = SIGNATURES.get(extension, [])
    if not sigs:
        return True
    for sig in sigs:
        if data[: len(sig)] == sig:
            if extension == "webp" and data[8:12] != b"WEBP":
                continue
            return True
    raise FileTypeError(
        f"File content does not match the expected '{extension}' format."
    )


def validate_file_size(size: int) -> None:
    """Raise if the file exceeds the configured maximum."""
    settings = get_settings()
    if size > settings.max_upload_size_bytes:
        raise FileTooLargeError(
            f"File size ({size / 1024 / 1024:.1f} MB) exceeds the maximum "
            f"allowed size ({settings.MAX_UPLOAD_SIZE_MB} MB)."
        )


def validate_image_integrity(data: bytes) -> tuple[int, int]:
    """Open image with Pillow to verify it is not corrupted. Returns (width, height)."""
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = 178_956_970  # ~13400x13400 – guard against decompression bombs

    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        return img.size
    except Exception as exc:
        raise ValidationError(f"Image file is corrupted or unreadable: {exc}")


def validate_pdf_pages(data: bytes) -> int:
    """Return the page count of a PDF. Raise if corrupted or over limit."""
    settings = get_settings()
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=data, filetype="pdf")
        page_count = len(doc)
        doc.close()
    except Exception as exc:
        raise ValidationError(f"PDF file is corrupted or unreadable: {exc}")

    if page_count == 0:
        raise ValidationError("PDF file contains no pages.")
    if page_count > settings.MAX_PDF_PAGES:
        raise FileTooLargeError(
            f"PDF has {page_count} pages, exceeding the maximum of {settings.MAX_PDF_PAGES}."
        )
    return page_count


def validate_upload(filename: str, content_type: str | None, data: bytes) -> dict:
    """Run all validations. Returns metadata dict."""
    if not data:
        raise ValidationError("Uploaded file is empty.")

    ext = validate_extension(filename)
    validate_mime_type(content_type)
    validate_file_size(len(data))
    validate_file_signature(data, ext)

    meta: dict = {"extension": ext, "size": len(data), "page_count": 1}

    if ext in IMAGE_EXTENSIONS:
        w, h = validate_image_integrity(data)
        meta["width"] = w
        meta["height"] = h
    elif ext == "pdf":
        meta["page_count"] = validate_pdf_pages(data)

    return meta
