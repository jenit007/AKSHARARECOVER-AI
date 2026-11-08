"""Image processing service – enhancement using OpenCV with intermediate artifact persistence."""

import time
import logging
from pathlib import Path
from typing import Dict, Any, List

import cv2
import numpy as np

from app.config import get_settings
from app.utils.image_utils import save_cv2_image

logger = logging.getLogger("akshararecover.image_processing")


class ImageProcessingService:
    """Enhance manuscript images using OpenCV techniques and persist intermediate outputs."""

    def __init__(self):
        self.settings = get_settings()

    @staticmethod
    def to_grayscale(img: np.ndarray) -> np.ndarray:
        if len(img.shape) == 3:
            return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        return img

    @staticmethod
    def denoise(img: np.ndarray, strength: int = 10) -> np.ndarray:
        if len(img.shape) == 2:
            return cv2.fastNlMeansDenoising(img, None, strength, 7, 21)
        return cv2.fastNlMeansDenoisingColored(img, None, strength, strength, 7, 21)

    @staticmethod
    def clahe_enhance(gray: np.ndarray, clip_limit: float = 3.0, grid: int = 8) -> np.ndarray:
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(grid, grid))
        return clahe.apply(gray)

    @staticmethod
    def adaptive_threshold(gray: np.ndarray, block_size: int = 15, c: int = 10) -> np.ndarray:
        return cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, c
        )

    @staticmethod
    def gaussian_blur(img: np.ndarray, ksize: int = 3) -> np.ndarray:
        return cv2.GaussianBlur(img, (ksize, ksize), 0)

    @staticmethod
    def sharpen(img: np.ndarray) -> np.ndarray:
        blurred = cv2.GaussianBlur(img, (0, 0), 3)
        return cv2.addWeighted(img, 1.5, blurred, -0.5, 0)

    @staticmethod
    def measure_quality(img: np.ndarray) -> dict:
        gray = img if len(img.shape) == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        hp = cv2.GaussianBlur(gray, (5, 5), 0)
        noise = float(np.std(gray.astype(float) - hp.astype(float)))

        return {
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "sharpness_laplacian": round(laplacian_var, 2),
            "noise_estimate": round(noise, 2),
            "width": img.shape[1],
            "height": img.shape[0],
        }

    def enhance_image(self, image_path: str, output_dir: str | Path | None = None) -> Dict[str, Any]:
        """Apply sequential enhancement pipeline and save every intermediate step."""
        start = time.time()
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")

        quality_before = self.measure_quality(img)
        methods_applied: List[str] = []

        if output_dir is None:
            output_dir = self.settings.upload_processed_dir
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        stem = Path(image_path).stem

        # Intermediate 1: Grayscale
        gray = self.to_grayscale(img)
        grayscale_path = str(out_path / f"{stem}_grayscale.png")
        save_cv2_image(gray, grayscale_path)
        methods_applied.append("grayscale_conversion")

        # Intermediate 2: Denoised
        denoised = self.denoise(gray, strength=10)
        denoised_path = str(out_path / f"{stem}_denoised.png")
        save_cv2_image(denoised, denoised_path)
        methods_applied.append("fast_nl_means_denoising")

        # Intermediate 3: Contrast Enhanced (CLAHE)
        contrast_enh = self.clahe_enhance(denoised, clip_limit=2.8, grid=8)
        contrast_path = str(out_path / f"{stem}_contrast_enhanced.png")
        save_cv2_image(contrast_enh, contrast_path)
        methods_applied.append("clahe_contrast_normalization")

        # Intermediate 4: Final Sharpened & Enhanced
        final_enhanced = self.sharpen(contrast_enh)
        final_path = str(out_path / f"{stem}_final_enhanced.png")
        save_cv2_image(final_enhanced, final_path)
        methods_applied.append("unsharp_mask_sharpening")

        # Legacy enhanced path compatibility
        legacy_path = str(out_path / f"{stem}_enhanced.png")
        save_cv2_image(final_enhanced, legacy_path)

        quality_after = self.measure_quality(final_enhanced)
        proc_time = round(time.time() - start, 3)

        return {
            "enhanced_image_path": final_path,
            "legacy_enhanced_path": legacy_path,
            "grayscale_path": grayscale_path,
            "denoised_path": denoised_path,
            "contrast_path": contrast_path,
            "intermediate_images": {
                "grayscale": grayscale_path,
                "denoised": denoised_path,
                "contrast_enhanced": contrast_path,
                "final_enhanced": final_path,
            },
            "enhancement_method": " + ".join(methods_applied),
            "methods_applied": methods_applied,
            "quality_before": quality_before,
            "quality_after": quality_after,
            "processing_time": proc_time,
        }
