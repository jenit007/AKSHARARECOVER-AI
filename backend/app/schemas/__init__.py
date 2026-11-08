"""AksharaRecover AI — Pydantic v2 schema re-exports."""

from app.schemas.manuscript import (
    ManuscriptUploadResponse,
    ManuscriptDetail,
    ManuscriptListItem,
)
from app.schemas.processing import (
    ProcessingRequest,
    JobResponse,
    JobStatusResponse,
)
from app.schemas.ocr import (
    OCRLine,
    OCRPageResult,
    OCROutput,
    ImageComparisonPage,
)
from app.schemas.translation import (
    TranslationRequest,
    TranslationResponse,
    TranslationEditRequest,
)
from app.schemas.verification import (
    VerificationRequest,
    TranscriptionCorrectionRequest,
)
from app.schemas.analytics import (
    OCREvaluation,
    AnalyticsResponse,
)

__all__ = [
    # manuscript
    "ManuscriptUploadResponse",
    "ManuscriptDetail",
    "ManuscriptListItem",
    # processing
    "ProcessingRequest",
    "JobResponse",
    "JobStatusResponse",
    # ocr
    "OCRLine",
    "OCRPageResult",
    "OCROutput",
    "ImageComparisonPage",
    # translation
    "TranslationRequest",
    "TranslationResponse",
    "TranslationEditRequest",
    # verification
    "VerificationRequest",
    "TranscriptionCorrectionRequest",
    # analytics
    "OCREvaluation",
    "AnalyticsResponse",
]
