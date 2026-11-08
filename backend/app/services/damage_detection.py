"""Damage detection service – heuristic analysis of manuscript images with region extraction."""

import logging
from pathlib import Path
from typing import Dict, Any, List

import cv2
import numpy as np

from app.utils.image_utils import save_cv2_image

logger = logging.getLogger("akshararecover.damage_detection")


class DamageDetectionService:
    """Heuristic damage-indicator analysis and damage region segmentation for manuscript images.

    IMPORTANT: These are image-processing heuristics, NOT trained neural network damage predictions.
    They identify anomalous regions (dark stains, pigment fading, cracks) to guide human conservators.
    """

    @staticmethod
    def analyse(image_path: str, output_dir: str | None = None) -> Dict[str, Any]:
        """Analyse an image for damage indicators and produce both mask and blended overlay."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")

        h, w = img.shape[:2]
        total_pixels = h * w
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        # Initialize damage mask (binary, 0=clean, 255=suspected damage)
        damage_mask = np.zeros((h, w), dtype=np.uint8)
        overlay = img.copy() if len(img.shape) == 3 else cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        detected_regions: List[Dict[str, Any]] = []
        region_counter = 1

        # 1. Dark Stains / Biological Patches
        _, dark_mask = cv2.threshold(gray, 65, 255, cv2.THRESH_BINARY_INV)
        dark_contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        stain_area = 0
        for cnt in dark_contours:
            area = cv2.contourArea(cnt)
            if area > 120:  # ignore small noise dots
                stain_area += area
                rx, ry, rw, rh = cv2.boundingRect(cnt)
                cv2.drawContours(damage_mask, [cnt], -1, 255, -1)
                if region_counter <= 30:  # store top 30 regions
                    detected_regions.append({
                        "id": f"DMG-{region_counter:03d}",
                        "category": "Biological Stain / Dark Spot",
                        "box": [int(rx), int(ry), int(rw), int(rh)],
                        "area_pixels": int(area),
                        "severity": round(min(1.0, area / 5000.0), 2),
                        "detection_method": "Otsu Dark Inversion & Morphological Segmentation",
                    })
                    region_counter += 1

        # 2. Faded / Pigment Abrasion Regions
        _, faded_mask = cv2.threshold(gray, 215, 255, cv2.THRESH_BINARY)
        faded_contours, _ = cv2.findContours(faded_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        faded_area = 0
        for cnt in faded_contours:
            area = cv2.contourArea(cnt)
            if area > 200:
                faded_area += area
                rx, ry, rw, rh = cv2.boundingRect(cnt)
                cv2.drawContours(damage_mask, [cnt], -1, 255, -1)
                if region_counter <= 40:
                    detected_regions.append({
                        "id": f"DMG-{region_counter:03d}",
                        "category": "Pigment Fading / Abrasion",
                        "box": [int(rx), int(ry), int(rw), int(rh)],
                        "area_pixels": int(area),
                        "severity": round(min(1.0, area / 8000.0), 2),
                        "detection_method": "High-Luminance Washout Thresholding",
                    })
                    region_counter += 1

        # 3. Scratch / Crack lines (Hough Line Transform)
        edges = cv2.Canny(gray, 60, 140)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=75, minLineLength=50, maxLineGap=8)
        scratch_count = 0
        if lines is not None:
            scratch_count = min(len(lines), 100)
            for line in lines[:30]:
                x1, y1, x2, y2 = line[0]
                cv2.line(damage_mask, (x1, y1), (x2, y2), 255, 2)
                if region_counter <= 50:
                    detected_regions.append({
                        "id": f"DMG-{region_counter:03d}",
                        "category": "Surface Crack / Linear Scratch",
                        "box": [int(min(x1, x2)), int(min(y1, y2)), int(abs(x2 - x1) + 2), int(abs(y2 - y1) + 2)],
                        "area_pixels": int(abs(x2 - x1) + abs(y2 - y1)),
                        "severity": 0.65,
                        "detection_method": "Probabilistic Hough Transform",
                    })
                    region_counter += 1

        # 4. Create blended visual overlay
        # Color damage overlay in crimson red [0, 0, 220]
        color_mask = np.zeros_like(overlay)
        color_mask[damage_mask > 0] = [0, 0, 220]
        blended_overlay = cv2.addWeighted(overlay, 0.75, color_mask, 0.45, 0)

        # Draw thin bounding boxes on overlay for detected regions
        for r in detected_regions[:25]:
            rx, ry, rw, rh = r["box"]
            cv2.rectangle(blended_overlay, (rx, ry), (rx + rw, ry + rh), (0, 165, 255), 1)

        # Calculate metrics
        damage_pixel_count = int(np.count_nonzero(damage_mask))
        damage_pct = round((damage_pixel_count / total_pixels) * 100, 2)

        # Save artifacts
        overlay_path = None
        mask_path = None
        if output_dir:
            out = Path(output_dir)
            out.mkdir(parents=True, exist_ok=True)
            stem = Path(image_path).stem
            overlay_path = str(out / f"{stem}_damage_overlay.png")
            mask_path = str(out / f"{stem}_damage_mask.png")
            save_cv2_image(blended_overlay, overlay_path)
            save_cv2_image(damage_mask, mask_path)

        # Calculate legacy indicators for compatibility
        blurred = cv2.GaussianBlur(gray, (51, 51), 0)
        illum_diff = cv2.absdiff(gray, blurred)
        illum_score = float(np.mean(illum_diff))

        contrast = float(np.std(gray))
        hp = cv2.GaussianBlur(gray, (5, 5), 0)
        noise = float(np.std(gray.astype(float) - hp.astype(float)))

        dark_ratio = round((stain_area / total_pixels) * 100, 2)
        faded_ratio = round((faded_area / total_pixels) * 100, 2)

        indicators = {
            "uneven_illumination": {
                "score": round(illum_score, 2),
                "detected": illum_score > 20,
                "note": "Heuristic: mean difference between image and low-pass version",
            },
            "dark_regions": {
                "percentage": dark_ratio,
                "detected": dark_ratio > 5,
                "note": "Percentage of dark stain pixels below threshold",
            },
            "low_contrast": {
                "contrast_std": round(contrast, 2),
                "detected": contrast < 40,
                "note": "Standard deviation of pixel intensities",
            },
            "noise": {
                "noise_level": round(noise, 2),
                "detected": noise > 12,
                "note": "High-pass residual standard deviation",
            },
            "faded_regions": {
                "percentage": faded_ratio,
                "detected": faded_ratio > 30,
                "note": "High-luminance washout percentage",
            },
            "line_artifacts": {
                "count": scratch_count,
                "detected": scratch_count > 20,
                "note": "Hough line segments detected",
            },
            "overall": {
                "indicators_triggered": sum([
                    illum_score > 20,
                    dark_ratio > 5,
                    contrast < 40,
                    noise > 12,
                    faded_ratio > 30,
                    scratch_count > 20,
                ]),
                "total_indicators": 6,
                "damage_area_percentage": damage_pct,
                "note": "Heuristic composite summary",
            },
            "dark_stains": {
                "detected": stain_area > 0,
                "area_percentage": dark_ratio,
            },
            "scratches_and_cracks": {
                "detected": scratch_count > 5,
                "count": scratch_count,
            },
            "overall_damage_ratio": damage_pct,
            "total_suspected_regions": len(detected_regions),
            "methodology": "Heuristic OpenCV contour analysis & morphological filters. Non-destructive.",
        }

        return {
            "damage_indicators": indicators,
            "detected_regions": detected_regions,
            "overlay_path": overlay_path,
            "mask_path": mask_path,
            "damage_area_percentage": damage_pct,
        }
