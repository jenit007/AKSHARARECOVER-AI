"""Heritage Record and QR Code generation service."""

import logging
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

import qrcode
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.config import get_settings
from app.database.models import (
    Manuscript,
    ProcessingJob,
    ImageResult,
    HeritageRecord,
    HeritageRecordVersion,
    OCRResult,
    TranslationResult,
    VerificationRecord,
    CulturalEntity,
)

logger = logging.getLogger("akshararecover.heritage_record")


class HeritageRecordService:
    """Manages digital heritage records and generates permanent QR verification passports."""

    @classmethod
    def get_or_create_record(
        cls,
        db: Session,
        manuscript_id: str,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retrieve existing heritage record or create a new one with QR code."""
        settings = get_settings()
        manuscript = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
        if not manuscript:
            raise ValueError(f"Manuscript {manuscript_id} not found")

        owner_id = user_id or manuscript.user_id
        record = db.query(HeritageRecord).filter(HeritageRecord.manuscript_id == manuscript_id).first()
        now = datetime.now(timezone.utc)

        # Latest verification status
        ver_rec = (
            db.query(VerificationRecord)
            .filter(VerificationRecord.manuscript_id == manuscript_id)
            .order_by(desc(VerificationRecord.created_at))
            .first()
        )
        pub_status = "APPROVED" if (ver_rec and ver_rec.verification_status == "verified") else "DRAFT"

        # Latest processing job
        latest_job = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.manuscript_id == manuscript_id)
            .order_by(desc(ProcessingJob.created_at))
            .first()
        )

        # Non-guessable slug for new records; preserve existing slug if present
        if record and record.unique_slug:
            slug = record.unique_slug
        else:
            slug = f"heritage-{manuscript_id[:8]}-{secrets.token_hex(4)}"

        public_url = f"/api/public/heritage-records/{slug}"
        frontend_base = settings.PUBLIC_FRONTEND_URL.rstrip("/")
        qr_full_target = f"{frontend_base}/heritage-record/{manuscript_id}?token={slug}"
        passport_backend_url = f"http://{settings.HOST}:{settings.PORT}/passport/{slug}"

        # Generate QR Code image using Heritage Botanical colours
        qr_dir = Path(settings.upload_processed_dir) / "qr_codes"
        qr_dir.mkdir(parents=True, exist_ok=True)
        qr_filename = f"{slug}_qr.png"
        qr_file_path = str(qr_dir / qr_filename)

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=3,
        )
        qr.add_data(qr_full_target)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#101614", back_color="#FEFAE0")
        img.save(qr_file_path)

        # Gather stage artifacts for accurate completeness reporting
        img_res = db.query(ImageResult).filter(ImageResult.manuscript_id == manuscript_id).first()
        ocr = db.query(OCRResult).filter(OCRResult.manuscript_id == manuscript_id).order_by(desc(OCRResult.created_at)).first()
        trans = db.query(TranslationResult).filter(TranslationResult.manuscript_id == manuscript_id).order_by(desc(TranslationResult.created_at)).first()
        entities = db.query(CulturalEntity).filter(CulturalEntity.manuscript_id == manuscript_id).all()

        ocr_text = (ocr.selected_text or ocr.enhanced_image_text or ocr.original_image_text or "") if ocr else ""
        translated_text = (trans.translated_text or "") if trans else ""

        stage_completion = {
            "stage_01_enhancement": bool(img_res and img_res.enhanced_image_path),
            "stage_02_damage": bool(img_res and (img_res.damage_overlay_path or img_res.damage_indicators)),
            "stage_03_ocr": bool(ocr and ocr_text.strip()),
            "stage_04_translation": bool(trans and translated_text.strip()),
            "stage_05_heritage_record": True,
        }
        completed_stages_count = sum(1 for v in stage_completion.values() if v)

        metadata_payload = {
            "manuscript_id": manuscript.id,
            "title": manuscript.title or manuscript.original_filename,
            "description": manuscript.description or f"Digital preservation record for manuscript {manuscript.original_filename}.",
            "original_filename": manuscript.original_filename,
            "source_language": manuscript.source_language,
            "source_script": manuscript.source_script,
            "historical_period": manuscript.historical_period,
            "region": manuscript.region or "Kerala, India",
            "page_count": manuscript.page_count,
            "status": manuscript.status,
            "uploaded_at": manuscript.created_at.isoformat() if manuscript.created_at else None,
            "completed_at": (
                latest_job.completed_at.isoformat()
                if (latest_job and latest_job.completed_at)
                else (manuscript.updated_at.isoformat() if manuscript.updated_at else None)
            ),
            "verified_by": ver_rec.reviewer if ver_rec else None,
            "verification_status": ver_rec.verification_status if ver_rec else "pending",
            "verified_at": ver_rec.verified_at.isoformat() if (ver_rec and ver_rec.verified_at) else None,
            "extracted_entities_count": len(entities),
            "ocr_engine": ocr.ocr_engine if ocr else None,
            "ocr_confidence_summary": ocr.confidence_summary if ocr else None,
            "transcription_text": ocr_text,
            "transcription_snippet": ocr_text[:300],
            "translation_text": translated_text,
            "translation_snippet": translated_text[:300],
            "translation_model": trans.translation_model if trans else None,
            "translation_is_edited": bool(trans.is_edited) if trans else False,
            "stage_completion": stage_completion,
            "completed_stages_count": completed_stages_count,
            "generated_at": now.isoformat(),
        }

        if not record:
            record = HeritageRecord(
                user_id=owner_id,
                manuscript_id=manuscript_id,
                unique_slug=slug,
                title=manuscript.title or manuscript.original_filename,
                description=manuscript.description or f"Permanent digital heritage record for manuscript {manuscript.original_filename}.",
                cultural_category="Historical Manuscript",
                art_form="Palm-Leaf Manuscript Conservation",
                language=manuscript.source_language or "Not specified",
                script=manuscript.source_script or "Not specified",
                region=manuscript.region or "Kerala, India",
                historical_period=manuscript.historical_period or "Not specified",
                qr_code_path=qr_file_path,
                public_url=public_url,
                publication_status=pub_status,
                visibility="PRIVATE",
                version=1,
                metadata_payload=metadata_payload,
                created_at=now,
                updated_at=now,
            )
            db.add(record)
            db.commit()
            db.refresh(record)

            version = HeritageRecordVersion(
                heritage_record_id=record.id,
                version_number=1,
                snapshot_json=metadata_payload,
                change_summary="Initial heritage record generation",
                changed_by="AksharaRecover AI Pipeline",
                created_at=now,
            )
            db.add(version)
            db.commit()
        else:
            if owner_id and not record.user_id:
                record.user_id = owner_id
            record.title = manuscript.title or record.title
            if manuscript.description:
                record.description = manuscript.description
            if manuscript.source_language:
                record.language = manuscript.source_language
            if manuscript.source_script:
                record.script = manuscript.source_script
            if manuscript.region:
                record.region = manuscript.region
            if manuscript.historical_period:
                record.historical_period = manuscript.historical_period
            record.publication_status = pub_status
            record.metadata_payload = metadata_payload
            record.qr_code_path = qr_file_path
            if not record.visibility:
                record.visibility = "PRIVATE"
            record.updated_at = now
            db.commit()
            db.refresh(record)

        qr_api_url = f"/api/files/processed/qr_codes/{qr_filename}"

        return {
            "record_id": record.id,
            "manuscript_id": manuscript.id,
            "user_id": record.user_id,
            "unique_slug": record.unique_slug,
            "title": record.title,
            "description": record.description,
            "publication_status": record.publication_status,
            "visibility": record.visibility or "PRIVATE",
            "is_public": (record.visibility == "PUBLIC"),
            "is_verified": record.publication_status == "APPROVED",
            "version": record.version,
            "language": record.language,
            "script": record.script,
            "region": record.region,
            "historical_period": record.historical_period,
            "public_url": record.public_url,
            "passport_full_url": qr_full_target,
            "passport_backend_url": passport_backend_url,
            "qr_code_url": qr_api_url,
            "metadata": record.metadata_payload,
            "stage_completion": stage_completion,
            "completed_stages_count": completed_stages_count,
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None,
        }

    @classmethod
    def set_visibility(
        cls,
        db: Session,
        manuscript_id: str,
        visibility: str,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update the visibility ('PRIVATE' or 'PUBLIC') of a manuscript's Digital Heritage Record."""
        vis_clean = visibility.strip().upper()
        if vis_clean not in ("PRIVATE", "PUBLIC"):
            raise ValueError("Visibility must be either 'PRIVATE' or 'PUBLIC'.")

        # Ensure record exists first
        cls.get_or_create_record(db, manuscript_id, user_id=user_id)
        record = db.query(HeritageRecord).filter(HeritageRecord.manuscript_id == manuscript_id).first()
        if not record:
            raise ValueError(f"Heritage record for manuscript {manuscript_id} not found.")

        record.visibility = vis_clean
        record.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(record)

        return cls.get_or_create_record(db, manuscript_id, user_id=user_id)
