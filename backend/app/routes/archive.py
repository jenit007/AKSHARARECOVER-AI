"""Archive, search, verification, community contributions, and safe file serving routes."""

import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Form, File, UploadFile, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.database import get_db
from app.database.models import (
    User,
    HeritageRecord,
    Contributor,
    CommunityContribution,
    ConsentRecord,
    AttributionRecord,
)
from app.schemas.common import success_response
from app.schemas.verification import VerificationRequest
from app.services.archive_service import ArchiveService
from app.services.verification_service import VerificationService
from app.utils.errors import NotFoundError, ValidationError
from app.utils.security import (
    get_current_user,
    get_optional_user,
    verify_manuscript_ownership,
    verify_manuscript_read_access,
)

logger = logging.getLogger("akshararecover.routes.archive")

router = APIRouter(tags=["Archive & Verification"])

UUID_PREFIX_RE = re.compile(r"^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})")


@router.post("/api/manuscripts/{id}/verify")
def verify_manuscript(
    id: str,
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record human verification status for historical manuscript (requires ownership)."""
    verify_manuscript_ownership(db, id, current_user)

    record = VerificationService.verify_manuscript(
        db=db,
        manuscript_id=id,
        verification_status=req.verification_status,
        reviewer=req.reviewer or current_user.full_name,
        reviewer_notes=req.reviewer_notes,
        transcription_version=req.transcription_version,
        translation_version=req.translation_version,
    )
    return success_response(
        data={
            "manuscript_id": id,
            "verification_status": record.verification_status,
            "reviewer": record.reviewer,
            "reviewer_notes": record.reviewer_notes,
            "transcription_version": record.transcription_version,
            "translation_version": record.translation_version,
            "verified_at": record.verified_at.isoformat() if record.verified_at else None,
            "created_at": record.created_at.isoformat(),
        },
        message="Manuscript verification status updated",
    )


@router.get("/api/search")
def search_archive(
    q: str = Query(..., min_length=1, description="Search query string"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search user's manuscripts across titles, filenames, OCR transcriptions, corrections, and translations."""
    results = ArchiveService.search_archive(db, query_str=q, user_id=current_user.id)
    return success_response(
        data={"query": q, "results": results, "total_matches": len(results)},
        message="Search results retrieved",
    )


@router.post("/api/contributions", status_code=status.HTTP_201_CREATED)
async def create_contribution(
    title: str = Form(...),
    description: str = Form(...),
    cultural_category: str = Form("Manuscript & Epigraphy"),
    art_form: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    script: Optional[str] = Form(None),
    region: str = Form("Kerala"),
    state: str = Form("Kerala"),
    district: Optional[str] = Form(None),
    locality: Optional[str] = Form(None),
    historical_period: Optional[str] = Form(None),
    original_creator: Optional[str] = Form(None),
    community_association: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
    content_type: str = Form("manuscript"),
    contributor_name: Optional[str] = Form(None),
    contributor_role: str = Form("Community Contributor"),
    attribution_preference: str = Form("PUBLIC_NAME"),
    license_type: str = Form("CC-BY-NC-SA 4.0"),
    permission_to_store: bool = Form(True),
    permission_to_display: bool = Form(True),
    permission_to_publish: bool = Form(True),
    media_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a real database-backed community cultural contribution with consent and attribution records."""
    if not title.strip() or not description.strip():
        raise ValidationError("Title and description are required.")

    now = datetime.now(timezone.utc)
    display_name = (contributor_name or current_user.full_name).strip()

    contributor = Contributor(
        display_name=display_name,
        contribution_role=contributor_role,
        community_association=community_association,
        attribution_preference=attribution_preference,
        contact_email=current_user.email,
        created_at=now,
        updated_at=now,
    )
    db.add(contributor)
    db.flush()

    media_path = None
    media_mime = None
    media_size = None
    if media_file and media_file.filename:
        raw_bytes = await media_file.read()
        if raw_bytes:
            settings = get_settings()
            contrib_dir = settings.upload_originals_dir / "contributions"
            contrib_dir.mkdir(parents=True, exist_ok=True)
            safe_name = Path(media_file.filename).name
            dest = contrib_dir / f"{contributor.id}_{safe_name}"
            dest.write_bytes(raw_bytes)
            media_path = str(dest)
            media_mime = media_file.content_type
            media_size = len(raw_bytes)

    contribution = CommunityContribution(
        user_id=current_user.id,
        contributor_id=contributor.id,
        title=title.strip(),
        description=description.strip(),
        cultural_category=cultural_category,
        art_form=art_form,
        language=language,
        script=script,
        region=region,
        state=state,
        district=district,
        locality=locality,
        historical_period=historical_period,
        original_creator=original_creator,
        community_association=community_association,
        source=source,
        content_type=content_type,
        media_path=media_path,
        media_mime_type=media_mime,
        media_size=media_size,
        review_status="PENDING",
        visibility="PUBLIC" if permission_to_publish else "PRIVATE",
        created_at=now,
        updated_at=now,
    )
    db.add(contribution)
    db.flush()

    consent = ConsentRecord(
        contribution_id=contribution.id,
        permission_to_store=permission_to_store,
        permission_to_display=permission_to_display,
        permission_to_publish=permission_to_publish,
        attribution_requirements=f"Attribution ({license_type})",
        consent_date=now,
        consent_source="Authenticated Cultural Submission Form",
        consent_status="GRANTED",
        withdrawal_status="ACTIVE",
        visibility_level="PUBLIC" if permission_to_publish else "PRIVATE",
        created_at=now,
        updated_at=now,
    )
    db.add(consent)

    attribution = AttributionRecord(
        contribution_id=contribution.id,
        uploader_name=current_user.full_name,
        original_creator=original_creator,
        community_holder=community_association,
        contributor_name=display_name,
        attribution_text=f"Contributed by {display_name} ({community_association or region})",
        license_type=license_type,
        created_at=now,
        updated_at=now,
    )
    db.add(attribution)
    db.commit()
    db.refresh(contribution)

    return success_response(
        data={
            "id": contribution.id,
            "title": contribution.title,
            "cultural_category": contribution.cultural_category,
            "review_status": contribution.review_status,
            "visibility": contribution.visibility,
            "contributor_name": display_name,
            "created_at": contribution.created_at.isoformat(),
        },
        message="Cultural contribution recorded in archive",
    )


@router.get("/api/contributions")
def list_contributions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List community cultural contributions submitted by the authenticated user."""
    items = (
        db.query(CommunityContribution)
        .filter(CommunityContribution.user_id == current_user.id)
        .order_by(desc(CommunityContribution.created_at))
        .all()
    )
    return success_response(
        data={
            "items": [
                {
                    "id": c.id,
                    "title": c.title,
                    "description": c.description,
                    "cultural_category": c.cultural_category,
                    "art_form": c.art_form,
                    "language": c.language,
                    "script": c.script,
                    "region": c.region,
                    "district": c.district,
                    "review_status": c.review_status,
                    "visibility": c.visibility,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in items
            ]
        },
        message="Contributions retrieved",
    )


@router.get("/api/files/{category}/{filepath:path}")
def serve_file(
    category: str,
    filepath: str,
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Safe file-serving endpoint for previews, original and processed images, and QR codes.
    Prevents path traversal AND validates manuscript ownership or public visibility.
    """
    settings = get_settings()
    allowed_categories = {
        "originals": settings.upload_originals_dir,
        "previews": settings.upload_previews_dir,
        "processed": settings.upload_processed_dir,
    }

    if category not in allowed_categories:
        raise NotFoundError(f"Category '{category}' is invalid.")

    root_dir = allowed_categories[category].resolve()

    # Prevent path traversal attacks
    target_path = (root_dir / filepath).resolve()
    try:
        target_path.relative_to(root_dir)
    except ValueError:
        raise NotFoundError("Access to the specified path is forbidden.")

    if not target_path.is_file():
        raise NotFoundError(f"File '{filepath}' not found.")

    # Ownership / visibility check based on manuscript UUID or QR slug in filename
    filename_only = target_path.name
    uuid_match = UUID_PREFIX_RE.match(filename_only)
    if uuid_match:
        manuscript_id = uuid_match.group(1)
        verify_manuscript_read_access(db, manuscript_id, current_user, share_token=token)
    elif filename_only.startswith("heritage-") and filename_only.endswith("_qr.png"):
        slug = filename_only[: -len("_qr.png")]
        rec = db.query(HeritageRecord).filter(HeritageRecord.unique_slug == slug).first()
        if rec and rec.manuscript_id:
            verify_manuscript_read_access(db, rec.manuscript_id, current_user, share_token=token or slug)

    suffix = target_path.suffix.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".tif": "image/tiff",
        ".tiff": "image/tiff",
        ".pdf": "application/pdf",
        ".json": "application/json",
    }
    media_type = media_types.get(suffix, "application/octet-stream")

    return FileResponse(path=str(target_path), media_type=media_type)
