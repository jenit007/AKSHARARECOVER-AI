"""OCR Evaluation utility – CER (Character Error Rate) and WER (Word Error Rate)."""

import json
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.utils.text_utils import calculate_cer, calculate_wer, normalize_unicode


def evaluate_ocr_samples(ground_truth_dir: Path) -> dict:
    """
    Evaluates OCR transcriptions against ground truth texts.
    Expects pairs of:
      <name>.gt.txt   (Ground Truth)
      <name>.ocr.txt  (Model Hypothesis)
    """
    sample_files = list(ground_truth_dir.glob("*.gt.txt"))
    if not sample_files:
        return {
            "evaluated_samples": 0,
            "average_cer": None,
            "average_wer": None,
            "samples": [],
        }

    cer_list = []
    wer_list = []
    samples_detail = []

    for gt_path in sample_files:
        stem = gt_path.name.replace(".gt.txt", "")
        ocr_path = ground_truth_dir / f"{stem}.ocr.txt"

        if not ocr_path.exists():
            continue

        gt_text = normalize_unicode(gt_path.read_text(encoding="utf-8").strip())
        ocr_text = normalize_unicode(ocr_path.read_text(encoding="utf-8").strip())

        cer = calculate_cer(gt_text, ocr_text)
        wer = calculate_wer(gt_text, ocr_text)

        cer_list.append(cer)
        wer_list.append(wer)

        samples_detail.append({
            "sample_id": stem,
            "reference_length": len(gt_text),
            "hypothesis_length": len(ocr_text),
            "cer": round(cer, 4),
            "wer": round(wer, 4),
        })

    avg_cer = round(sum(cer_list) / len(cer_list), 4) if cer_list else None
    avg_wer = round(sum(wer_list) / len(wer_list), 4) if wer_list else None

    return {
        "evaluated_samples": len(cer_list),
        "average_cer": avg_cer,
        "average_wer": avg_wer,
        "samples": samples_detail,
    }


if __name__ == "__main__":
    gt_dir = Path(__file__).parent / "sample_ground_truth"
    results = evaluate_ocr_samples(gt_dir)
    print(json.dumps(results, indent=2))
