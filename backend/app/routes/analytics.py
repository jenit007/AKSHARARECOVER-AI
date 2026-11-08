"""Analytics route – live statistics calculated from actual database records."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    User,
    Manuscript,
    ProcessingJob,
    OCRResult,
    TranslationResult,
    VerificationRecord,
    ImageResult,
)
from app.schemas.common import success_response
from app.utils.security import get_optional_user

logger = logging.getLogger("akshararecover.routes.analytics")

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("")
def get_analytics(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Generate real analytics from actual database records and processing events.
    Scopes to the authenticated user's manuscripts when signed in.
    Never hardcode or fabricate values.
    """
    ms_query = db.query(Manuscript)
    job_query = db.query(ProcessingJob)
    ocr_query = db.query(OCRResult).join(Manuscript, Manuscript.id == OCRResult.manuscript_id)
    trans_query = db.query(TranslationResult).join(Manuscript, Manuscript.id == TranslationResult.manuscript_id)
    ver_query = db.query(VerificationRecord).join(Manuscript, Manuscript.id == VerificationRecord.manuscript_id)
    img_query = db.query(ImageResult).join(Manuscript, Manuscript.id == ImageResult.manuscript_id)

    if current_user:
        ms_query = ms_query.filter(Manuscript.user_id == current_user.id)
        job_query = job_query.filter(ProcessingJob.user_id == current_user.id)
        ocr_query = ocr_query.filter(Manuscript.user_id == current_user.id)
        trans_query = trans_query.filter(Manuscript.user_id == current_user.id)
        ver_query = ver_query.filter(Manuscript.user_id == current_user.id)
        img_query = img_query.filter(Manuscript.user_id == current_user.id)

    total_manuscripts = ms_query.count()
    processed_manuscripts = ms_query.filter(Manuscript.status.in_(["processed", "verified"])).count()

    successful_jobs = job_query.filter(ProcessingJob.status == "completed").count()
    failed_jobs = job_query.filter(ProcessingJob.status == "failed").count()

    ocr_jobs = ocr_query.count()
    translations_completed = trans_query.filter(TranslationResult.status == "completed").count()

    verified_count = ver_query.filter(VerificationRecord.verification_status == "verified").count()
    awaiting_verification = max(0, processed_manuscripts - verified_count)

    avg_proc_time = img_query.with_entities(func.avg(ImageResult.processing_time)).scalar()
    avg_proc_time_sec = round(float(avg_proc_time), 2) if avg_proc_time is not None else None

    enh_records = (
        img_query.with_entities(ImageResult.enhancement_method)
        .filter(ImageResult.enhancement_method.isnot(None))
        .all()
    )
    enhancement_stats = {}
    for (m_str,) in enh_records:
        if m_str:
            for method in m_str.split("+"):
                clean = method.strip()
                if clean:
                    enhancement_stats[clean] = enhancement_stats.get(clean, 0) + 1

    return success_response(
        data={
            "total_manuscripts": total_manuscripts,
            "processed_manuscripts": processed_manuscripts,
            "successful_ocr_jobs": successful_jobs or ocr_jobs,
            "failed_jobs": failed_jobs,
            "translations_completed": translations_completed,
            "awaiting_verification": awaiting_verification,
            "verified_manuscripts": verified_count,
            "average_processing_time_seconds": avg_proc_time_sec,
            "ocr_evaluation": {
                "cer": None,
                "wer": None,
                "evaluated_samples": 0,
            },
            "enhancement_statistics": enhancement_stats,
        },
        message="Analytics retrieved successfully",
    )
