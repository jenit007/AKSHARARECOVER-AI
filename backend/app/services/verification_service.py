"""Verification service – human verification records and auditing."""

import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.database.models import VerificationRecord, Manuscript, TranscriptionCorrection, TranslationResult
from app.utils.errors import NotFoundError, ValidationError

logger = logging.getLogger("akshararecover.verification_service")


class VerificationService:
    """Handles manuscript review, verification status lifecycle and audit records."""

    @staticmethod
    def verify_manuscript(
        db: Session,
        manuscript_id: str,
        verification_status: str,
        reviewer: Optional[str] = None,
        reviewer_notes: Optional[str] = None,
        transcription_version: Optional[int] = None,
        translation_version: Optional[int] = None,
    ) -> VerificationRecord:
        manuscript = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
        if not manuscript:
            raise NotFoundError(f"Manuscript with ID '{manuscript_id}' not found.")

        # Validate that specified transcription_version exists if provided
        if transcription_version is not None:
            if transcription_version > 1:
                correction = db.query(TranscriptionCorrection).filter(
                    TranscriptionCorrection.manuscript_id == manuscript_id,
                    TranscriptionCorrection.version_number == transcription_version,
                ).first()
                if not correction:
                    raise ValidationError(
                        f"Transcription version {transcription_version} does not exist for manuscript {manuscript_id}."
                    )

        # Validate that specified translation_version exists if provided
        if translation_version is not None:
            trans_res = db.query(TranslationResult).filter(
                TranslationResult.manuscript_id == manuscript_id,
                TranslationResult.transcription_version == translation_version,
            ).first()
            if not trans_res and translation_version != 1:
                raise ValidationError(
                    f"Translation linked to transcription version {translation_version} does not exist for manuscript {manuscript_id}."
                )

        now = datetime.now(timezone.utc)
        record = VerificationRecord(
            manuscript_id=manuscript_id,
            transcription_version=transcription_version,
            translation_version=translation_version,
            reviewer=reviewer,
            verification_status=verification_status,
            reviewer_notes=reviewer_notes,
            verified_at=now if verification_status == "verified" else None,
            created_at=now,
        )
        db.add(record)

        # Also update manuscript overall status
        manuscript.status = verification_status
        manuscript.updated_at = now
        db.commit()
        db.refresh(record)

        logger.info(
            "Manuscript %s verification updated to '%s' by %s",
            manuscript_id,
            verification_status,
            reviewer,
        )
        return record

    @staticmethod
    def get_latest_verification(db: Session, manuscript_id: str) -> Optional[VerificationRecord]:
        return (
            db.query(VerificationRecord)
            .filter(VerificationRecord.manuscript_id == manuscript_id)
            .order_by(VerificationRecord.created_at.desc())
            .first()
        )
