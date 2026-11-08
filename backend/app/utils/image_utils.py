"""Image helper utilities."""

import io
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
import logging

logger = logging.getLogger("akshararecover.image_utils")


def pil_to_cv2(pil_img: Image.Image) -> np.ndarray:
    """Convert a PIL Image to an OpenCV BGR numpy array."""
    if pil_img.mode == "RGBA":
        pil_img = pil_img.convert("RGB")
    elif pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)


def cv2_to_pil(cv_img: np.ndarray) -> Image.Image:
    """Convert OpenCV BGR array to PIL Image."""
    rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)


def load_image_bytes(data: bytes) -> np.ndarray:
    """Decode raw bytes into an OpenCV BGR image."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image from bytes.")
    return img


def save_cv2_image(img: np.ndarray, path: str | Path, quality: int = 95) -> str:
    """Write an OpenCV image to disk. Returns the path as string."""
    path = str(path)
    params = []
    if path.lower().endswith((".jpg", ".jpeg")):
        params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    elif path.lower().endswith(".png"):
        params = [cv2.IMWRITE_PNG_COMPRESSION, 3]
    cv2.imwrite(path, img, params)
    return path


def generate_preview(data: bytes, output_path: str | Path, max_size: int = 800) -> str:
    """Create a thumbnail preview image."""
    img = Image.open(io.BytesIO(data))
    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    if img.mode == "RGBA":
        img = img.convert("RGB")
    output_path = str(output_path)
    img.save(output_path, "JPEG", quality=85)
    return output_path


def pdf_to_images(data: bytes, dpi: int = 200) -> list[Image.Image]:
    """Convert PDF bytes to a list of PIL Images (one per page)."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    images = []
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    for page in doc:
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        images.append(img)
    doc.close()
    return images
