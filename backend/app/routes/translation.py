"""Translation routes – English translation and manual editing."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import get_db
from app.database.models import (
    User,
    OCRResult,
    TranslationResult,
    TranscriptionCorrection,
)
from app.schemas.common import success_response
from app.schemas.translation import TranslationRequest, TranslationEditRequest
from app.services.translation_service import TranslationService
from app.utils.errors import ValidationError, ServiceUnavailableError
from app.utils.security import get_current_user, verify_manuscript_ownership

logger = logging.getLogger("akshararecover.routes.translation")

router = APIRouter(prefix="/api/manuscripts", tags=["Translation"])


@router.post("/{id}/translate")
def generate_translation(
    id: str,
    req: TranslationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate English translation using local NLLB model or external translation engine.
    Requires manuscript ownership. Never fabricates translations.
    """
    manuscript = verify_manuscript_ownership(db, id, current_user)

    ocr_result = (
        db.query(OCRResult)
        .filter(OCRResult.manuscript_id == id)
        .order_by(desc(OCRResult.created_at))
        .first()
    )

    source_text = req.source_text
    transcription_ver = 1

    if not source_text:
        latest_corr = (
            db.query(TranscriptionCorrection)
            .filter(TranscriptionCorrection.manuscript_id == id)
            .order_by(desc(TranscriptionCorrection.version_number))
            .first()
        )
        if latest_corr:
            source_text = latest_corr.corrected_text
            transcription_ver = latest_corr.version_number
        elif ocr_result:
            source_text = ocr_result.selected_text or ocr_result.enhanced_image_text or ocr_result.original_image_text
            transcription_ver = 1

    if not source_text or not source_text.strip():
        raise ValidationError("No source text available to translate.")

    translation_service = TranslationService()

    try:
        res = translation_service.translate_text(
            text=source_text,
            src_lang=req.source_language or manuscript.source_language or "en",
            tgt_lang=req.target_language,
            mode=req.translation_mode,
        )
    except RuntimeError as rerr:
        logger.error("Translation service error: %s", rerr)
        raise ServiceUnavailableError(f"Translation service unavailable: {rerr}")
    except ValueError as verr:
        logger.warning("Translation validation error: %s", verr)
        raise ValidationError(str(verr))

    now = datetime.now(timezone.utc)
    trans_record = TranslationResult(
        manuscript_id=id,
        ocr_result_id=ocr_result.id if ocr_result else None,
        source_text=source_text,
        translated_text=res.get("translated_text", ""),
        source_language=req.source_language or manuscript.source_language or "en",
        target_language=req.target_language,
        translation_mode=req.translation_mode,
        translation_model=res.get("translation_model", "none"),
        model_version=res.get("model_version", "1.0"),
        transcription_version=transcription_ver,
        uncertainty_notes=res.get("uncertainty_notes", []),
        status="completed",
        created_at=now,
        updated_at=now,
    )
    db.add(trans_record)
    manuscript.updated_at = now
    db.commit()
    db.refresh(trans_record)

    return success_response(
        data={
            "manuscript_id": id,
            "source_text": trans_record.source_text,
            "translated_text": trans_record.translated_text,
            "source_language": trans_record.source_language,
            "target_language": trans_record.target_language,
            "translation_model": trans_record.translation_model,
            "model_version": trans_record.model_version,
            "transcription_version": trans_record.transcription_version,
            "status": trans_record.status,
            "is_edited": bool(trans_record.is_edited),
            "uncertainty_notes": trans_record.uncertainty_notes or [],
            "created_at": trans_record.created_at.isoformat(),
        },
        message="Translation completed",
    )


@router.patch("/{id}/translation")
def edit_translation(
    id: str,
    req: TranslationEditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Edit or enter English translation manually. Requires manuscript ownership.
    Preserves original machine translation if one existed.
    """
    manuscript = verify_manuscript_ownership(db, id, current_user)

    latest_trans = (
        db.query(TranslationResult)
        .filter(TranslationResult.manuscript_id == id)
        .order_by(desc(TranslationResult.created_at))
        .first()
    )
    ocr_result = (
        db.query(OCRResult)
        .filter(OCRResult.manuscript_id == id)
        .order_by(desc(OCRResult.created_at))
        .first()
    )

    now = datetime.now(timezone.utc)
    if not latest_trans:
        source_text = (
            (ocr_result.selected_text or ocr_result.enhanced_image_text or ocr_result.original_image_text)
            if ocr_result else ""
        )
        latest_trans = TranslationResult(
            manuscript_id=id,
            ocr_result_id=ocr_result.id if ocr_result else None,
            source_text=source_text,
            translated_text=req.corrected_translation,
            original_translation=None,
            source_language=manuscript.source_language or "mal",
            target_language="en",
            translation_mode="scholarly_manual",
            translation_model="human_scholar",
            model_version="1.0",
            transcription_version=1,
            status="completed",
            is_edited=True,
            editor=req.reviewer or current_user.full_name,
            editor_notes=req.notes,
            created_at=now,
            updated_at=now,
        )
        db.add(latest_trans)
    else:
        if not latest_trans.is_edited:
            latest_trans.original_translation = latest_trans.translated_text
        latest_trans.translated_text = req.corrected_translation
        latest_trans.is_edited = True
        latest_trans.status = "completed"
        latest_trans.editor = req.reviewer or current_user.full_name
        latest_trans.editor_notes = req.notes
        latest_trans.updated_at = now

    manuscript.updated_at = now
    db.commit()
    db.refresh(latest_trans)

    return success_response(
        data={
            "manuscript_id": id,
            "source_text": latest_trans.source_text,
            "translated_text": latest_trans.translated_text,
            "original_translation": latest_trans.original_translation,
            "translation_model": latest_trans.translation_model,
            "status": latest_trans.status,
            "is_edited": latest_trans.is_edited,
            "editor": latest_trans.editor,
            "editor_notes": latest_trans.editor_notes,
            "transcription_version": latest_trans.transcription_version,
            "updated_at": latest_trans.updated_at.isoformat(),
        },
        message="Translation saved successfully",
    )
