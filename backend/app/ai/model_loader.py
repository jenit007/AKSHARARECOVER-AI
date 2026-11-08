# Re-export model_loader for backward compat
from app.ai.models import load_model, is_model_loaded, get_model_status, unload_model

__all__ = ["load_model", "is_model_loaded", "get_model_status", "unload_model"]
