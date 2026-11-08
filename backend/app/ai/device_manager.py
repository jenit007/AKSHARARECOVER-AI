"""Device manager – detects CPU/CUDA and manages AI inference device."""

import logging

logger = logging.getLogger("akshararecover.device_manager")

_selected_device: str | None = None
_device_info: dict = {}


def detect_device(preference: str = "auto") -> str:
    """Detect the best available device. Returns 'cuda' or 'cpu'."""
    global _selected_device, _device_info

    _device_info = {
        "pytorch_installed": False,
        "cuda_available": False,
        "cuda_version": None,
        "gpu_name": None,
        "gpu_memory_mb": None,
        "selected_device": "cpu",
    }

    try:
        import torch

        _device_info["pytorch_installed"] = True
        _device_info["cuda_available"] = torch.cuda.is_available()

        if torch.cuda.is_available():
            _device_info["cuda_version"] = torch.version.cuda
            _device_info["gpu_name"] = torch.cuda.get_device_name(0)
            _device_info["gpu_memory_mb"] = round(
                torch.cuda.get_device_properties(0).total_mem / 1024 / 1024
            )
    except ImportError:
        logger.info("PyTorch not installed – using CPU only")
    except Exception as exc:
        logger.warning("Error detecting CUDA: %s", exc)

    if preference == "cuda":
        if _device_info["cuda_available"]:
            _selected_device = "cuda"
        else:
            logger.warning("CUDA requested but not available; falling back to CPU")
            _selected_device = "cpu"
    elif preference == "cpu":
        _selected_device = "cpu"
    else:  # auto
        _selected_device = "cuda" if _device_info["cuda_available"] else "cpu"

    _device_info["selected_device"] = _selected_device
    logger.info("AI device: %s | Info: %s", _selected_device, _device_info)
    return _selected_device


def get_device() -> str:
    """Return the current device string."""
    if _selected_device is None:
        from app.config import get_settings
        return detect_device(get_settings().AI_DEVICE)
    return _selected_device


def get_device_info() -> dict:
    """Return device information dict."""
    if not _device_info:
        get_device()
    return dict(_device_info)
