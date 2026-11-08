"""SQLAlchemy 2.x database models for AksharaRecover AI.
Preserves existing manuscript preservation tables, adds User authentication & ownership,
and maintains PS-01 Cultural Preservation tables.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean, DateTime,
    ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ==============================================================================
# 0. USER AUTHENTICATION & ACCOUNT OWNERSHIP TABLE
# ==============================================================================

class User(Base):
    """Authenticated user account for manuscript restoration and personal library ownership."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(250), nullable=False)
    email = Column(String(250), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    manuscripts = relationship("Manuscript", back_populates="owner", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="user")
    heritage_records = relationship("HeritageRecord", back_populates="user")

    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_created_at", "created_at"),
    )


# ==============================================================================
# 1. CORE MANUSCRIPT & PROCESSING PRESERVATION TABLES (EXISTING PRESERVED)
# ==============================================================================

class Manuscript(Base):
    __tablename__ = "manuscripts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    original_filename = Column(String(500), nullable=False)
    stored_filename = Column(String(500), nullable=False)
    original_file_path = Column(String(1000), nullable=False)
    preview_path = Column(String(1000), nullable=True)
    file_type = Column(String(50), nullable=False)
    source_language = Column(String(50), nullable=True)
    source_script = Column(String(100), nullable=True)
    historical_period = Column(String(150), nullable=True)
    region = Column(String(150), nullable=True)
    page_count = Column(Integer, default=1)
    status = Column(String(50), default="uploaded")
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="manuscripts")
    processing_jobs = relationship("ProcessingJob", back_populates="manuscript", cascade="all, delete-orphan")
    image_results = relationship("ImageResult", back_populates="manuscript", cascade="all, delete-orphan")
    ocr_results = relationship("OCRResult", back_populates="manuscript", cascade="all, delete-orphan")
    translation_results = relationship("TranslationResult", back_populates="manuscript", cascade="all, delete-orphan")
    transcription_corrections = relationship("TranscriptionCorrection", back_populates="manuscript", cascade="all, delete-orphan")
    verification_records = relationship("VerificationRecord", back_populates="manuscript", cascade="all, delete-orphan")
    cultural_entities = relationship("CulturalEntity", back_populates="manuscript", cascade="all, delete-orphan")
    heritage_records = relationship("HeritageRecord", back_populates="manuscript", cascade="all, delete-orphan")
    consent_records = relationship("ConsentRecord", back_populates="manuscript", cascade="all, delete-orphan")
    attribution_records = relationship("AttributionRecord", back_populates="manuscript", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_manuscripts_user_id", "user_id"),
        Index("ix_manuscripts_status", "status"),
        Index("ix_manuscripts_source_language", "source_language"),
        Index("ix_manuscripts_created_at", "created_at"),
    )


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    job_type = Column(String(50), nullable=False)  # "processing", "translation", "cultural_extraction"
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    current_stage = Column(String(100), nullable=True)
    progress = Column(Integer, default=0)
    message = Column(String(500), nullable=True)
    error_code = Column(String(100), nullable=True)
    error_message = Column(String(1000), nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    manuscript = relationship("Manuscript", back_populates="processing_jobs")
    user = relationship("User", back_populates="processing_jobs")

    __table_args__ = (
        Index("ix_processing_jobs_manuscript_id", "manuscript_id"),
        Index("ix_processing_jobs_user_id", "user_id"),
        Index("ix_processing_jobs_status", "status"),
    )


class ImageResult(Base):
    __tablename__ = "image_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    original_image_path = Column(String(1000), nullable=False)
    enhanced_image_path = Column(String(1000), nullable=True)
    damage_overlay_path = Column(String(1000), nullable=True)
    enhancement_method = Column(String(200), nullable=True)
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    quality_metrics = Column(JSON, nullable=True)
    damage_indicators = Column(JSON, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    manuscript = relationship("Manuscript", back_populates="image_results")
    ocr_results = relationship("OCRResult", back_populates="image_result", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_image_results_manuscript_id", "manuscript_id"),
        UniqueConstraint("manuscript_id", "page_number", name="uq_image_results_manuscript_page"),
    )


class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=False)
    image_result_id = Column(String(36), ForeignKey("image_results.id", ondelete="CASCADE"), nullable=True)
    page_number = Column(Integer, nullable=False)
    ocr_engine = Column(String(100), nullable=True)
    model_name = Column(String(200), nullable=True)
    source_language = Column(String(50), nullable=True)
    original_image_text = Column(Text, nullable=True)
    enhanced_image_text = Column(Text, nullable=True)
    selected_text = Column(Text, nullable=True)
    confidence_summary = Column(JSON, nullable=True)
    text_regions = Column(JSON, nullable=True)
    uncertain_regions = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    manuscript = relationship("Manuscript", back_populates="ocr_results")
    image_result = relationship("ImageResult", back_populates="ocr_results")
    translation_results = relationship("TranslationResult", back_populates="ocr_result", cascade="all, delete-orphan")
    transcription_corrections = relationship("TranscriptionCorrection", back_populates="ocr_result", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_ocr_results_manuscript_id", "manuscript_id"),
    )


class TranslationResult(Base):
    __tablename__ = "translation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=False)
    ocr_result_id = Column(String(36), ForeignKey("ocr_results.id", ondelete="CASCADE"), nullable=True)
    source_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    source_language = Column(String(50), nullable=True)
    target_language = Column(String(50), default="en")
    translation_mode = Column(String(50), nullable=True)  # literal, contextual
    translation_model = Column(String(200), nullable=True)
    model_version = Column(String(100), nullable=True)
    transcription_version = Column(Integer, default=1)
    uncertainty_notes = Column(JSON, nullable=True)
    status = Column(String(50), default="pending")  # pending, completed, stale
    is_edited = Column(Boolean, default=False)
    original_translation = Column(Text, nullable=True)
    editor = Column(String(200), nullable=True)
    editor_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    manuscript = relationship("Manuscript", back_populates="translation_results")
    ocr_result = relationship("OCRResult", back_populates="translation_results")

    __table_args__ = (
        Index("ix_translation_results_manuscript_id", "manuscript_id"),
    )


class TranscriptionCorrection(Base):
    __tablename__ = "transcription_corrections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=False)
    ocr_result_id = Column(String(36), ForeignKey("ocr_results.id", ondelete="CASCADE"), nullable=False)
    original_text = Column(Text, nullable=False)
    corrected_text = Column(Text, nullable=False)
    version_number = Column(Integer, nullable=False)
    reviewer = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    manuscript = relationship("Manuscript", back_populates="transcription_corrections")
    ocr_result = relationship("OCRResult", back_populates="transcription_corrections")

    __table_args__ = (
        Index("ix_transcription_corrections_manuscript_id", "manuscript_id"),
        UniqueConstraint("ocr_result_id", "version_number", name="uq_correction_version"),
    )


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=False)
    transcription_version = Column(Integer, nullable=True)
    translation_version = Column(Integer, nullable=True)
    reviewer = Column(String(200), nullable=True)
    verification_status = Column(String(50), nullable=False)  # pending, verified, needs_review, rejected
    reviewer_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    manuscript = relationship("Manuscript", back_populates="verification_records")

    __table_args__ = (
        Index("ix_verification_records_manuscript_id", "manuscript_id"),
    )


# ==============================================================================
# 2. PS-01 CULTURAL HERITAGE ARCHIVE & KNOWLEDGE GRAPH TABLES
# ==============================================================================

class Contributor(Base):
    """Represents a cultural heritage contributor, tradition-bearer, or archivist."""
    __tablename__ = "contributors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    display_name = Column(String(250), nullable=False)
    contribution_role = Column(String(100), default="Community Contributor")
    community_association = Column(String(250), nullable=True)
    attribution_preference = Column(String(50), default="PUBLIC_NAME")  # PUBLIC_NAME, PSEUDONYM, ANONYMOUS, ORGANIZATION
    contact_email = Column(String(250), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    contributions = relationship("CommunityContribution", back_populates="contributor", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_contributors_display_name", "display_name"),
    )


class CommunityContribution(Base):
    """Multimodal community cultural heritage contributions (text, image, audio, video)."""
    __tablename__ = "community_contributions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    contributor_id = Column(String(36), ForeignKey("contributors.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    cultural_category = Column(String(100), nullable=False)  # Performing Arts, Ritual Traditions, Crafts, etc.
    art_form = Column(String(150), nullable=True)            # Theyyam, Kathakali, Mohiniyattam, etc.
    language = Column(String(100), nullable=True)
    script = Column(String(100), nullable=True)
    region = Column(String(150), default="Kerala")
    state = Column(String(100), default="Kerala")
    district = Column(String(100), nullable=True)
    locality = Column(String(150), nullable=True)
    historical_period = Column(String(150), nullable=True)
    original_creator = Column(String(250), nullable=True)
    community_association = Column(String(250), nullable=True)
    source = Column(String(500), nullable=True)
    collection_info = Column(String(500), nullable=True)
    date_of_creation = Column(String(100), nullable=True)
    content_type = Column(String(50), nullable=False)  # text, image, audio, video, manuscript
    media_path = Column(String(1000), nullable=True)
    media_mime_type = Column(String(100), nullable=True)
    media_size = Column(Integer, nullable=True)
    review_status = Column(String(50), default="PENDING")  # PENDING, APPROVED, REJECTED, NEEDS_REVISION, WITHDRAWN
    visibility = Column(String(50), default="PUBLIC")       # PUBLIC, PRIVATE, REVIEW_ONLY, RESTRICTED
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    contributor = relationship("Contributor", back_populates="contributions")
    consent_records = relationship("ConsentRecord", back_populates="contribution", cascade="all, delete-orphan")
    attribution_records = relationship("AttributionRecord", back_populates="contribution", cascade="all, delete-orphan")
    review_records = relationship("ReviewRecord", back_populates="contribution", cascade="all, delete-orphan")
    cultural_entities = relationship("CulturalEntity", back_populates="contribution", cascade="all, delete-orphan")
    heritage_records = relationship("HeritageRecord", back_populates="contribution", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_contributions_category", "cultural_category"),
        Index("ix_contributions_art_form", "art_form"),
        Index("ix_contributions_review_status", "review_status"),
        Index("ix_contributions_visibility", "visibility"),
        Index("ix_contributions_district", "district"),
    )


class ConsentRecord(Base):
    """Explicit consent and usage rights for cultural heritage items."""
    __tablename__ = "consent_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    contribution_id = Column(String(36), ForeignKey("community_contributions.id", ondelete="CASCADE"), nullable=True)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=True)
    permission_to_store = Column(Boolean, default=True)
    permission_to_display = Column(Boolean, default=True)
    permission_to_publish = Column(Boolean, default=True)
    permission_to_reuse = Column(Boolean, default=False)
    permission_to_distribute = Column(Boolean, default=False)
    attribution_requirements = Column(String(250), default="Attribution Required (CC-BY-NC 4.0)")
    consent_date = Column(DateTime, default=utcnow, nullable=False)
    consent_source = Column(String(200), default="Online Submission Form")
    consent_status = Column(String(50), default="GRANTED")  # GRANTED, PENDING, DENIED, WITHDRAWN
    withdrawal_status = Column(String(50), default="ACTIVE") # ACTIVE, WITHDRAWN
    visibility_level = Column(String(50), default="PUBLIC")  # PUBLIC, PRIVATE, REVIEW_ONLY, RESTRICTED
    withdrawn_at = Column(DateTime, nullable=True)
    withdrawal_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    contribution = relationship("CommunityContribution", back_populates="consent_records")
    manuscript = relationship("Manuscript", back_populates="consent_records")

    __table_args__ = (
        Index("ix_consent_status", "consent_status"),
        Index("ix_consent_visibility", "visibility_level"),
    )


class AttributionRecord(Base):
    """Detailed provenance and attribution separating uploader, creator, and community."""
    __tablename__ = "attribution_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    contribution_id = Column(String(36), ForeignKey("community_contributions.id", ondelete="CASCADE"), nullable=True)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=True)
    uploader_name = Column(String(250), nullable=False)
    original_creator = Column(String(250), nullable=True)
    community_holder = Column(String(250), nullable=True)
    contributor_name = Column(String(250), nullable=True)
    source_institution = Column(String(250), nullable=True)
    reviewer_name = Column(String(250), nullable=True)
    attribution_text = Column(Text, nullable=False)
    license_type = Column(String(100), default="CC-BY-NC-SA 4.0")
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    contribution = relationship("CommunityContribution", back_populates="attribution_records")
    manuscript = relationship("Manuscript", back_populates="attribution_records")


class ReviewRecord(Base):
    """Audit trail for researcher, community elder, and admin review decisions."""
    __tablename__ = "review_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    contribution_id = Column(String(36), ForeignKey("community_contributions.id", ondelete="CASCADE"), nullable=True)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=True)
    reviewer_id = Column(String(200), nullable=False)
    reviewer_role = Column(String(50), nullable=False)  # RESEARCHER, COMMUNITY_REVIEWER, ADMIN, CONTRIBUTOR
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    decision = Column(String(50), nullable=False)        # APPROVE, REJECT, REQUEST_REVISION, WITHDRAW
    reviewer_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    contribution = relationship("CommunityContribution", back_populates="review_records")


class CulturalEntity(Base):
    """Extracted cultural entities (People, Places, Plants, Rituals, Art Forms, etc.)."""
    __tablename__ = "cultural_entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=True)
    contribution_id = Column(String(36), ForeignKey("community_contributions.id", ondelete="CASCADE"), nullable=True)
    canonical_name = Column(String(250), nullable=False)
    original_name = Column(String(250), nullable=True)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    source_excerpt = Column(Text, nullable=True)
    english_explanation = Column(Text, nullable=True)
    extraction_method = Column(String(100), default="cultural_intelligence_engine")
    confidence = Column(Float, default=1.0)
    verification_status = Column(String(50), default="UNVERIFIED")  # UNVERIFIED, VERIFIED, REJECTED
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    manuscript = relationship("Manuscript", back_populates="cultural_entities")
    contribution = relationship("CommunityContribution", back_populates="cultural_entities")

    __table_args__ = (
        Index("ix_cultural_entities_category", "category"),
        Index("ix_cultural_entities_canonical_name", "canonical_name"),
    )


class CulturalRelationship(Base):
    """Knowledge graph relationships connecting cultural entities with evidence."""
    __tablename__ = "cultural_relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_entity_id = Column(String(36), ForeignKey("cultural_entities.id", ondelete="CASCADE"), nullable=False)
    target_entity_id = Column(String(36), ForeignKey("cultural_entities.id", ondelete="CASCADE"), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    evidence_excerpt = Column(Text, nullable=True)
    verification_status = Column(String(50), default="UNVERIFIED")  # UNVERIFIED, VERIFIED
    created_at = Column(DateTime, default=utcnow, nullable=False)

    source_entity = relationship("CulturalEntity", foreign_keys=[source_entity_id])
    target_entity = relationship("CulturalEntity", foreign_keys=[target_entity_id])

    __table_args__ = (
        Index("ix_relationships_type", "relationship_type"),
    )


class HeritageRecord(Base):
    """Permanent digital heritage record and passport entry with QR code linkage."""
    __tablename__ = "heritage_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    manuscript_id = Column(String(36), ForeignKey("manuscripts.id", ondelete="SET NULL"), nullable=True)
    contribution_id = Column(String(36), ForeignKey("community_contributions.id", ondelete="SET NULL"), nullable=True)
    unique_slug = Column(String(200), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    cultural_category = Column(String(100), nullable=False)
    art_form = Column(String(150), nullable=True)
    language = Column(String(100), nullable=True)
    script = Column(String(100), nullable=True)
    region = Column(String(150), default="Kerala")
    historical_period = Column(String(150), nullable=True)
    qr_code_path = Column(String(1000), nullable=True)
    public_url = Column(String(500), nullable=False)
    publication_status = Column(String(50), default="APPROVED")  # DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, WITHDRAWN
    visibility = Column(String(50), default="PRIVATE")           # PRIVATE, PUBLIC
    version = Column(Integer, default=1)
    metadata_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="heritage_records")
    manuscript = relationship("Manuscript", back_populates="heritage_records")
    contribution = relationship("CommunityContribution", back_populates="heritage_records")
    versions = relationship("HeritageRecordVersion", back_populates="heritage_record", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_heritage_records_slug", "unique_slug"),
        Index("ix_heritage_records_status", "publication_status"),
        Index("ix_heritage_records_user_id", "user_id"),
        Index("ix_heritage_records_visibility", "visibility"),
    )


class HeritageRecordVersion(Base):
    """Immutable snapshots of published heritage records across revisions."""
    __tablename__ = "heritage_record_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    heritage_record_id = Column(String(36), ForeignKey("heritage_records.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    snapshot_json = Column(JSON, nullable=False)
    change_summary = Column(String(500), nullable=True)
    changed_by = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    heritage_record = relationship("HeritageRecord", back_populates="versions")

    __table_args__ = (
        UniqueConstraint("heritage_record_id", "version_number", name="uq_heritage_record_version"),
    )
