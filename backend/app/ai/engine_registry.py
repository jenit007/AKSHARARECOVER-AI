"""Engine registry – pluggable OCR and translation engine management."""

import logging
from typing import Protocol, Any

logger = logging.getLogger("akshararecover.engine_registry")


class OCREngine(Protocol):
    """Interface for OCR engines."""

    engine_name: str

    def get_supported_languages(self) -> list[str]: ...
    def supports_language(self, lang: str) -> bool: ...
    def process_image(self, image_path: str, language: str) -> dict: ...


class TranslationEngine(Protocol):
    """Interface for translation engines."""

    engine_name: str

    def get_supported_pairs(self) -> list[tuple[str, str]]: ...
    def supports_pair(self, src: str, tgt: str) -> bool: ...
    def translate(self, text: str, src_lang: str, tgt_lang: str, mode: str = "contextual") -> dict: ...


_ocr_engines: dict[str, OCREngine] = {}
_translation_engines: dict[str, TranslationEngine] = {}


def register_ocr_engine(name: str, engine: OCREngine):
    _ocr_engines[name] = engine
    logger.info("Registered OCR engine: %s", name)


def register_translation_engine(name: str, engine: TranslationEngine):
    _translation_engines[name] = engine
    logger.info("Registered translation engine: %s", name)


def get_ocr_engine(name: str | None = None) -> OCREngine | None:
    if name is None:
        from app.config import get_settings
        name = get_settings().OCR_ENGINE
    return _ocr_engines.get(name)


def get_translation_engine(name: str | None = None) -> TranslationEngine | None:
    if name is None:
        from app.config import get_settings
        name = get_settings().TRANSLATION_ENGINE
    return _translation_engines.get(name)


def list_ocr_engines() -> list[str]:
    return list(_ocr_engines.keys())


def list_translation_engines() -> list[str]:
    return list(_translation_engines.keys())
