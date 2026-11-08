"""Archive service – manuscript listing, querying, full-text search, details retrieval, and archival export."""

import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Session

from app.database.models import (
    Manuscript,
    ProcessingJob,
    ImageResult,
    OCRResult,
    TranslationResult,
    TranscriptionCorrection,
    VerificationRecord,
    HeritageRecord,
    CulturalEntity,
)
from app.config import get_settings
from app.services.heritage_record_service import HeritageRecordService
from app.utils.errors import NotFoundError

logger = logging.getLogger("akshararecover.archive_service")


def _existing_file_url(category: str, path_or_filename: Optional[str]) -> Optional[str]:
    """Return `/api/files/{category}/{filename}` only if the file actually exists on disk."""
    if not path_or_filename:
        return None
    fn = path_or_filename.replace("\\", "/").split("/")[-1]
    if not fn:
        return None
    settings = get_settings()
    dir_map = {
        "originals": settings.upload_originals_dir,
        "previews": settings.upload_previews_dir,
        "processed": settings.upload_processed_dir,
    }
    target_dir = dir_map.get(category)
    if target_dir and (target_dir / fn).exists():
        return f"/api/files/{category}/{fn}"
    return None


class ArchiveService:
    """Manages digital archive retrieval, user-scoped library filtering, cross-field searching, and dossier export."""

    @staticmethod
    def _derive_processing_status(manuscript: Manuscript, latest_job: Optional[ProcessingJob]) -> str:
        """Normalize manuscript & job status into clear library categories: completed, processing, failed, uploaded."""
        if latest_job:
            if latest_job.status == "failed" or manuscript.status == "failed":
                return "failed"
            if latest_job.status in ("pending", "processing") or manuscript.status == "processing":
                return "processing"
            if latest_job.status == "completed":
                return "completed"
        if manuscript.status in ("processed", "verified", "completed"):
            return "completed"
        if manuscript.status == "failed":
            return "failed"
        if manuscript.status == "processing":
            return "processing"
        return "uploaded"

    @classmethod
    def list_manuscripts(
        cls,
        db: Session,
        user_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        source_language: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "newest",
    ) -> dict:
        query = db.query(Manuscript)

        if user_id is not None:
            query = query.filter(Manuscript.user_id == user_id)

        if source_language and source_language.lower() != "all":
            query = query.filter(Manuscript.source_language == source_language)

        if search and search.strip():
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Manuscript.title.ilike(search_pattern),
                    Manuscript.id.ilike(search_pattern),
                    Manuscript.original_filename.ilike(search_pattern),
                    Manuscript.description.ilike(search_pattern),
                )
            )

        if status and status.lower() != "all":
            st = status.lower().strip()
            if st == "completed":
                query = query.filter(Manuscript.status.in_(["processed", "verified", "completed"]))
            elif st == "processing":
                query = query.filter(Manuscript.status.in_(["processing", "uploaded", "pending"]))
            elif st == "failed":
                query = query.filter(Manuscript.status == "failed")
            else:
                query = query.filter(Manuscript.status == status)

        order_clause = asc(Manuscript.created_at) if sort == "oldest" else desc(Manuscript.created_at)

        total = query.count()
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        offset = max(0, (page - 1) * page_size)

        manuscripts = query.order_by(order_clause).offset(offset).limit(page_size).all()

        items = []
        for m in manuscripts:
            latest_v = (
                db.query(VerificationRecord)
                .filter(VerificationRecord.manuscript_id == m.id)
                .order_by(desc(VerificationRecord.created_at))
                .first()
            )
            latest_job = (
                db.query(ProcessingJob)
                .filter(ProcessingJob.manuscript_id == m.id)
                .order_by(desc(ProcessingJob.created_at))
                .first()
            )
            first_img = (
                db.query(ImageResult)
                .filter(ImageResult.manuscript_id == m.id)
                .order_by(asc(ImageResult.page_number))
                .first()
            )
            heritage = (
                db.query(HeritageRecord)
                .filter(HeritageRecord.manuscript_id == m.id)
                .first()
            )

            preview_url = _existing_file_url("previews", m.preview_path)

            orig_img_url = preview_url
            if not orig_img_url and m.stored_filename and not m.stored_filename.lower().endswith(".pdf"):
                orig_img_url = _existing_file_url("originals", m.stored_filename)
            enh_img_url = None
            overlay_img_url = None

            if first_img:
                if first_img.original_image_path:
                    orig_img_url = _existing_file_url("originals", first_img.original_image_path) or preview_url
                if first_img.enhanced_image_path:
                    enh_img_url = _existing_file_url("processed", first_img.enhanced_image_path)
                if first_img.damage_overlay_path:
                    overlay_img_url = _existing_file_url("processed", first_img.damage_overlay_path)

            proc_status = cls._derive_processing_status(m, latest_job)

            items.append({
                "id": m.id,
                "user_id": m.user_id,
                "title": m.title or m.original_filename,
                "description": m.description,
                "original_filename": m.original_filename,
                "file_type": m.file_type,
                "source_language": m.source_language,
                "source_script": m.source_script,
                "historical_period": m.historical_period,
                "region": m.region,
                "page_count": m.page_count,
                "status": m.status,
                "processing_status": proc_status,
                "active_job_id": latest_job.id if latest_job else None,
                "job_progress": latest_job.progress if latest_job else (100 if proc_status == "completed" else 0),
                "verification_status": latest_v.verification_status if latest_v else None,
                "preview_url": preview_url or orig_img_url,
                "original_image_url": orig_img_url,
                "enhanced_image_url": enh_img_url,
                "damage_overlay_url": overlay_img_url,
                "has_heritage_record": heritage is not None,
                "heritage_slug": heritage.unique_slug if heritage else None,
                "heritage_visibility": heritage.visibility if heritage else "PRIVATE",
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "updated_at": m.updated_at.isoformat() if m.updated_at else None,
                "completed_at": (
                    latest_job.completed_at.isoformat()
                    if (latest_job and latest_job.completed_at)
                    else (m.updated_at.isoformat() if proc_status == "completed" and m.updated_at else None)
                ),
            })

        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
            },
        }

    @classmethod
    def get_manuscript(cls, db: Session, manuscript_id: str) -> dict:
        m = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
        if not m:
            raise NotFoundError(f"Manuscript with ID '{manuscript_id}' not found.")

        latest_job = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.manuscript_id == manuscript_id)
            .order_by(desc(ProcessingJob.created_at))
            .first()
        )
        latest_v = (
            db.query(VerificationRecord)
            .filter(VerificationRecord.manuscript_id == manuscript_id)
            .order_by(desc(VerificationRecord.created_at))
            .first()
        )
        heritage = (
            db.query(HeritageRecord)
            .filter(HeritageRecord.manuscript_id == manuscript_id)
            .first()
        )

        preview_url = _existing_file_url("previews", m.preview_path)

        proc_status = cls._derive_processing_status(m, latest_job)

        return {
            "id": m.id,
            "user_id": m.user_id,
            "title": m.title or m.original_filename,
            "description": m.description,
            "original_filename": m.original_filename,
            "file_type": m.file_type,
            "source_language": m.source_language,
            "source_script": m.source_script,
            "historical_period": m.historical_period,
            "region": m.region,
            "page_count": m.page_count,
            "status": m.status,
            "preview_url": preview_url,
            "processing_status": proc_status,
            "active_job_id": latest_job.id if latest_job else None,
            "job_progress": latest_job.progress if latest_job else (100 if proc_status == "completed" else 0),
            "verification_status": latest_v.verification_status if latest_v else None,
            "has_heritage_record": heritage is not None,
            "heritage_slug": heritage.unique_slug if heritage else None,
            "heritage_visibility": heritage.visibility if heritage else "PRIVATE",
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "updated_at": m.updated_at.isoformat() if m.updated_at else None,
            "completed_at": (
                latest_job.completed_at.isoformat()
                if (latest_job and latest_job.completed_at)
                else (m.updated_at.isoformat() if proc_status == "completed" and m.updated_at else None)
            ),
        }

    @staticmethod
    def get_full_results(db: Session, manuscript_id: str) -> dict:
        m = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
        if not m:
            raise NotFoundError(f"Manuscript with ID '{manuscript_id}' not found.")

        latest_job = (
            db.query(ProcessingJob)
            .filter(ProcessingJob.manuscript_id == manuscript_id)
            .order_by(desc(ProcessingJob.created_at))
            .first()
        )

        image_results = (
            db.query(ImageResult)
            .filter(ImageResult.manuscript_id == manuscript_id)
            .order_by(ImageResult.page_number)
            .all()
        )
        images_data = []
        for img in image_results:
            orig_fn = img.original_image_path.replace("\\", "/").split("/")[-1]
            enh_fn = img.enhanced_image_path.replace("\\", "/").split("/")[-1] if img.enhanced_image_path else None
            overlay_fn = img.damage_overlay_path.replace("\\", "/").split("/")[-1] if img.damage_overlay_path else None

            images_data.append({
                "page_number": img.page_number,
                "original_image_url": f"/api/files/originals/{orig_fn}",
                "enhanced_image_url": f"/api/files/processed/{enh_fn}" if enh_fn else None,
                "damage_overlay_url": f"/api/files/processed/{overlay_fn}" if overlay_fn else None,
                "image_width": img.image_width,
                "image_height": img.image_height,
                "enhancement_method": img.enhancement_method,
                "processing_time": img.processing_time,
                "quality_metrics": img.quality_metrics or {},
                "damage_indicators": img.damage_indicators or {},
            })

        ocr_result = (
            db.query(OCRResult)
            .filter(OCRResult.manuscript_id == manuscript_id)
            .order_by(desc(OCRResult.created_at))
            .first()
        )
        latest_corr = (
            db.query(TranscriptionCorrection)
            .filter(TranscriptionCorrection.manuscript_id == manuscript_id)
            .order_by(desc(TranscriptionCorrection.version_number))
            .first()
        )
        ocr_data = None
        if ocr_result:
            ocr_data = {
                "original_text": ocr_result.original_image_text,
                "enhanced_text": ocr_result.enhanced_image_text,
                "selected_text": ocr_result.selected_text,
                "is_human_corrected": latest_corr is not None,
                "transcription_version": latest_corr.version_number if latest_corr else 1,
                "reviewer": latest_corr.reviewer if latest_corr else None,
                "correction_notes": latest_corr.notes if latest_corr else None,
                "engine": ocr_result.ocr_engine,
                "model": ocr_result.model_name,
                "source_language": ocr_result.source_language,
                "confidence_summary": ocr_result.confidence_summary or {},
                "text_regions": ocr_result.text_regions or [],
                "uncertain_regions": ocr_result.uncertain_regions or [],
            }

        trans_result = (
            db.query(TranslationResult)
            .filter(TranslationResult.manuscript_id == manuscript_id)
            .order_by(desc(TranslationResult.created_at))
            .first()
        )
        trans_data = None
        if trans_result:
            trans_data = {
                "source_text": trans_result.source_text,
                "translated_text": trans_result.translated_text,
                "original_translation": trans_result.original_translation,
                "source_language": trans_result.source_language,
                "target_language": trans_result.target_language,
                "translation_mode": trans_result.translation_mode,
                "model": trans_result.translation_model,
                "translation_model": trans_result.translation_model,
                "model_version": trans_result.model_version,
                "status": trans_result.status,
                "is_edited": bool(trans_result.is_edited),
                "editor": trans_result.editor,
                "editor_notes": trans_result.editor_notes,
                "transcription_version": trans_result.transcription_version,
                "uncertainty_notes": trans_result.uncertainty_notes or [],
                "updated_at": trans_result.updated_at.isoformat() if trans_result.updated_at else None,
            }

        return {
            "manuscript_id": m.id,
            "title": m.title or m.original_filename,
            "description": m.description,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "completed_at": (
                latest_job.completed_at.isoformat()
                if (latest_job and latest_job.completed_at)
                else (m.updated_at.isoformat() if m.updated_at else None)
            ),
            "images": images_data,
            "ocr": ocr_data,
            "translation": trans_data,
        }

    @classmethod
    def export_manuscript_dossier(cls, db: Session, manuscript_id: str) -> dict:
        """Assemble a complete downloadable archival JSON dossier for a manuscript."""
        meta = cls.get_manuscript(db, manuscript_id)
        results = cls.get_full_results(db, manuscript_id)
        heritage = HeritageRecordService.get_or_create_record(db, manuscript_id)
        entities = db.query(CulturalEntity).filter(CulturalEntity.manuscript_id == manuscript_id).all()

        return {
            "schema_version": "1.0",
            "archive": "AKSHARARECOVER AI — THE LIVING ARCHIVE (SCRIPTORIA)",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "manuscript": meta,
            "processing_results": results,
            "digital_heritage_record": heritage,
            "cultural_entities": [
                {
                    "id": e.id,
                    "canonical_name": e.canonical_name,
                    "category": e.category,
                    "description": e.description,
                    "english_explanation": e.english_explanation,
                    "source_excerpt": e.source_excerpt,
                }
                for e in entities
            ],
        }

    @staticmethod
    def get_comparisons(db: Session, manuscript_id: str) -> dict:
        m = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
        if not m:
            raise NotFoundError(f"Manuscript with ID '{manuscript_id}' not found.")

        image_results = (
            db.query(ImageResult)
            .filter(ImageResult.manuscript_id == manuscript_id)
            .order_by(ImageResult.page_number)
            .all()
        )

        pages = []
        for img in image_results:
            ocr = (
                db.query(OCRResult)
                .filter(OCRResult.manuscript_id == manuscript_id, OCRResult.page_number == img.page_number)
                .first()
            )
            orig_fn = img.original_image_path.replace("\\", "/").split("/")[-1]
            enh_fn = img.enhanced_image_path.replace("\\", "/").split("/")[-1] if img.enhanced_image_path else None
            overlay_fn = img.damage_overlay_path.replace("\\", "/").split("/")[-1] if img.damage_overlay_path else None

            pages.append({
                "page_number": img.page_number,
                "original_image_url": f"/api/files/originals/{orig_fn}",
                "enhanced_image_url": f"/api/files/processed/{enh_fn}" if enh_fn else None,
                "damage_overlay_url": f"/api/files/processed/{overlay_fn}" if overlay_fn else None,
                "original_ocr_text": ocr.original_image_text if ocr else None,
                "enhanced_ocr_text": ocr.enhanced_image_text if ocr else None,
                "quality_metrics": img.quality_metrics or {},
            })

        return {
            "manuscript_id": m.id,
            "pages": pages,
        }

    @staticmethod
    def search_archive(
        db: Session,
        query_str: str,
        user_id: Optional[str] = None,
    ) -> list[dict]:
        if not query_str or not query_str.strip():
            return []

        pattern = f"%{query_str.strip()}%"
        matches = []

        # 1. Manuscripts table
        mans_query = db.query(Manuscript).filter(
            or_(
                Manuscript.title.ilike(pattern),
                Manuscript.original_filename.ilike(pattern),
                Manuscript.id.ilike(pattern),
                Manuscript.description.ilike(pattern),
            )
        )
        if user_id is not None:
            mans_query = mans_query.filter(Manuscript.user_id == user_id)

        for m in mans_query.all():
            matches.append({
                "manuscript_id": m.id,
                "title": m.title,
                "match_type": "title_or_filename",
                "matched_field": "title",
                "snippet": f"Filename: {m.original_filename}",
            })

        # 2. OCR results
        ocr_query = (
            db.query(OCRResult)
            .join(Manuscript, Manuscript.id == OCRResult.manuscript_id)
            .filter(
                or_(
                    OCRResult.original_image_text.ilike(pattern),
                    OCRResult.enhanced_image_text.ilike(pattern),
                    OCRResult.selected_text.ilike(pattern),
                )
            )
        )
        if user_id is not None:
            ocr_query = ocr_query.filter(Manuscript.user_id == user_id)

        for o in ocr_query.all():
            snippet = o.selected_text or o.enhanced_image_text or o.original_image_text or ""
            idx = snippet.lower().find(query_str.lower())
            start = max(0, idx - 40)
            end = min(len(snippet), idx + len(query_str) + 40)
            matches.append({
                "manuscript_id": o.manuscript_id,
                "title": o.manuscript.title if o.manuscript else None,
                "match_type": "ocr_text",
                "matched_field": "transcription",
                "snippet": f"...{snippet[start:end]}...",
            })

        # 3. Corrections
        corr_query = (
            db.query(TranscriptionCorrection)
            .join(Manuscript, Manuscript.id == TranscriptionCorrection.manuscript_id)
            .filter(TranscriptionCorrection.corrected_text.ilike(pattern))
        )
        if user_id is not None:
            corr_query = corr_query.filter(Manuscript.user_id == user_id)

        for c in corr_query.all():
            idx = c.corrected_text.lower().find(query_str.lower())
            start = max(0, idx - 40)
            end = min(len(c.corrected_text), idx + len(query_str) + 40)
            matches.append({
                "manuscript_id": c.manuscript_id,
                "title": c.manuscript.title if c.manuscript else None,
                "match_type": "corrected_transcription",
                "matched_field": "correction",
                "snippet": f"...{c.corrected_text[start:end]}...",
            })

        # 4. Translations
        trans_query = (
            db.query(TranslationResult)
            .join(Manuscript, Manuscript.id == TranslationResult.manuscript_id)
            .filter(
                or_(
                    TranslationResult.translated_text.ilike(pattern),
                    TranslationResult.source_text.ilike(pattern),
                )
            )
        )
        if user_id is not None:
            trans_query = trans_query.filter(Manuscript.user_id == user_id)

        for t in trans_query.all():
            full = t.translated_text or ""
            idx = full.lower().find(query_str.lower())
            start = max(0, idx - 40)
            end = min(len(full), idx + len(query_str) + 40)
            matches.append({
                "manuscript_id": t.manuscript_id,
                "title": t.manuscript.title if t.manuscript else None,
                "match_type": "translation_text",
                "matched_field": "translation",
                "snippet": f"...{full[start:end]}...",
            })

        return matches
