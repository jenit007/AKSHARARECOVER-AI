"""Tests for Computer Vision enhancement, heuristics, and quality analysis."""

import numpy as np
import cv2
from app.services.image_processing import ImageProcessingService
from app.services.damage_detection import DamageDetectionService
from evaluation.evaluate_images import compute_psnr, compute_ssim


def test_cv_methods_execution():
    service = ImageProcessingService()
    # Create test BGR pattern
    test_img = np.full((100, 100, 3), 128, dtype=np.uint8)
    cv2.putText(test_img, "TEST", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 2)

    # Grayscale
    gray = service.to_grayscale(test_img)
    assert len(gray.shape) == 2

    # CLAHE
    clahe = service.clahe_enhance(gray)
    assert clahe.shape == gray.shape

    # Denoise
    denoised = service.denoise(gray, strength=5)
    assert denoised.shape == gray.shape

    # Adaptive Threshold
    thresh = service.adaptive_threshold(gray)
    assert thresh.shape == gray.shape

    # Sharpen
    sharpened = service.sharpen(test_img)
    assert sharpened.shape == test_img.shape

    # Quality metrics
    metrics = service.measure_quality(test_img)
    assert "brightness" in metrics
    assert "contrast" in metrics
    assert "sharpness_laplacian" in metrics
    assert "noise_estimate" in metrics
    assert metrics["width"] == 100
    assert metrics["height"] == 100


def test_damage_detection_heuristics(tmp_path):
    # Create an image with uneven illumination and stains
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    # Bright center, dark corners
    for r in range(200):
        for c in range(200):
            img[r, c] = min(255, int(((r - 100)**2 + (c - 100)**2)**0.5))

    img_path = tmp_path / "test_damage.png"
    cv2.imwrite(str(img_path), img)

    result = DamageDetectionService.analyse(str(img_path), output_dir=str(tmp_path))
    assert "damage_indicators" in result
    indicators = result["damage_indicators"]
    assert "uneven_illumination" in indicators
    assert "dark_regions" in indicators
    assert "low_contrast" in indicators
    assert "noise" in indicators
    assert "faded_regions" in indicators
    assert "line_artifacts" in indicators
    assert "overall" in indicators
    assert result["overlay_path"] is not None


def test_psnr_and_ssim():
    img1 = np.full((100, 100), 120, dtype=np.uint8)
    img2 = np.full((100, 100), 120, dtype=np.uint8)
    # Identical images
    assert compute_psnr(img1, img2) == float("inf")
    assert round(compute_ssim(img1, img2), 4) == 1.0

    # Slightly different images
    img3 = np.full((100, 100), 130, dtype=np.uint8)
    psnr = compute_psnr(img1, img3)
    ssim = compute_ssim(img1, img3)
    assert psnr > 0 and psnr < float("inf")
    assert 0.0 <= ssim <= 1.0
