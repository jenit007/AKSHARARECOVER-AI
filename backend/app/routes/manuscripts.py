"""Manuscript management routes – upload, retrieval, export, and transcription correction."""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import get_db
from app.database.models import (
    User,
    Manuscript,
    OCRResult,
    TranscriptionCorrection,
    TranslationResult,
)
from app.services.upload_service import UploadService
from app.services.archive_service import ArchiveService
from app.schemas.common import success_response
from app.schemas.verification import TranscriptionCorrectionRequest
from app.utils.errors import NotFoundError, ValidationError
from app.utils.security import (
    get_current_user,
    get_optional_user,
    verify_manuscript_ownership,
    verify_manuscript_read_access,
)

logger = logging.getLogger("akshararecover.routes.manuscripts")

router = APIRouter(prefix="/api/manuscripts", tags=["Manuscripts"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_manuscript(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    source_language: Optional[str] = Form(None),
    source_script: Optional[str] = Form(None),
    historical_period: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Validate and store original manuscript file under the authenticated user's account,
    convert PDFs if necessary, and generate initial preview.
    """
    data = await file.read()
    upload_service = UploadService()
    meta = upload_service.process_upload(
        filename=file.filename or "unknown",
        content_type=file.content_type,
        data=data,
        title=title,
        source_language=source_language,
        source_script=source_script,
    )

    now = datetime.now(timezone.utc)
    manuscript = Manuscript(
        id=meta["manuscript_id"],
        user_id=current_user.id,
        title=meta["title"],
        description=description.strip() if description and description.strip() else None,
        original_filename=meta["original_filename"],
        stored_filename=meta["stored_filename"],
        original_file_path=meta["original_file_path"],
        preview_path=meta["preview_path"],
        file_type=meta["file_type"],
        source_language=meta["source_language"],
        source_script=meta["source_script"],
        historical_period=historical_period.strip() if historical_period and historical_period.strip() else None,
        region=region.strip() if region and region.strip() else None,
        page_count=meta["page_count"],
        status="uploaded",
        created_at=now,
        updated_at=now,
    )
    db.add(manuscript)
    db.commit()
    db.refresh(manuscript)

    return success_response(
        data={
            "manuscript_id": manuscript.id,
            "user_id": manuscript.user_id,
            "title": manuscript.title,
            "description": manuscript.description,
            "original_filename": manuscript.original_filename,
            "file_type": manuscript.file_type,
            "source_language": manuscript.source_language,
            "source_script": manuscript.source_script,
            "historical_period": manuscript.historical_period,
            "region": manuscript.region,
            "page_count": manuscript.page_count,
            "status": manuscript.status,
            "created_at": manuscript.created_at.isoformat(),
        },
        message="Manuscript uploaded successfully",
    )


@router.get("")
def list_manuscripts(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    source_language: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "newest",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List manuscripts belonging exclusively to the authenticated user."""
    result = ArchiveService.list_manuscripts(
        db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status,
        source_language=source_language,
        search=search,
        sort=sort,
    )
    return success_response(data=result, message="Manuscripts retrieved")


@router.get("/{id}")
def get_manuscript(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve manuscript metadata and status (requires ownership or public visibility)."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)
    details = ArchiveService.get_manuscript(db, id)
    return success_response(data=details, message="Manuscript details retrieved")


@router.get("/{id}/results")
def get_manuscript_results(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve full processing results (requires ownership or public visibility)."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)
    results = ArchiveService.get_full_results(db, id)
    return success_response(data=results, message="Processing results retrieved")


@router.get("/{id}/compare")
def get_manuscript_compare(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve image & OCR comparisons (requires ownership or public visibility)."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)
    compare_data = ArchiveService.get_comparisons(db, id)
    return success_response(data=compare_data, message="Comparison retrieved")


@router.get("/{id}/export")
def export_manuscript_record(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Export complete Digital Heritage Record & Processing Report as a downloadable JSON dossier."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)
    dossier = ArchiveService.export_manuscript_dossier(db, id)
    filename = f"akshara_heritage_dossier_{id[:8]}.json"
    return JSONResponse(
        content=dossier,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.patch("/{id}/transcription")
def correct_transcription(
    id: str,
    req: TranscriptionCorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Correct OCR-extracted text. Requires manuscript ownership.
    Preserves original OCR result and increments version number.
    Marks dependent translations stale.
    """
    manuscript = verify_manuscript_ownership(db, id, current_user)

    ocr_result = (
        db.query(OCRResult)
        .filter(OCRResult.manuscript_id == id)
        .order_by(desc(OCRResult.created_at))
        .first()
    )
    if not ocr_result:
        raise ValidationError("No OCR results found to correct for this manuscript.")

    latest_corr = (
        db.query(TranscriptionCorrection)
        .filter(TranscriptionCorrection.ocr_result_id == ocr_result.id)
        .order_by(desc(TranscriptionCorrection.version_number))
        .first()
    )
    next_version = (latest_corr.version_number + 1) if latest_corr else 2

    original_text_to_save = latest_corr.corrected_text if latest_corr else (ocr_result.selected_text or "")
    now = datetime.now(timezone.utc)
    corr = TranscriptionCorrection(
        manuscript_id=id,
        ocr_result_id=ocr_result.id,
        original_text=original_text_to_save,
        corrected_text=req.corrected_text,
        version_number=next_version,
        reviewer=req.reviewer or current_user.full_name,
        notes=req.notes,
        created_at=now,
    )
    db.add(corr)

    ocr_result.selected_text = req.corrected_text
    ocr_result.updated_at = now

    translations = db.query(TranslationResult).filter(TranslationResult.manuscript_id == id).all()
    translation_stale = False
    for t in translations:
        t.status = "stale"
        t.updated_at = now
        translation_stale = True

    manuscript.updated_at = now
    db.commit()

    return success_response(
        data={
            "manuscript_id": id,
            "original_text": original_text_to_save,
            "corrected_text": req.corrected_text,
            "version_number": next_version,
            "reviewer": corr.reviewer,
            "updated_at": now.isoformat(),
            "translation_stale": translation_stale,
        },
        message="Transcription corrected",
    )
