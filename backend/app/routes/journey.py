"""Manuscript Processing Journey routes – full transparent pipeline endpoints with ownership and visibility guards."""

import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.config import get_settings
from app.database.database import get_db
from app.database.models import (
    User,
    Manuscript,
    ProcessingJob,
    ImageResult,
    OCRResult,
    TranslationResult,
    TranscriptionCorrection,
    VerificationRecord,
    CulturalEntity,
    HeritageRecord,
)
from app.schemas.common import success_response
from app.services.condition_analysis_service import ConditionAnalysisService
from app.services.cultural_intelligence_service import CulturalIntelligenceService
from app.services.heritage_record_service import HeritageRecordService
from app.utils.errors import NotFoundError, AuthorizationError, ValidationError
from app.utils.security import (
    get_current_user,
    get_optional_user,
    verify_manuscript_ownership,
    verify_manuscript_read_access,
)

logger = logging.getLogger("akshararecover.routes.journey")

router = APIRouter(tags=["Manuscript Processing Journey"])


class VisibilityUpdateRequest(BaseModel):
    visibility: str  # "PRIVATE" or "PUBLIC"


@router.get("/api/manuscripts/{id}/processing-timeline")
def get_processing_timeline(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve the comprehensive status of all stages in the manuscript preservation journey."""
    manuscript = verify_manuscript_read_access(db, id, current_user, share_token=token)

    job = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.manuscript_id == id)
        .order_by(desc(ProcessingJob.created_at))
        .first()
    )

    img_res = db.query(ImageResult).filter(ImageResult.manuscript_id == id).first()
    ocr_res = db.query(OCRResult).filter(OCRResult.manuscript_id == id).first()
    trans_res = db.query(TranslationResult).filter(TranslationResult.manuscript_id == id).first()
    ver_res = (
        db.query(VerificationRecord)
        .filter(VerificationRecord.manuscript_id == id)
        .order_by(desc(VerificationRecord.created_at))
        .first()
    )
    entities = db.query(CulturalEntity).filter(CulturalEntity.manuscript_id == id).all()
    heritage = db.query(HeritageRecord).filter(HeritageRecord.manuscript_id == id).first()
    corrections = db.query(TranscriptionCorrection).filter(TranscriptionCorrection.manuscript_id == id).all()

    s1_status = "COMPLETED"
    s2_status = "COMPLETED" if (img_res and (img_res.quality_metrics or manuscript.status == "processed")) else ("IN_PROGRESS" if job and job.status == "processing" else "WAITING")
    s3_status = "COMPLETED" if (img_res and img_res.enhanced_image_path) else ("IN_PROGRESS" if job and job.current_stage == "image_enhancement" else "WAITING")
    s4_status = "COMPLETED" if (img_res and (img_res.damage_indicators or img_res.damage_overlay_path)) else ("IN_PROGRESS" if job and job.current_stage == "damage_analysis" else "WAITING")
    s5_status = "COMPLETED" if (ocr_res and (ocr_res.selected_text or ocr_res.original_image_text or ocr_res.enhanced_image_text)) else ("IN_PROGRESS" if job and "ocr" in (job.current_stage or "") else "WAITING")
    s6_status = "COMPLETED" if (ocr_res and (ocr_res.enhanced_image_text or ocr_res.original_image_text or ocr_res.selected_text)) else "WAITING"
    s7_status = "COMPLETED" if corrections else ("NEEDS_REVIEW" if s5_status == "COMPLETED" else "WAITING")
    s8_status = "COMPLETED" if (trans_res and trans_res.translated_text) else "WAITING"
    s9_status = "COMPLETED" if entities else "WAITING"
    s10_status = "COMPLETED" if entities else "WAITING"
    s11_status = "COMPLETED" if (ver_res and ver_res.verification_status == "verified") else ("NEEDS_REVIEW" if s7_status == "COMPLETED" else "WAITING")
    s12_status = "COMPLETED" if heritage else "WAITING"

    stages = [
        {
            "stage_number": 1,
            "id": "upload",
            "name": "Manuscript Upload",
            "status": s1_status,
            "badge": "ORIGINAL PRESERVED",
            "description": "Original high-resolution manuscript ingested and verified for integrity.",
            "completed_at": manuscript.created_at.isoformat(),
        },
        {
            "stage_number": 2,
            "id": "condition_analysis",
            "name": "Initial Condition Analysis",
            "status": s2_status,
            "badge": "MEASURED METRICS",
            "description": "Deterministic digital signal processing of resolution, brightness, contrast, noise, and blur.",
        },
        {
            "stage_number": 3,
            "id": "enhancement",
            "name": "Image Enhancement",
            "status": s3_status,
            "badge": "OPENCV PIPELINE",
            "description": "Multi-tier non-destructive contrast adjustment (CLAHE), denoising, and edge sharpening.",
        },
        {
            "stage_number": 4,
            "id": "damage_identification",
            "name": "Damage Identification",
            "status": s4_status,
            "badge": "HEURISTIC DETECTION",
            "description": "Segmentation of biological stains, pigment fading, and linear crack artifacts.",
        },
        {
            "stage_number": 5,
            "id": "ocr_recognition",
            "name": "OCR Recognition",
            "status": s5_status,
            "badge": "AI EXTRACTED",
            "description": "Historical script text recognition using CRAFT character detection and sequence modeling.",
        },
        {
            "stage_number": 6,
            "id": "ocr_comparison",
            "name": "OCR Comparison",
            "status": s6_status,
            "badge": "COMPARATIVE AUDIT",
            "description": "Objective difference audit between raw original scan and enhanced image OCR outputs.",
        },
        {
            "stage_number": 7,
            "id": "human_transcription",
            "name": "Human Transcription Review",
            "status": s7_status,
            "badge": "AWAITING HUMAN VERIFICATION" if s7_status == "NEEDS_REVIEW" else "HUMAN CORRECTED",
            "description": "Interactive correction workbench for epigraphists to resolve uncertain readings.",
        },
        {
            "stage_number": 8,
            "id": "english_translation",
            "name": "English Translation",
            "status": s8_status,
            "badge": "AI TRANSLATED" if s8_status == "COMPLETED" else "PENDING",
            "description": "Contextual translation of manuscript transcriptions into English.",
        },
        {
            "stage_number": 9,
            "id": "cultural_intelligence",
            "name": "Cultural Intelligence",
            "status": s9_status,
            "badge": "GROUNDED TAXONOMY",
            "description": "Extraction of cultural references: rituals, art forms, flora, scribal tools, and deities.",
        },
        {
            "stage_number": 10,
            "id": "knowledge_graph",
            "name": "Heritage Knowledge Graph",
            "status": s10_status,
            "badge": "RELATION GRAPH",
            "description": "Interactive semantic network connecting historical concepts and material culture.",
        },
        {
            "stage_number": 11,
            "id": "human_verification",
            "name": "Human Verification",
            "status": s11_status,
            "badge": "EXPERT AUDIT",
            "description": "Dual-track sign-off by accredited researchers and community tradition-bearers.",
        },
        {
            "stage_number": 12,
            "id": "heritage_record",
            "name": "Digital Heritage Record",
            "status": s12_status,
            "badge": "QR LINKED PASSPORT",
            "description": "Permanent digital heritage record with scannable QR verification code.",
        },
    ]

    five_stage_summary = {
        "stage_01_enhancement": s3_status,
        "stage_02_damage": s4_status,
        "stage_03_ocr": s5_status,
        "stage_04_translation": s8_status,
        "stage_05_heritage_record": s12_status,
    }

    return success_response(
        data={
            "manuscript_id": id,
            "title": manuscript.title or manuscript.original_filename,
            "description": manuscript.description,
            "original_filename": manuscript.original_filename,
            "source_language": manuscript.source_language,
            "source_script": manuscript.source_script,
            "historical_period": manuscript.historical_period,
            "region": manuscript.region,
            "page_count": manuscript.page_count,
            "overall_status": manuscript.status,
            "created_at": manuscript.created_at.isoformat() if manuscript.created_at else None,
            "completed_at": (
                job.completed_at.isoformat()
                if (job and job.completed_at)
                else (manuscript.updated_at.isoformat() if manuscript.status in ("processed", "verified") and manuscript.updated_at else None)
            ),
            "active_job": {
                "id": job.id if job else None,
                "status": job.status if job else None,
                "progress": job.progress if job else 100,
                "current_stage": job.current_stage if job else "completed",
                "message": job.message if job else None,
                "error_message": job.error_message if job else None,
            } if job else None,
            "five_stage_summary": five_stage_summary,
            "stages": stages,
        },
        message="Processing timeline retrieved",
    )


@router.get("/api/manuscripts/{id}/condition-analysis")
def get_condition_analysis(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve initial condition and measured optical metrics."""
    manuscript = verify_manuscript_read_access(db, id, current_user, share_token=token)

    img_res = db.query(ImageResult).filter(ImageResult.manuscript_id == id).first()
    if img_res and img_res.quality_metrics and "condition_analysis" in img_res.quality_metrics:
        return success_response(data=img_res.quality_metrics["condition_analysis"], message="Condition analysis retrieved")

    settings = get_settings()
    page_img_path = settings.upload_originals_dir / f"{manuscript.id}_page_1.png"
    if not page_img_path.exists():
        page_img_path = Path(manuscript.original_file_path)

    if not page_img_path.exists():
        raise NotFoundError("Original manuscript image file not found.")

    analysis = ConditionAnalysisService.analyze_condition(str(page_img_path))
    return success_response(data=analysis, message="Initial condition analysis computed")


@router.get("/api/manuscripts/{id}/histogram-comparison")
def get_histogram_comparison(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Compute and retrieve authentic 32-bin intensity histograms comparing original and enhanced images."""
    manuscript = verify_manuscript_read_access(db, id, current_user, share_token=token)

    settings = get_settings()
    import cv2
    import numpy as np

    orig_path = settings.upload_originals_dir / f"{manuscript.id}_page_1.png"
    if not orig_path.exists():
        orig_path = Path(manuscript.original_file_path)

    enh_path = settings.upload_processed_dir / f"{manuscript.id}_page_1_final_enhanced.png"
    if not enh_path.exists():
        enh_path = settings.upload_processed_dir / f"{manuscript.id}_page_1_enhanced.png"

    if not orig_path.exists():
        raise NotFoundError("Original manuscript image file not found.")

    orig_img = cv2.imread(str(orig_path))
    if orig_img is None:
        raise NotFoundError("Could not decode original image.")

    gray_orig = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img

    enh_img = cv2.imread(str(enh_path)) if enh_path.exists() else None
    if enh_img is not None:
        gray_enh = cv2.cvtColor(enh_img, cv2.COLOR_BGR2GRAY) if len(enh_img.shape) == 3 else enh_img
    else:
        clahe = cv2.createCLAHE(clipLimit=2.8, tileGridSize=(8, 8))
        gray_enh = clahe.apply(gray_orig)

    hist_orig = cv2.calcHist([gray_orig], [0], None, [32], [0, 256]).flatten()
    hist_enh = cv2.calcHist([gray_enh], [0], None, [32], [0, 256]).flatten()

    total_orig = float(gray_orig.size) if gray_orig.size > 0 else 1.0
    total_enh = float(gray_enh.size) if gray_enh.size > 0 else 1.0

    bins_data = []
    for i in range(32):
        intensity_val = i * 8 + 4
        orig_pct = round(float((hist_orig[i] / total_orig) * 100), 2)
        enh_pct = round(float((hist_enh[i] / total_enh) * 100), 2)
        bins_data.append({
            "bin": f"{i*8}",
            "intensity": intensity_val,
            "original": orig_pct,
            "enhanced": enh_pct,
        })

    hp_orig = cv2.GaussianBlur(gray_orig, (5, 5), 0)
    noise_orig = float(np.std(gray_orig.astype(float) - hp_orig.astype(float)))
    hp_enh = cv2.GaussianBlur(gray_enh, (5, 5), 0)
    noise_enh = float(np.std(gray_enh.astype(float) - hp_enh.astype(float)))

    return success_response(
        data={
            "manuscript_id": id,
            "histogram": bins_data,
            "metrics": {
                "original": {
                    "mean_brightness": round(float(np.mean(gray_orig)), 2),
                    "contrast_std": round(float(np.std(gray_orig)), 2),
                    "sharpness_laplacian": round(float(cv2.Laplacian(gray_orig, cv2.CV_64F).var()), 2),
                    "noise_estimate": round(noise_orig, 2),
                    "width": int(orig_img.shape[1]),
                    "height": int(orig_img.shape[0]),
                },
                "enhanced": {
                    "mean_brightness": round(float(np.mean(gray_enh)), 2),
                    "contrast_std": round(float(np.std(gray_enh)), 2),
                    "sharpness_laplacian": round(float(cv2.Laplacian(gray_enh, cv2.CV_64F).var()), 2),
                    "noise_estimate": round(noise_enh, 2),
                    "width": int(gray_enh.shape[1]),
                    "height": int(gray_enh.shape[0]),
                },
            },
        },
        message="Histogram comparison calculated",
    )


@router.get("/api/manuscripts/{id}/artifacts")
def get_manuscript_artifacts(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve URLs for all stored intermediate and final images, masks, and documents."""
    manuscript = verify_manuscript_read_access(db, id, current_user, share_token=token)
    heritage = db.query(HeritageRecord).filter(HeritageRecord.manuscript_id == id).first()

    stem = f"{manuscript.id}_page_1"
    qr_slug = heritage.unique_slug if heritage else f"heritage-{manuscript.id[:8]}"
    token_q = f"?token={token}" if token else ""

    preview_fn = f"{manuscript.id}_preview.jpg"
    if manuscript.preview_path:
        preview_fn = manuscript.preview_path.replace("\\", "/").split("/")[-1]

    artifacts = {
        "original_image": f"/api/files/originals/{stem}.png{token_q}",
        "preview_image": f"/api/files/previews/{preview_fn}{token_q}",
        "intermediate_enhanced": {
            "grayscale": f"/api/files/processed/{stem}_grayscale.png{token_q}",
            "denoised": f"/api/files/processed/{stem}_denoised.png{token_q}",
            "contrast_enhanced": f"/api/files/processed/{stem}_contrast_enhanced.png{token_q}",
            "final_enhanced": f"/api/files/processed/{stem}_final_enhanced.png{token_q}",
        },
        "damage": {
            "mask": f"/api/files/processed/{stem}_damage_mask.png{token_q}",
            "overlay": f"/api/files/processed/{stem}_damage_overlay.png{token_q}",
        },
        "heritage": {
            "qr_code": f"/api/files/processed/qr_codes/{qr_slug}_qr.png{token_q}",
        },
    }

    return success_response(data=artifacts, message="Artifact URLs retrieved")


@router.get("/api/manuscripts/{id}/damage-map")
def get_damage_map(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve damage overlay, mask, image dimensions, and detected damage regions."""
    from app.services.damage_detection import DamageDetectionService

    manuscript = verify_manuscript_read_access(db, id, current_user, share_token=token)

    img_res = db.query(ImageResult).filter(ImageResult.manuscript_id == id).first()
    stem = f"{id}_page_1"
    token_q = f"?token={token}" if token else ""

    indicators = {}
    detected_regions = []
    damage_area_pct = None
    image_width = img_res.image_width if img_res else None
    image_height = img_res.image_height if img_res else None

    if img_res and img_res.damage_indicators:
        if "indicators" in img_res.damage_indicators and isinstance(img_res.damage_indicators["indicators"], dict):
            indicators = img_res.damage_indicators["indicators"]
            detected_regions = img_res.damage_indicators.get("detected_regions") or []
            damage_area_pct = (
                img_res.damage_indicators.get("damage_area_percentage")
                or img_res.damage_indicators.get("overall_damage_ratio")
                or indicators.get("overall_damage_ratio")
                or indicators.get("overall", {}).get("damage_area_percentage")
            )
            image_width = image_width or img_res.damage_indicators.get("image_width")
            image_height = image_height or img_res.damage_indicators.get("image_height")
        else:
            indicators = img_res.damage_indicators
            detected_regions = img_res.damage_indicators.get("detected_regions") or []
            damage_area_pct = (
                indicators.get("overall_damage_ratio")
                or indicators.get("overall", {}).get("damage_area_percentage")
            )

    if not detected_regions or not image_width or not image_height:
        settings = get_settings()
        orig_path = settings.upload_originals_dir / f"{manuscript.id}_page_1.png"
        if not orig_path.exists():
            orig_path = Path(manuscript.original_file_path)
        if orig_path.exists():
            try:
                import cv2
                raw = cv2.imread(str(orig_path))
                if raw is not None:
                    image_height, image_width = raw.shape[:2]
                analysis = DamageDetectionService.analyse(str(orig_path), output_dir=str(settings.upload_processed_dir))
                indicators = analysis.get("damage_indicators", indicators)
                detected_regions = analysis.get("detected_regions", detected_regions)
                damage_area_pct = analysis.get("damage_area_percentage", damage_area_pct)
            except Exception as e:
                logger.warning("Could not compute damage analysis dynamically: %s", e)

    if damage_area_pct is None and indicators:
        dark_p = indicators.get("dark_regions", {}).get("percentage", 0.0)
        fade_p = indicators.get("faded_regions", {}).get("percentage", 0.0)
        damage_area_pct = round(float(dark_p + fade_p), 2)

    # Ensure damage_area_pct is always on 0..100 percentage scale
    if damage_area_pct is not None and 0 < damage_area_pct < 1.0:
        # Check if it was stored as a 0..1 ratio vs a small percentage
        dark_p = indicators.get("dark_regions", {}).get("percentage", 0.0)
        fade_p = indicators.get("faded_regions", {}).get("percentage", 0.0)
        if (dark_p + fade_p) > 1.0 and abs(damage_area_pct * 100 - (dark_p + fade_p)) < 1.0:
            damage_area_pct = round(damage_area_pct * 100.0, 2)

    return success_response(
        data={
            "manuscript_id": id,
            "damage_overlay_url": f"/api/files/processed/{stem}_damage_overlay.png{token_q}",
            "damage_mask_url": f"/api/files/processed/{stem}_damage_mask.png{token_q}",
            "image_width": image_width,
            "image_height": image_height,
            "indicators": indicators,
            "detected_regions": detected_regions,
            "total_regions": len(detected_regions),
            "damage_area_percentage": damage_area_pct,
            "overall_damage_ratio": damage_area_pct,
            "methodology": "Heuristic OpenCV contour segmentation, luminance thresholding, and Probabilistic Hough Transform.",
        },
        message="Damage map retrieved",
    )


@router.get("/api/manuscripts/{id}/ocr/compare")
def get_ocr_comparison(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Compare OCR output between original raw image and enhanced image."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)

    ocr_res = db.query(OCRResult).filter(OCRResult.manuscript_id == id).first()
    if not ocr_res:
        raise NotFoundError("OCR has not been run for this manuscript.")

    orig_text = ocr_res.original_image_text or ""
    enh_text = ocr_res.enhanced_image_text or ""

    orig_lines = [l for l in orig_text.splitlines() if l.strip()]
    enh_lines = [l for l in enh_text.splitlines() if l.strip()]

    return success_response(
        data={
            "manuscript_id": id,
            "engine": ocr_res.ocr_engine,
            "model": ocr_res.model_name,
            "original_ocr": {
                "text": orig_text,
                "line_count": len(orig_lines),
                "word_count": len(orig_text.split()),
            },
            "enhanced_ocr": {
                "text": enh_text,
                "line_count": len(enh_lines),
                "word_count": len(enh_text.split()),
            },
            "selected_text": ocr_res.selected_text or enh_text or orig_text,
            "confidence_summary": ocr_res.confidence_summary,
            "text_regions": ocr_res.text_regions or [],
            "uncertain_regions": ocr_res.uncertain_regions or [],
        },
        message="OCR comparison retrieved",
    )


@router.get("/api/manuscripts/{id}/cultural-entities")
def get_cultural_entities(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve extracted cultural references grounded in manuscript."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)

    entities = db.query(CulturalEntity).filter(CulturalEntity.manuscript_id == id).all()
    if not entities:
        entities = CulturalIntelligenceService.extract_cultural_entities(db, id)

    return success_response(
        data={
            "manuscript_id": id,
            "total_entities": len(entities),
            "entities": [
                {
                    "id": e.id,
                    "canonical_name": e.canonical_name,
                    "category": e.category,
                    "description": e.description,
                    "english_explanation": e.english_explanation,
                    "source_excerpt": e.source_excerpt,
                    "confidence": e.confidence,
                    "verification_status": e.verification_status,
                }
                for e in entities
            ],
        },
        message="Cultural entities retrieved",
    )


@router.post("/api/manuscripts/{id}/extract-cultural-entities")
def extract_cultural_entities(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger cultural entity extraction from transcription (requires ownership)."""
    verify_manuscript_ownership(db, id, current_user)
    entities = CulturalIntelligenceService.extract_cultural_entities(db, id)
    return success_response(data={"count": len(entities)}, message="Cultural entities extracted")


@router.get("/api/manuscripts/{id}/knowledge-graph")
def get_knowledge_graph(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve knowledge graph nodes and connecting edges."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)
    graph = CulturalIntelligenceService.get_knowledge_graph(db, id)
    return success_response(data=graph, message="Knowledge graph retrieved")


@router.post("/api/manuscripts/{id}/knowledge-graph/generate")
def generate_knowledge_graph(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate knowledge graph nodes and relationships (requires ownership)."""
    verify_manuscript_ownership(db, id, current_user)
    graph = CulturalIntelligenceService.get_knowledge_graph(db, id)
    return success_response(data=graph, message="Knowledge graph generated")


@router.get("/api/manuscripts/{id}/verification")
def get_verification_history(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve verification records and audit status."""
    verify_manuscript_read_access(db, id, current_user, share_token=token)
    records = (
        db.query(VerificationRecord)
        .filter(VerificationRecord.manuscript_id == id)
        .order_by(desc(VerificationRecord.created_at))
        .all()
    )
    return success_response(
        data={
            "manuscript_id": id,
            "records": [
                {
                    "id": r.id,
                    "reviewer": r.reviewer,
                    "verification_status": r.verification_status,
                    "reviewer_notes": r.reviewer_notes,
                    "verified_at": r.verified_at.isoformat() if r.verified_at else None,
                    "created_at": r.created_at.isoformat(),
                }
                for r in records
            ],
        },
        message="Verification history retrieved",
    )


@router.get("/api/manuscripts/{id}/heritage-record")
def get_heritage_record(
    id: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieve or generate digital heritage record and QR passport."""
    manuscript = verify_manuscript_read_access(db, id, current_user, share_token=token)
    record = HeritageRecordService.get_or_create_record(db, id, user_id=manuscript.user_id)
    return success_response(data=record, message="Heritage record retrieved")


@router.post("/api/manuscripts/{id}/heritage-record")
def create_heritage_record(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate or update digital heritage record (requires ownership)."""
    verify_manuscript_ownership(db, id, current_user)
    record = HeritageRecordService.get_or_create_record(db, id, user_id=current_user.id)
    return success_response(data=record, message="Heritage record generated")


@router.patch("/api/manuscripts/{id}/heritage-record/visibility")
def update_heritage_record_visibility(
    id: str,
    req: VisibilityUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle Digital Heritage Record visibility between 'PRIVATE' and 'PUBLIC' for QR sharing."""
    verify_manuscript_ownership(db, id, current_user)
    try:
        record = HeritageRecordService.set_visibility(
            db, manuscript_id=id, visibility=req.visibility, user_id=current_user.id
        )
    except ValueError as exc:
        raise ValidationError(str(exc))
    return success_response(
        data=record,
        message=f"Heritage record visibility updated to {record['visibility']}",
    )


@router.get("/api/public/heritage-records/{slug}")
def get_public_heritage_record(
    slug: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Public API endpoint linked from QR codes. Enforces public visibility or owner authentication."""
    record = db.query(HeritageRecord).filter(HeritageRecord.unique_slug == slug).first()
    if not record:
        raise NotFoundError(f"Heritage record '{slug}' not found.")

    is_owner = bool(current_user and record.user_id == current_user.id)
    if record.visibility != "PUBLIC" and not is_owner:
        raise AuthorizationError(
            "This Digital Heritage Record is private. The manuscript owner must enable public sharing to allow external QR access."
        )

    return success_response(
        data={
            "record_id": record.id,
            "manuscript_id": record.manuscript_id,
            "unique_slug": record.unique_slug,
            "title": record.title,
            "description": record.description,
            "art_form": record.art_form,
            "language": record.language,
            "script": record.script,
            "region": record.region,
            "historical_period": record.historical_period,
            "publication_status": record.publication_status,
            "visibility": record.visibility,
            "metadata": record.metadata_payload,
            "created_at": record.created_at.isoformat(),
        },
        message="Heritage record retrieved",
    )
