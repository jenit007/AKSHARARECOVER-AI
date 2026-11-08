"""Tests for OCR capabilities, confidence analysis, and CER/WER error rate metrics."""

from app.services.confidence_service import ConfidenceService
from app.services.ocr_service import OCRService
from app.utils.text_utils import calculate_cer, calculate_wer, normalize_unicode


def test_confidence_analysis():
    service = ConfidenceService()
    lines = [
        {"text": "Confident line 1", "confidence": 0.95, "bounding_box": [10, 10, 100, 30]},
        {"text": "Confident line 2", "confidence": 0.82, "bounding_box": [10, 40, 100, 60]},
        {"text": "Faint line", "confidence": 0.55, "bounding_box": [10, 70, 100, 90]},
        {"text": "Uncertain stroke", "confidence": 0.40, "bounding_box": [10, 100, 100, 120]},
        {"text": "No confidence provided", "confidence": None, "bounding_box": [10, 130, 100, 150]},
    ]
    analysis = service.analyse(lines)
    summary = analysis["confidence_summary"]
    uncertain = analysis["uncertain_regions"]

    assert summary["total_lines"] == 5
    assert summary["confident_lines"] == 2
    assert summary["uncertain_lines"] == 3  # two below 0.70 + one with None
    assert summary["min_confidence"] == 0.40
    assert summary["max_confidence"] == 0.95
    assert len(uncertain) == 3


def test_cer_and_wer_metrics():
    # Exact match
    ref = "ധർമ്മക്ഷേത്രേ കുരുക്ഷേത്രേ"
    assert calculate_cer(ref, ref) == 0.0
    assert calculate_wer(ref, ref) == 0.0

    # One word modified
    hyp = "ധർമ്മക്ഷേത്രേ കുരുക്ഷേത്ര"
    cer = calculate_cer(ref, hyp)
    wer = calculate_wer(ref, hyp)
    assert 0.0 < cer < 0.2
    assert wer == 0.5

    # Completely different
    assert calculate_cer("abc", "xyz") == 1.0


def test_ocr_unsupported_language_handling():
    ocr_service = OCRService()
    # Query with a synthetic unsupported language code
    res = ocr_service.process_image("nonexistent.png", language="unsupported_script_xyz")
    assert "error" in res or res.get("lines") == []
