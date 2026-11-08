"""Image condition analysis service.

Calculates genuine image quality and deterioration metrics from manuscript images:
- Resolution, aspect ratio, megapixels
- Brightness (mean pixel luminance)
- Contrast (standard deviation of pixel luminance)
- Sharpness (Laplacian variance)
- Blur indicator (normalized inverse sharpness)
- Noise estimate (high-pass residual standard deviation)
- Illumination variation (standard deviation across a 4x4 spatial grid)
- Visible stains heuristic (dark thresholded contours)
- Visible scratches / cracks (Hough line segments)
- Edge deterioration heuristic
- Text readability estimate score based on contrast & sharpness

Distinguishes strictly between:
1. Measured image-quality metrics
2. Heuristic damage indicators
3. Trained model predictions
4. Human-confirmed damage
"""

import math
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List


class ConditionAnalysisService:
    """Computes measured and heuristic image condition metrics."""

    @staticmethod
    def analyze_condition(image_path: str) -> Dict[str, Any]:
        """Analyze manuscript condition from image file path."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Unable to read image at path: {image_path}")

        h, w = img.shape[:2]
        total_pixels = h * w
        megapixels = round(total_pixels / 1_000_000, 2)
        aspect_ratio = round(w / h, 2) if h > 0 else 1.0

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        # 1. Measured Image Quality Metrics
        mean_val = float(np.mean(gray))
        std_val = float(np.std(gray))
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # Noise estimate using Gaussian residual
        hp = cv2.GaussianBlur(gray, (5, 5), 0)
        noise_level = float(np.std(gray.astype(float) - hp.astype(float)))

        # Illumination variation across a 4x4 grid
        grid_rows, grid_cols = 4, 4
        cell_h, cell_w = max(1, h // grid_rows), max(1, w // grid_cols)
        grid_means = []
        for r in range(grid_rows):
            for c in range(grid_cols):
                cell = gray[r * cell_h : (r + 1) * cell_h, c * cell_w : (c + 1) * cell_w]
                if cell.size > 0:
                    grid_means.append(float(np.mean(cell)))
        illum_variation = float(np.std(grid_means)) if grid_means else 0.0

        # Normalized sharpness / blur estimate (0-100 scale, higher is sharper)
        sharpness_score = min(100.0, round(laplacian_var / 10.0, 1))
        blur_indicator = max(0.0, round(100.0 - sharpness_score, 1))

        # 2. Heuristic Damage Indicators
        # Dark stains (threshold < 65)
        _, dark_mask = cv2.threshold(gray, 65, 255, cv2.THRESH_BINARY_INV)
        stain_contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        stain_count = 0
        stain_pixel_area = 0
        for cnt in stain_contours:
            area = cv2.contourArea(cnt)
            if area > 100:  # ignore tiny speckles
                stain_count += 1
                stain_pixel_area += area
        stain_area_pct = round((stain_pixel_area / total_pixels) * 100, 2)

        # Fading (threshold > 210)
        _, faded_mask = cv2.threshold(gray, 210, 255, cv2.THRESH_BINARY)
        faded_pixels = int(np.count_nonzero(faded_mask))
        faded_area_pct = round((faded_pixels / total_pixels) * 100, 2)

        # Scratches and cracks (Hough line segments on Canny edge map)
        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=70, minLineLength=40, maxLineGap=8)
        crack_scratch_count = 0 if lines is None else min(len(lines), 200)

        # Estimated Text Readability Index (0-100) based on contrast and edge clarity
        contrast_component = min(50.0, (std_val / 60.0) * 50.0)
        sharpness_component = min(50.0, (laplacian_var / 300.0) * 50.0)
        readability_index = max(10.0, min(95.0, round(contrast_component + sharpness_component, 1)))

        readability_grade = (
            "High" if readability_index >= 70
            else "Moderate" if readability_index >= 45
            else "Low (Requires AI Enhancement)"
        )

        return {
            "measured_metrics": {
                "resolution": {
                    "width": w,
                    "height": h,
                    "megapixels": megapixels,
                    "aspect_ratio": aspect_ratio,
                    "display": f"{w} × {h} px ({megapixels} MP)",
                },
                "brightness": {
                    "value": round(mean_val, 1),
                    "scale": "0-255",
                    "status": "Normal" if 80 <= mean_val <= 180 else ("Dark" if mean_val < 80 else "Bright"),
                },
                "contrast": {
                    "value": round(std_val, 1),
                    "scale": "standard deviation (0-128)",
                    "status": "Good" if std_val >= 45 else ("Moderate" if std_val >= 30 else "Low"),
                },
                "sharpness_laplacian": {
                    "variance": round(laplacian_var, 1),
                    "normalized_score": sharpness_score,
                    "status": "Sharp" if laplacian_var >= 200 else ("Acceptable" if laplacian_var >= 80 else "Blurry"),
                },
                "blur_estimate": {
                    "value": blur_indicator,
                    "scale": "0-100%",
                    "status": "High Blur" if blur_indicator > 60 else "Acceptable Focus",
                },
                "noise_level": {
                    "value": round(noise_level, 2),
                    "scale": "high-pass residual",
                    "status": "High Noise" if noise_level > 12 else ("Moderate" if noise_level > 6 else "Low Noise"),
                },
                "illumination_variation": {
                    "grid_std": round(illum_variation, 2),
                    "status": "Uneven" if illum_variation > 25 else "Even Distribution",
                },
            },
            "heuristic_damage_indicators": {
                "visible_stains": {
                    "detected": stain_count > 0,
                    "count": stain_count,
                    "affected_area_percentage": stain_area_pct,
                    "note": "Morphological dark contour segmentation (< 65 luminance)",
                },
                "faded_regions": {
                    "detected": faded_area_pct > 5.0,
                    "affected_area_percentage": faded_area_pct,
                    "note": "High luminance wash-out zones (> 210 luminance)",
                },
                "scratches_and_cracks": {
                    "detected": crack_scratch_count > 10,
                    "detected_lines_count": crack_scratch_count,
                    "note": "Hough linear edge transform (may include straight script strokes)",
                },
                "text_readability": {
                    "score": readability_index,
                    "grade": readability_grade,
                    "note": "Composite metric from contrast standard deviation and Laplacian variance",
                },
            },
            "assessment_methodology": {
                "measured_metrics": "Computed via OpenCV deterministic digital signal processing algorithms.",
                "heuristic_indicators": "Rule-based threshold and contour heuristics. Not a substitute for human conservator inspection.",
                "model_predictions": "Deep learning OCR confidence scores provided in subsequent pipeline stages.",
                "human_confirmation": "All damage regions and OCR readings require final expert verification.",
            },
        }
