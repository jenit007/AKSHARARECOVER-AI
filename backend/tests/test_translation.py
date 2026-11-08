"""Tests for translation service, editing, versioning, and staleness tracking."""

from app.services.translation_service import TranslationService
from app.database.models import Manuscript, TranslationResult, OCRResult
from datetime import datetime, timezone


def test_translation_engine_none_handling():
    service = TranslationService()
    # When engine is 'none', it should reject or return explicit error
    try:
        service.translate_text("Test", src_lang="mal", tgt_lang="en", engine_name="none")
        assert False, "Should have raised RuntimeError"
    except RuntimeError as exc:
        assert "none" in str(exc).lower() or "unavailable" in str(exc).lower()


def test_translation_unsupported_pair():
    service = TranslationService()
    try:
        service.translate_text("Test", src_lang="unsupported_src", tgt_lang="en", engine_name="nllb")
    except (ValueError, RuntimeError):
        pass  # Expected behavior


def test_translation_edit_and_staleness(client, test_db, sample_image_bytes):
    # 1. Upload manuscript
    up_resp = client.post(
        "/api/manuscripts/upload",
        files={"file": ("manuscript.jpg", sample_image_bytes, "image/jpeg")},
        data={"title": "Test Stale Manuscript"},
    )
    man_id = up_resp.json()["data"]["manuscript_id"]

    # 2. Add an OCR result and translation result directly to DB
    now = datetime.now(timezone.utc)
    ocr = OCRResult(
        manuscript_id=man_id,
        page_number=1,
        selected_text="Original OCR text",
        created_at=now,
        updated_at=now,
    )
    test_db.add(ocr)
    test_db.commit()

    trans = TranslationResult(
        manuscript_id=man_id,
        ocr_result_id=ocr.id,
        source_text="Original OCR text",
        translated_text="Original English translation",
        source_language="mal",
        target_language="en",
        status="completed",
        transcription_version=1,
        created_at=now,
        updated_at=now,
    )
    test_db.add(trans)
    test_db.commit()

    # 3. Edit translation manually via PATCH /api/manuscripts/{id}/translation
    edit_resp = client.patch(
        f"/api/manuscripts/{man_id}/translation",
        json={"corrected_translation": "Human improved English translation", "reviewer": "Historian Alice"},
    )
    assert edit_resp.status_code == 200
    edit_data = edit_resp.json()["data"]
    assert edit_data["translated_text"] == "Human improved English translation"
    assert edit_data["is_edited"] is True
    assert edit_data["original_translation"] == "Original English translation"

    # 4. Correct the source transcription via PATCH /api/manuscripts/{id}/transcription
    corr_resp = client.patch(
        f"/api/manuscripts/{man_id}/transcription",
        json={"corrected_text": "Updated manuscript source text", "reviewer": "Epigraphist Bob"},
    )
    assert corr_resp.status_code == 200
    corr_data = corr_resp.json()["data"]
    assert corr_data["version_number"] == 2
    assert corr_data["translation_stale"] is True

    # 5. Verify translation in DB is now marked stale
    test_db.refresh(trans)
    assert trans.status == "stale"
