"""Image enhancement evaluation – PSNR and SSIM calculation."""

import json
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import cv2
import numpy as np


def compute_psnr(orig: np.ndarray, enhanced: np.ndarray) -> float:
    """Peak Signal-to-Noise Ratio (PSNR)."""
    mse = np.mean((orig.astype(float) - enhanced.astype(float)) ** 2)
    if mse == 0:
        return float("inf")
    max_pixel = 255.0
    return float(20 * np.log10(max_pixel / np.sqrt(mse)))


def compute_ssim(orig: np.ndarray, enhanced: np.ndarray) -> float:
    """Simplified Structural Similarity Index (SSIM) between grayscale images."""
    if len(orig.shape) == 3:
        orig = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
    if len(enhanced.shape) == 3:
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)

    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2

    orig = orig.astype(float)
    enhanced = enhanced.astype(float)

    mu1 = cv2.GaussianBlur(orig, (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(enhanced, (11, 11), 1.5)

    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2

    sigma1_sq = cv2.GaussianBlur(orig ** 2, (11, 11), 1.5) - mu1_sq
    sigma2_sq = cv2.GaussianBlur(enhanced ** 2, (11, 11), 1.5) - mu2_sq
    sigma12 = cv2.GaussianBlur(orig * enhanced, (11, 11), 1.5) - mu1_mu2

    ssim_map = ((2 * mu1_mu2 + c1) * (2 * sigma12 + c2)) / ((mu1_sq + mu2_sq + c1) * (sigma1_sq + sigma2_sq + c2))
    return float(np.mean(ssim_map))


def evaluate_pair(orig_path: str, enhanced_path: str) -> dict:
    orig = cv2.imread(orig_path)
    enh = cv2.imread(enhanced_path)
    if orig is None or enh is None:
        raise ValueError("Could not read image files for evaluation.")

    if orig.shape != enh.shape:
        enh = cv2.resize(enh, (orig.shape[1], orig.shape[0]))

    psnr = compute_psnr(orig, enh)
    ssim = compute_ssim(orig, enh)

    return {
        "psnr_db": round(psnr, 2) if psnr != float("inf") else "infinity",
        "ssim": round(ssim, 4),
        "note": "Higher PSNR/SSIM does not necessarily indicate better historical text readability.",
    }


if __name__ == "__main__":
    print(json.dumps({"info": "Provide original and enhanced image paths to evaluate PSNR/SSIM."}))
