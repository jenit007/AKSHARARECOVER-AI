"""OCR service – pluggable OCR engine with PaddleOCR/EasyOCR support."""

import logging
import time
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.ai.engine_registry import register_ocr_engine

logger = logging.getLogger("akshararecover.ocr_service")

# ─── Language capability registry ────────────────────────────────────────────

PADDLEOCR_LANGUAGES = {
    "en": "en", "ch": "ch", "chinese_cht": "chinese_cht",
    "hi": "hi", "ta": "ta", "te": "te", "ka": "ka",
    "mr": "mr", "ne": "ne",
    "ar": "ar", "fa": "fa", "ur": "ur",
    "fr": "french", "de": "german", "ko": "korean",
    "ja": "japan", "la": "latin", "ru": "cyrillic",
    "devanagari": "devanagari",
    "mal": "ml",  # Malayalam not natively supported – will try ml/en
}

EASYOCR_LANGUAGES = {
    "en": ["en"], "hi": ["hi", "en"], "mr": ["mr", "en"], "ne": ["ne", "en"],
    "sa": ["hi", "en"], "sanskrit": ["hi", "en"], "devanagari": ["hi", "en"],
    "ta": ["ta", "en"], "te": ["te", "en"], "ka": ["kn", "en"],
    "mal": ["en"], "ml": ["en"], "malayalam": ["en"],  # EasyOCR uses craft+en fallback; no native ml recognizer installed
    "ar": ["ar"], "fa": ["fa"],
    "fr": ["fr"], "de": ["de"], "ko": ["ko"], "ja": ["ja"],
}


class PaddleOCREngine:
    """PaddleOCR-based OCR engine."""

    engine_name = "paddleocr"

    def __init__(self):
        self._model = None
        self._current_lang: str | None = None
        self._available = False
        self._init_error: str | None = None

    def _ensure_loaded(self, lang: str = "en"):
        if self._model is not None and self._current_lang == lang:
            return
        try:
            from paddleocr import PaddleOCR

            paddle_lang = PADDLEOCR_LANGUAGES.get(lang, lang)
            self._model = PaddleOCR(
                use_angle_cls=True,
                lang=paddle_lang,
                show_log=False,
                use_gpu=False,  # PaddlePaddle GPU requires separate install
            )
            self._current_lang = lang
            self._available = True
            logger.info("PaddleOCR loaded for language: %s", paddle_lang)
        except Exception as exc:
            self._init_error = str(exc)
            logger.error("PaddleOCR init failed: %s", exc)
            raise

    def get_supported_languages(self) -> list[str]:
        return list(PADDLEOCR_LANGUAGES.keys())

    def supports_language(self, lang: str) -> bool:
        return lang in PADDLEOCR_LANGUAGES

    def process_image(self, image_path: str, language: str = "en") -> dict:
        self._ensure_loaded(language)
        start = time.time()
        result = self._model.ocr(image_path, cls=True)
        elapsed = time.time() - start

        lines = []
        full_text_parts = []

        if result and result[0]:
            for item in result[0]:
                box = item[0]
                text = item[1][0]
                conf = float(item[1][1])

                # Flatten box to [x1, y1, x2, y2]
                xs = [p[0] for p in box]
                ys = [p[1] for p in box]
                bbox = [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]

                threshold = get_settings().OCR_CONFIDENCE_THRESHOLD
                lines.append({
                    "text": text,
                    "confidence": round(conf, 4),
                    "bounding_box": bbox,
                    "is_uncertain": conf < threshold,
                })
                full_text_parts.append(text)

        return {
            "engine": "PaddleOCR",
            "model_name": f"paddleocr-{PADDLEOCR_LANGUAGES.get(language, language)}",
            "language": language,
            "full_text": "\n".join(full_text_parts),
            "lines": lines,
            "processing_time": round(elapsed, 3),
        }


class EasyOCREngine:
    """EasyOCR-based OCR engine."""

    engine_name = "easyocr"

    def __init__(self):
        self._reader = None
        self._current_langs: list[str] | None = None
        self._available = False

    def _ensure_loaded(self, lang: str = "en"):
        langs = EASYOCR_LANGUAGES.get(lang, [lang])
        if self._reader is not None and self._current_langs == langs:
            return
        try:
            import easyocr

            gpu = False
            try:
                import torch
                gpu = torch.cuda.is_available()
            except ImportError:
                pass

            self._reader = easyocr.Reader(langs, gpu=gpu)
            self._current_langs = langs
            self._available = True
            logger.info("EasyOCR loaded for languages: %s (GPU=%s)", langs, gpu)
        except Exception as exc:
            logger.error("EasyOCR init failed: %s", exc)
            raise

    def get_supported_languages(self) -> list[str]:
        return list(EASYOCR_LANGUAGES.keys())

    def supports_language(self, lang: str) -> bool:
        return lang in EASYOCR_LANGUAGES

    def process_image(self, image_path: str, language: str = "en") -> dict:
        self._ensure_loaded(language)
        start = time.time()
        results = self._reader.readtext(image_path)
        elapsed = time.time() - start

        lines = []
        full_text_parts = []
        threshold = get_settings().OCR_CONFIDENCE_THRESHOLD

        for bbox_points, text, conf in results:
            # bbox_points is list of 4 [x,y] pairs
            xs = [p[0] for p in bbox_points]
            ys = [p[1] for p in bbox_points]
            bbox = [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]

            lines.append({
                "text": text,
                "confidence": round(float(conf), 4),
                "bounding_box": bbox,
                "is_uncertain": float(conf) < threshold,
            })
            full_text_parts.append(text)

        return {
            "engine": "EasyOCR",
            "model_name": "easyocr",
            "language": language,
            "full_text": "\n".join(full_text_parts),
            "lines": lines,
            "processing_time": round(elapsed, 3),
        }


class OCRService:
    """High-level OCR service that dispatches to the configured engine."""

    def __init__(self):
        self.settings = get_settings()
        self._engines: dict[str, Any] = {}
        self._init_engines()

    def _init_engines(self):
        """Try to initialise available OCR engines."""
        # PaddleOCR
        try:
            import paddleocr  # noqa: F401
            engine = PaddleOCREngine()
            self._engines["paddleocr"] = engine
            register_ocr_engine("paddleocr", engine)
            logger.info("PaddleOCR engine available")
        except ImportError:
            logger.info("PaddleOCR not installed – skipping")

        # EasyOCR
        try:
            import easyocr  # noqa: F401
            engine = EasyOCREngine()
            self._engines["easyocr"] = engine
            register_ocr_engine("easyocr", engine)
            logger.info("EasyOCR engine available")
        except ImportError:
            logger.info("EasyOCR not installed – skipping")

    def get_engine(self, name: str | None = None):
        """Return the requested or default engine."""
        name = name or self.settings.OCR_ENGINE
        engine = self._engines.get(name)
        if engine is None:
            available = list(self._engines.keys())
            if available:
                logger.warning("Engine '%s' not available. Using '%s'", name, available[0])
                return self._engines[available[0]]
            return None
        return engine

    def is_available(self) -> bool:
        return len(self._engines) > 0

    def get_available_engines(self) -> list[str]:
        return list(self._engines.keys())

    def process_image(self, image_path: str, language: str = "en", engine_name: str | None = None) -> dict:
        """Process a single image and return OCR results."""
        engine = self.get_engine(engine_name)
        if engine is None:
            return {
                "engine": None,
                "model_name": None,
                "language": language,
                "full_text": "",
                "lines": [],
                "processing_time": 0,
                "error": "No OCR engine available. Install paddleocr or easyocr.",
            }

        if not engine.supports_language(language):
            return {
                "engine": engine.engine_name,
                "model_name": None,
                "language": language,
                "full_text": "",
                "lines": [],
                "processing_time": 0,
                "error": f"Language '{language}' is not supported by {engine.engine_name}. "
                         f"Supported: {engine.get_supported_languages()}",
            }

        try:
            return engine.process_image(image_path, language)
        except Exception as exc:
            logger.error("OCR processing failed: %s", exc)
            return {
                "engine": engine.engine_name,
                "model_name": None,
                "language": language,
                "full_text": "",
                "lines": [],
                "processing_time": 0,
                "error": f"OCR processing error: {type(exc).__name__}: {exc}",
            }
