"""Job processing service – background task execution, stage tracking, and pipeline orchestration with real-time SSE events."""

import asyncio
import json
import logging
import traceback
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

import cv2
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    Manuscript,
    ProcessingJob,
    ImageResult,
    OCRResult,
    TranslationResult,
)
from app.services.image_processing import ImageProcessingService
from app.services.damage_detection import DamageDetectionService
from app.services.condition_analysis_service import ConditionAnalysisService
from app.services.ocr_service import OCRService
from app.services.confidence_service import ConfidenceService
from app.services.translation_service import TranslationService
from app.services.cultural_intelligence_service import CulturalIntelligenceService
from app.services.heritage_record_service import HeritageRecordService
from app.config import get_settings

logger = logging.getLogger("akshararecover.job_service")


class JobBroadcaster:
    """In-memory event broadcaster for Server-Sent Events (SSE)."""

    _subscribers: Dict[str, List[asyncio.Queue]] = defaultdict(list)
    _history: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    @classmethod
    def subscribe(cls, job_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        cls._subscribers[job_id].append(q)
        for evt in cls._history[job_id]:
            q.put_nowait(evt)
        return q

    @classmethod
    def unsubscribe(cls, job_id: str, q: asyncio.Queue):
        if job_id in cls._subscribers and q in cls._subscribers[job_id]:
            cls._subscribers[job_id].remove(q)
            if not cls._subscribers[job_id]:
                del cls._subscribers[job_id]

    @classmethod
    def publish(cls, job_id: str, event_type: str, data: Dict[str, Any]):
        data["event_type"] = event_type
        data["timestamp"] = datetime.now(timezone.utc).isoformat()
        cls._history[job_id].append(data)
        subscribers = list(cls._subscribers.get(job_id, []))
        for q in subscribers:
            try:
                q.put_nowait(data)
            except Exception:
                pass


class JobService:
    """Manages processing jobs, executes the asynchronous pipeline, and broadcasts SSE events."""

    @staticmethod
    def create_job(
        db: Session,
        manuscript_id: str,
        job_type: str = "processing",
        user_id: Optional[str] = None,
    ) -> ProcessingJob:
        now = datetime.now(timezone.utc)
        job = ProcessingJob(
            manuscript_id=manuscript_id,
            user_id=user_id,
            job_type=job_type,
            status="pending",
            current_stage="queued",
            progress=0,
            message="Processing job queued",
            created_at=now,
            updated_at=now,
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        JobBroadcaster.publish(job.id, "job.started", {
            "job_id": job.id,
            "manuscript_id": manuscript_id,
            "status": "pending",
            "stage": "queued",
            "progress": 0,
            "message": "Processing job queued",
        })
        return job

    @staticmethod
    def get_job(db: Session, job_id: str) -> Optional[ProcessingJob]:
        return db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()

    @staticmethod
    def update_job_stage(
        db: Session,
        job: ProcessingJob,
        status: str,
        stage: str,
        progress: int,
        message: Optional[str] = None,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None,
        artifacts: Optional[Dict[str, Any]] = None,
    ):
        now = datetime.now(timezone.utc)
        job.status = status
        job.current_stage = stage
        job.progress = progress
        job.message = message or job.message
        job.error_code = error_code
        job.error_message = error_message
        job.updated_at = now

        if status == "processing" and not job.started_at:
            job.started_at = now
        elif status in ("completed", "failed"):
            job.completed_at = now

        db.commit()
        db.refresh(job)

        event_name = (
            "job.completed" if status == "completed"
            else "stage.failed" if status == "failed"
            else "stage.progress"
        )
        JobBroadcaster.publish(job.id, event_name, {
            "job_id": job.id,
            "manuscript_id": job.manuscript_id,
            "status": status,
            "stage": stage,
            "progress": progress,
            "message": message or job.message,
            "error_code": error_code,
            "error_message": error_message,
            "artifacts": artifacts or {},
        })

    @classmethod
    def execute_pipeline(
        cls,
        job_id: str,
        manuscript_id: str,
        enhancement_enabled: bool = True,
        ocr_enabled: bool = True,
        compare_original: bool = True,
        source_language: str = "en",
        source_script: Optional[str] = None,
    ):
        """Execute full manuscript processing journey."""
        db_gen = get_db()
        db: Session = next(db_gen)

        settings = get_settings()
        image_service = ImageProcessingService()
        damage_service = DamageDetectionService()
        ocr_service = OCRService()
        confidence_service = ConfidenceService()

        try:
            job = cls.get_job(db, job_id)
            if not job:
                logger.error("Job %s not found in background task", job_id)
                return

            manuscript = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
            if not manuscript:
                cls.update_job_stage(
                    db, job, "failed", "failed", job.progress,
                    message="Manuscript not found",
                    error_code="MANUSCRIPT_NOT_FOUND",
                    error_message=f"Manuscript {manuscript_id} does not exist.",
                )
                return

            manuscript.status = "processing"
            if source_language and not manuscript.source_language:
                manuscript.source_language = source_language
            if source_script and not manuscript.source_script:
                manuscript.source_script = source_script
            db.commit()

            # STAGE 01: MANUSCRIPT UPLOAD & INTEGRITY
            cls.update_job_stage(
                db, job, "processing", "upload_validation", 10,
                message="Verifying uploaded file integrity and format",
                artifacts={"original_filename": manuscript.original_filename},
            )

            originals_dir = settings.upload_originals_dir
            page_paths = []
            for p in range(1, manuscript.page_count + 1):
                page_img_path = originals_dir / f"{manuscript.id}_page_{p}.png"
                if page_img_path.exists():
                    page_paths.append((p, str(page_img_path)))

            if not page_paths:
                orig_file = Path(manuscript.original_file_path)
                if orig_file.exists() and orig_file.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"):
                    page_paths.append((1, str(orig_file)))

            if not page_paths:
                raise ValueError("No valid manuscript page images found to process.")

            all_page_texts_orig = []
            all_page_texts_enh = []

            for page_num, img_path in page_paths:
                # STAGE 02: INITIAL CONDITION ANALYSIS
                cls.update_job_stage(
                    db, job, "processing", "condition_analysis", 20,
                    message=f"Measuring physical condition and optical metrics for page {page_num}",
                )
                condition_data = ConditionAnalysisService.analyze_condition(img_path)
                img_width = condition_data["measured_metrics"]["resolution"]["width"]
                img_height = condition_data["measured_metrics"]["resolution"]["height"]

                # STAGE 03: IMAGE ENHANCEMENT
                cls.update_job_stage(
                    db, job, "processing", "image_enhancement", 35,
                    message=f"Applying OpenCV adaptive filtering & intermediate layers for page {page_num}",
                )
                if enhancement_enabled:
                    enh_res = image_service.enhance_image(img_path, output_dir=str(settings.upload_processed_dir))
                    enhanced_path = enh_res["enhanced_image_path"]
                    enhancement_method = enh_res["enhancement_method"]
                    quality_before = enh_res["quality_before"]
                    quality_after = enh_res["quality_after"]
                    intermediate_images = enh_res["intermediate_images"]
                    proc_time = enh_res["processing_time"]
                else:
                    raw_img = cv2.imread(img_path)
                    measured = image_service.measure_quality(raw_img) if raw_img is not None else {}
                    enhanced_path = img_path
                    enhancement_method = "none"
                    quality_before = measured
                    quality_after = measured
                    intermediate_images = {}
                    proc_time = 0.0

                # STAGE 04: DAMAGE IDENTIFICATION (MASK & OVERLAY)
                cls.update_job_stage(
                    db, job, "processing", "damage_analysis", 50,
                    message=f"Generating damage mask, Hough linear cracks, and overlay for page {page_num}",
                )
                damage_res = damage_service.analyse(
                    img_path, output_dir=str(settings.upload_processed_dir)
                )
                damage_pct = damage_res.get("damage_area_percentage", 0.0)

                damage_payload = {
                    "indicators": damage_res.get("damage_indicators"),
                    "detected_regions": damage_res.get("detected_regions"),
                    "mask_path": damage_res.get("mask_path"),
                    "overall_damage_ratio": damage_pct,
                    "damage_area_percentage": damage_pct,
                    "image_width": img_width,
                    "image_height": img_height,
                }

                img_res = db.query(ImageResult).filter(
                    ImageResult.manuscript_id == manuscript_id,
                    ImageResult.page_number == page_num,
                ).first()

                if not img_res:
                    img_res = ImageResult(
                        manuscript_id=manuscript_id,
                        page_number=page_num,
                        original_image_path=img_path,
                        enhanced_image_path=enhanced_path,
                        damage_overlay_path=damage_res.get("overlay_path"),
                        enhancement_method=enhancement_method,
                        image_width=img_width,
                        image_height=img_height,
                        quality_metrics={
                            "before": quality_before,
                            "after": quality_after,
                            "condition_analysis": condition_data,
                            "intermediate_images": intermediate_images,
                        },
                        damage_indicators=damage_payload,
                        processing_time=proc_time,
                    )
                    db.add(img_res)
                else:
                    img_res.enhanced_image_path = enhanced_path
                    img_res.damage_overlay_path = damage_res.get("overlay_path")
                    img_res.enhancement_method = enhancement_method
                    img_res.image_width = img_width
                    img_res.image_height = img_height
                    img_res.quality_metrics = {
                        "before": quality_before,
                        "after": quality_after,
                        "condition_analysis": condition_data,
                        "intermediate_images": intermediate_images,
                    }
                    img_res.damage_indicators = damage_payload
                    img_res.processing_time = proc_time

                db.commit()
                db.refresh(img_res)

                # STAGE 05: OCR RECOGNITION (ORIGINAL & ENHANCED)
                orig_ocr_text = ""
                enh_ocr_text = ""
                engine_name = None
                model_name = None
                orig_lines = []
                enh_lines = []

                if ocr_enabled:
                    if compare_original:
                        cls.update_job_stage(
                            db, job, "processing", "ocr_original", 65,
                            message=f"Running baseline OCR on original page {page_num}",
                        )
                        orig_ocr_res = ocr_service.process_image(img_path, language=source_language)
                        orig_ocr_text = orig_ocr_res.get("full_text", "")
                        orig_lines = orig_ocr_res.get("lines", [])
                        engine_name = orig_ocr_res.get("engine")
                        model_name = orig_ocr_res.get("model_name")

                    cls.update_job_stage(
                        db, job, "processing", "ocr_enhanced", 78,
                        message=f"Running OCR on enhanced page {page_num}",
                    )
                    enh_ocr_res = ocr_service.process_image(enhanced_path, language=source_language)
                    enh_ocr_text = enh_ocr_res.get("full_text", "")
                    enh_lines = enh_ocr_res.get("lines", [])
                    engine_name = enh_ocr_res.get("engine") or engine_name
                    model_name = enh_ocr_res.get("model_name") or model_name

                # Prefer enhanced OCR lines for primary Stage 03 display & confidence analysis
                primary_lines = enh_lines if enh_lines else orig_lines

                # STAGE 06: OCR COMPARISON & CONFIDENCE
                cls.update_job_stage(
                    db, job, "processing", "ocr_comparison", 85,
                    message=f"Evaluating recognition confidence and flagging uncertain glyphs for page {page_num}",
                )
                conf_analysis = confidence_service.analyse(primary_lines)
                conf_summary = conf_analysis.get("confidence_summary", {})
                if orig_lines:
                    orig_conf_analysis = confidence_service.analyse(orig_lines)
                    conf_summary["original_comparison"] = orig_conf_analysis.get("confidence_summary", {})

                selected_text = enh_ocr_text if enh_ocr_text.strip() else orig_ocr_text

                serialized_regions = [
                    {
                        "line": l.get("text", ""),
                        "text": l.get("text", ""),
                        "box": l.get("bounding_box"),
                        "bounding_box": l.get("bounding_box"),
                        "confidence": l.get("confidence"),
                        "is_uncertain": bool(l.get("is_uncertain", False)),
                    }
                    for l in primary_lines
                ]

                ocr_rec = db.query(OCRResult).filter(
                    OCRResult.manuscript_id == manuscript_id,
                    OCRResult.page_number == page_num,
                ).first()

                if not ocr_rec:
                    ocr_rec = OCRResult(
                        manuscript_id=manuscript_id,
                        image_result_id=img_res.id,
                        page_number=page_num,
                        ocr_engine=engine_name,
                        model_name=model_name,
                        source_language=source_language,
                        original_image_text=orig_ocr_text,
                        enhanced_image_text=enh_ocr_text,
                        selected_text=selected_text,
                        confidence_summary=conf_summary,
                        text_regions=serialized_regions,
                        uncertain_regions=conf_analysis.get("uncertain_regions", []),
                    )
                    db.add(ocr_rec)
                else:
                    ocr_rec.ocr_engine = engine_name
                    ocr_rec.model_name = model_name
                    ocr_rec.source_language = source_language
                    ocr_rec.original_image_text = orig_ocr_text
                    ocr_rec.enhanced_image_text = enh_ocr_text
                    ocr_rec.selected_text = selected_text
                    ocr_rec.confidence_summary = conf_summary
                    ocr_rec.text_regions = serialized_regions
                    ocr_rec.uncertain_regions = conf_analysis.get("uncertain_regions", [])

                db.commit()
                all_page_texts_orig.append(orig_ocr_text)
                all_page_texts_enh.append(enh_ocr_text)

            # STAGE 08: ENGLISH TRANSLATION (AUTOMATED ATTEMPT IF AVAILABLE)
            cls.update_job_stage(
                db, job, "processing", "english_translation", 88,
                message="Checking translation engine availability for extracted text",
            )
            try:
                trans_service = TranslationService()
                combined_src = (
                    "\n".join(t for t in all_page_texts_enh if t.strip())
                    or "\n".join(t for t in all_page_texts_orig if t.strip())
                )
                if combined_src.strip() and trans_service.is_engine_available():
                    trans_res = trans_service.translate_text(
                        text=combined_src,
                        src_lang=source_language,
                        tgt_lang="en",
                        mode="contextual",
                    )
                    existing_trans = db.query(TranslationResult).filter(
                        TranslationResult.manuscript_id == manuscript_id
                    ).first()
                    now = datetime.now(timezone.utc)
                    if not existing_trans:
                        existing_trans = TranslationResult(
                            manuscript_id=manuscript_id,
                            source_text=combined_src,
                            translated_text=trans_res.get("translated_text", ""),
                            source_language=source_language,
                            target_language="en",
                            translation_mode="contextual",
                            translation_model=trans_res.get("translation_model", "facebook/nllb-200-distilled-600M"),
                            model_version=trans_res.get("model_version", "1.0"),
                            status="completed",
                            created_at=now,
                            updated_at=now,
                        )
                        db.add(existing_trans)
                    else:
                        existing_trans.source_text = combined_src
                        existing_trans.translated_text = trans_res.get("translated_text", "")
                        existing_trans.status = "completed"
                        existing_trans.updated_at = now
                    db.commit()
            except Exception as trans_err:
                logger.warning("Automated translation step skipped: %s", trans_err)

            # STAGE 09: CULTURAL INTELLIGENCE EXTRACTION
            cls.update_job_stage(
                db, job, "processing", "cultural_extraction", 92,
                message="Extracting cultural references grounded in manuscript corpus",
            )
            CulturalIntelligenceService.extract_cultural_entities(db, manuscript_id)

            # STAGE 10 & 12: KNOWLEDGE GRAPH & HERITAGE RECORD
            cls.update_job_stage(
                db, job, "processing", "heritage_record", 96,
                message="Generating Digital Heritage Record & QR verification passport",
            )
            HeritageRecordService.get_or_create_record(db, manuscript_id, user_id=manuscript.user_id)

            # Finalize
            manuscript.status = "processed"
            manuscript.updated_at = datetime.now(timezone.utc)
            db.commit()

            cls.update_job_stage(
                db, job, "completed", "completed", 100,
                message="All pipeline stages completed successfully. Ready for scholarly review.",
            )
            logger.info("Pipeline completed successfully for manuscript %s", manuscript_id)

        except Exception as exc:
            logger.error("Job %s pipeline error: %s\n%s", job_id, exc, traceback.format_exc())
            job = cls.get_job(db, job_id)
            if job:
                cls.update_job_stage(
                    db, job, "failed", "failed", job.progress,
                    message="An error occurred during manuscript processing",
                    error_code="PIPELINE_ERROR",
                    error_message=str(exc),
                )
            manuscript = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
            if manuscript:
                manuscript.status = "failed"
                manuscript.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            try:
                db.close()
            except Exception:
                pass
