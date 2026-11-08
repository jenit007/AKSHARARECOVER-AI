"""Model loader – lazy loading and health checks for AI models."""

import logging
from typing import Any

logger = logging.getLogger("akshararecover.model_loader")

_loaded_models: dict[str, Any] = {}
_model_errors: dict[str, str] = {}


def load_model(name: str, loader_fn, *args, **kwargs) -> Any:
    """Load a model lazily. Returns cached instance on subsequent calls."""
    if name in _loaded_models:
        return _loaded_models[name]

    if name in _model_errors:
        logger.warning("Model '%s' previously failed to load: %s", name, _model_errors[name])
        return None

    try:
        logger.info("Loading model: %s", name)
        model = loader_fn(*args, **kwargs)
        _loaded_models[name] = model
        logger.info("Model '%s' loaded successfully", name)
        return model
    except Exception as exc:
        error_msg = f"{type(exc).__name__}: {exc}"
        _model_errors[name] = error_msg
        logger.error("Failed to load model '%s': %s", name, error_msg)
        return None


def is_model_loaded(name: str) -> bool:
    return name in _loaded_models


def get_model_status() -> list[dict]:
    """Return health/status information for all known models."""
    statuses = []
    for name, model in _loaded_models.items():
        statuses.append({
            "model": name,
            "loaded": True,
            "error": None,
        })
    for name, error in _model_errors.items():
        if name not in _loaded_models:
            statuses.append({
                "model": name,
                "loaded": False,
                "error": error,
            })
    return statuses


def unload_model(name: str):
    """Remove a model from cache."""
    _loaded_models.pop(name, None)
    _model_errors.pop(name, None)
