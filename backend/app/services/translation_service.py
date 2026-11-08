"""Translation service – pluggable translation engine supporting NLLB-200 and API fallback."""

import logging
import time
from typing import Any, Optional

from app.config import get_settings
from app.ai.engine_registry import register_translation_engine
from app.ai.device_manager import get_device

logger = logging.getLogger("akshararecover.translation_service")

# Mapping of common language identifiers to NLLB-200 language codes
NLLB_LANGUAGE_MAP = {
    "mal": "mal_Mlym",
    "ml": "mal_Mlym",
    "malayalam": "mal_Mlym",
    "en": "eng_Latn",
    "eng": "eng_Latn",
    "english": "eng_Latn",
    "hi": "hin_Deva",
    "hin": "hin_Deva",
    "hindi": "hin_Deva",
    "sa": "san_Deva",
    "san": "san_Deva",
    "sanskrit": "san_Deva",
    "ta": "tam_Taml",
    "tam": "tam_Taml",
    "tamil": "tam_Taml",
    "te": "tel_Telu",
    "tel": "tel_Telu",
    "telugu": "tel_Telu",
    "kn": "kan_Knda",
    "kan": "kan_Knda",
    "kannada": "kan_Knda",
    "mr": "mar_Deva",
    "mar": "mar_Deva",
    "marathi": "mar_Deva",
    "bn": "ben_Beng",
    "ben": "ben_Beng",
    "bengali": "ben_Beng",
    "gu": "guj_Gujr",
    "guj": "guj_Gujr",
    "gujarati": "guj_Gujr",
    "pa": "pan_Guru",
    "pan": "pan_Guru",
    "punjabi": "pan_Guru",
    "or": "ory_Orya",
    "ory": "ory_Orya",
    "odia": "ory_Orya",
    "ur": "urd_Arab",
    "urd": "urd_Arab",
    "urdu": "urd_Arab",
}


class NLLBTranslationEngine:
    """NLLB-200 local translation engine using HuggingFace Transformers."""

    engine_name = "nllb"

    def __init__(self, model_name: Optional[str] = None):
        settings = get_settings()
        self.model_name = model_name or settings.TRANSLATION_MODEL or "facebook/nllb-200-distilled-600M"
        self._tokenizer = None
        self._model = None
        self._device = None
        self._is_loaded = False
        self._load_error = None

    def _ensure_loaded(self):
        if self._is_loaded:
            return
        if self._load_error:
            raise RuntimeError(f"NLLB model loading previously failed: {self._load_error}")

        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            import torch

            device_str = get_device()
            self._device = "cuda" if device_str == "cuda" and torch.cuda.is_available() else "cpu"

            logger.info("Loading NLLB model '%s' on %s...", self.model_name, self._device)
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            self._model.to(self._device)
            self._model.eval()
            self._is_loaded = True
            logger.info("NLLB model successfully loaded on %s", self._device)
        except Exception as exc:
            self._load_error = str(exc)
            logger.error("Failed to load NLLB model '%s': %s", self.model_name, exc)
            raise RuntimeError(f"Failed to load NLLB model: {exc}")

    def get_supported_pairs(self) -> list[tuple[str, str]]:
        langs = list(NLLB_LANGUAGE_MAP.keys())
        return [(src, "en") for src in langs]

    def supports_pair(self, src: str, tgt: str) -> bool:
        src_clean = src.lower().strip()
        tgt_clean = tgt.lower().strip()
        return src_clean in NLLB_LANGUAGE_MAP and tgt_clean in NLLB_LANGUAGE_MAP

    def translate(self, text: str, src_lang: str, tgt_lang: str, mode: str = "contextual") -> dict:
        self._ensure_loaded()
        import torch

        src_nllb = NLLB_LANGUAGE_MAP.get(src_lang.lower().strip())
        tgt_nllb = NLLB_LANGUAGE_MAP.get(tgt_lang.lower().strip())

        if not src_nllb or not tgt_nllb:
            raise ValueError(f"Unsupported language pair: {src_lang} -> {tgt_lang}")

        start_time = time.time()

        # Split text into manageable chunks preserving paragraphs/lines
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        translated_paragraphs = []
        uncertainty_notes = []

        for p in paragraphs:
            inputs = self._tokenizer(p, return_tensors="pt", truncation=True, max_length=512)
            inputs = {k: v.to(self._device) for k, v in inputs.items()}

            forced_bos_token_id = self._tokenizer.convert_tokens_to_ids(tgt_nllb)
            with torch.no_grad():
                gen_tokens = self._model.generate(
                    **inputs,
                    forced_bos_token_id=forced_bos_token_id,
                    max_length=512,
                    num_beams=4 if mode == "contextual" else 2,
                    early_stopping=True,
                )
            trans_chunk = self._tokenizer.batch_decode(gen_tokens, skip_special_tokens=True)[0]
            translated_paragraphs.append(trans_chunk)

            # Check for ambiguity markers or question marks in chunk
            if "?" in p or len(p.split()) < 3:
                uncertainty_notes.append({
                    "fragment": p,
                    "note": "Short or ambiguous fragment in historical source; context may be limited.",
                })

        final_translation = "\n".join(translated_paragraphs)
        elapsed = time.time() - start_time

        return {
            "source_text": text,
            "translated_text": final_translation,
            "source_language": src_lang,
            "target_language": tgt_lang,
            "translation_model": self.model_name,
            "model_version": "distilled-600M",
            "translation_mode": mode,
            "uncertainty_notes": uncertainty_notes,
            "processing_time": round(elapsed, 3),
        }


class ExternalAPITranslationEngine:
    """Optional External API Translation Engine (e.g., custom LLM or Translation API)."""

    engine_name = "api"

    def __init__(self):
        settings = get_settings()
        self.api_url = settings.TRANSLATION_API_URL
        self.api_key = settings.TRANSLATION_API_KEY

    def supports_pair(self, src: str, tgt: str) -> bool:
        return bool(self.api_url and self.api_key)

    def translate(self, text: str, src_lang: str, tgt_lang: str, mode: str = "contextual") -> dict:
        import httpx

        if not self.api_url or not self.api_key:
            raise RuntimeError("External translation API URL and Key must be configured in environment.")

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "text": text,
            "source_language": src_lang,
            "target_language": tgt_lang,
            "mode": mode,
        }
        resp = httpx.post(self.api_url, json=payload, headers=headers, timeout=30.0)
        resp.raise_for_status()
        data = resp.json()
        return {
            "source_text": text,
            "translated_text": data.get("translation", ""),
            "source_language": src_lang,
            "target_language": tgt_lang,
            "translation_model": "external_api",
            "model_version": "1.0",
            "translation_mode": mode,
            "uncertainty_notes": data.get("uncertainty_notes", []),
        }


class TranslationService:
    """Translation manager and orchestrator."""

    def __init__(self):
        self.settings = get_settings()
        self._engines: dict[str, Any] = {}
        self._init_engines()

    def _init_engines(self):
        # Register NLLB engine
        try:
            nllb_eng = NLLBTranslationEngine()
            self._engines["nllb"] = nllb_eng
            register_translation_engine("nllb", nllb_eng)
        except Exception as exc:
            logger.info("NLLB translation engine not registered: %s", exc)

        # Register API engine if configured
        if self.settings.TRANSLATION_API_URL and self.settings.TRANSLATION_API_KEY:
            api_eng = ExternalAPITranslationEngine()
            self._engines["api"] = api_eng
            register_translation_engine("api", api_eng)

    def is_engine_available(self, name: Optional[str] = None) -> bool:
        name = name or self.settings.TRANSLATION_ENGINE
        if name == "none":
            return False
        return name in self._engines

    def translate_text(
        self,
        text: str,
        src_lang: str,
        tgt_lang: str = "en",
        mode: str = "contextual",
        engine_name: Optional[str] = None,
    ) -> dict:
        """
        Translate extracted text to target language.
        Never fabricate translations. Returns clear error if service is unavailable.
        """
        if not text or not text.strip():
            return {
                "source_text": "",
                "translated_text": "",
                "source_language": src_lang,
                "target_language": tgt_lang,
                "translation_model": "none",
                "model_version": None,
                "transcription_version": 1,
                "uncertainty_notes": [],
            }

        engine_name = engine_name or self.settings.TRANSLATION_ENGINE
        if engine_name == "none":
            raise RuntimeError("Translation engine is set to 'none'. Configure a valid TRANSLATION_ENGINE in .env.")

        engine = self._engines.get(engine_name)
        if not engine:
            raise RuntimeError(
                f"Translation engine '{engine_name}' is unavailable. "
                f"Available engines: {list(self._engines.keys())}"
            )

        if not engine.supports_pair(src_lang, tgt_lang):
            raise ValueError(
                f"Language pair '{src_lang}' -> '{tgt_lang}' is not supported by {engine_name}."
            )

        return engine.translate(text=text, src_lang=src_lang, tgt_lang=tgt_lang, mode=mode)
