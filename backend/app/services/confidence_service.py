"""Confidence analysis service."""

import logging
from app.config import get_settings

logger = logging.getLogger("akshararecover.confidence_service")


class ConfidenceService:
    """Analyse OCR confidence values and identify uncertain regions."""

    def __init__(self):
        self.threshold = get_settings().OCR_CONFIDENCE_THRESHOLD

    def analyse(self, ocr_lines: list[dict]) -> dict:
        """
        Analyse OCR line results and produce a confidence summary.

        Parameters
        ----------
        ocr_lines : list of dicts with keys text, confidence, bounding_box

        Returns
        -------
        dict with confidence_summary, uncertain_regions
        """
        if not ocr_lines:
            return {
                "confidence_summary": {
                    "total_lines": 0,
                    "confident_lines": 0,
                    "uncertain_lines": 0,
                    "average_confidence": None,
                    "min_confidence": None,
                    "max_confidence": None,
                    "threshold": self.threshold,
                },
                "uncertain_regions": [],
            }

        confidences = []
        uncertain_regions = []

        for line in ocr_lines:
            conf = line.get("confidence")
            if conf is None:
                # Engine didn't provide confidence
                uncertain_regions.append({
                    "text": line.get("text", ""),
                    "confidence": None,
                    "bounding_box": line.get("bounding_box"),
                    "reason": "confidence_unavailable",
                })
                continue

            confidences.append(conf)
            if conf < self.threshold:
                uncertain_regions.append({
                    "text": line.get("text", ""),
                    "confidence": round(conf, 4),
                    "bounding_box": line.get("bounding_box"),
                    "reason": "below_threshold",
                })

        avg = round(sum(confidences) / len(confidences), 4) if confidences else None
        return {
            "confidence_summary": {
                "total_lines": len(ocr_lines),
                "confident_lines": sum(1 for c in confidences if c >= self.threshold),
                "uncertain_lines": len(uncertain_regions),
                "average_confidence": avg,
                "min_confidence": round(min(confidences), 4) if confidences else None,
                "max_confidence": round(max(confidences), 4) if confidences else None,
                "threshold": self.threshold,
            },
            "uncertain_regions": uncertain_regions,
        }
