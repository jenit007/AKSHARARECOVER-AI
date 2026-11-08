"""Idempotent development seed script for AksharaRecover AI.
Creates or updates the required development test account (jenit@gmail.com)
with a bcrypt-hashed password and links existing orphan development manuscripts to it.
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.database.database import init_db, get_db
from app.database.models import User, Manuscript, ProcessingJob, HeritageRecord, OCRResult
from app.utils.security import hash_password


DEV_TEST_EMAIL = os.environ.get("DEV_SEED_EMAIL", "jenit@gmail.com")
DEV_TEST_PASSWORD = os.environ.get("DEV_SEED_PASSWORD", "jenit123")
DEV_TEST_NAME = os.environ.get("DEV_SEED_NAME", "Jenit (Archival Researcher)")


def seed_development_user(db: Session) -> User:
    """Idempotently create or update the development test account and link orphan dev records."""
    now = datetime.now(timezone.utc)
    email_norm = DEV_TEST_EMAIL.strip().lower()

    user = db.query(User).filter(User.email == email_norm).first()
    if not user:
        user = User(
            full_name=DEV_TEST_NAME,
            email=email_norm,
            password_hash=hash_password(DEV_TEST_PASSWORD),
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.password_hash = hash_password(DEV_TEST_PASSWORD)
        user.is_active = True
        user.updated_at = now
        db.commit()
        db.refresh(user)

    # Link any legacy orphan manuscripts/jobs/heritage records in dev DB to this test user
    orphan_manuscripts = db.query(Manuscript).filter(Manuscript.user_id.is_(None)).all()
    for m in orphan_manuscripts:
        m.user_id = user.id

    # Clean up placeholder 'string' titles from early Swagger UI tests
    user_manuscripts = db.query(Manuscript).filter(Manuscript.user_id == user.id).all()
    for m in user_manuscripts:
        if m.title in (None, "", "string"):
            m.title = Path(m.original_filename).stem.replace("_", " ").replace("-", " ")
        if m.source_language == "string":
            m.source_language = "en"
        if not m.description:
            m.description = f"Digitised archival manuscript folio ({m.original_filename})."

    orphan_jobs = db.query(ProcessingJob).filter(ProcessingJob.user_id.is_(None)).all()
    for j in orphan_jobs:
        j.user_id = user.id

    orphan_records = db.query(HeritageRecord).filter(HeritageRecord.user_id.is_(None)).all()
    for r in orphan_records:
        r.user_id = user.id
        if not r.visibility:
            r.visibility = "PRIVATE"

    # Backfill per-line confidence on legacy OCRResult.text_regions from uncertain_regions
    all_ocrs = db.query(OCRResult).all()
    for ocr in all_ocrs:
        regions = ocr.text_regions or []
        uncertain = ocr.uncertain_regions or []
        summary = ocr.confidence_summary or {}
        if regions and any("confidence" not in reg for reg in regions):
            unc_map = {}
            for u in uncertain:
                key = (u.get("text", ""), tuple(u.get("bounding_box") or []))
                unc_map[key] = u.get("confidence")
                unc_map[(u.get("text", ""), ())] = u.get("confidence")

            max_conf = summary.get("max_confidence")
            updated_regions = []
            for reg in regions:
                txt = reg.get("line") or reg.get("text") or ""
                box = reg.get("box") or reg.get("bounding_box") or []
                conf = reg.get("confidence")
                if conf is None:
                    conf = unc_map.get((txt, tuple(box)))
                if conf is None:
                    conf = unc_map.get((txt, ()))
                if conf is None and summary.get("confident_lines") == 1 and max_conf is not None:
                    conf = max_conf
                is_unc = bool(conf is not None and conf < summary.get("threshold", 0.70))
                updated_regions.append({
                    "line": txt,
                    "text": txt,
                    "box": box,
                    "bounding_box": box,
                    "confidence": conf,
                    "is_uncertain": is_unc,
                })
            ocr.text_regions = updated_regions
            flag_modified(ocr, "text_regions")

    db.commit()
    return user


def main():
    init_db()
    db_gen = get_db()
    db = next(db_gen)
    try:
        user = seed_development_user(db)
        total_ms = db.query(Manuscript).filter(Manuscript.user_id == user.id).count()
        print(f"[SEED] Development account ready: {user.email} (id={user.id}, manuscripts={total_ms})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
