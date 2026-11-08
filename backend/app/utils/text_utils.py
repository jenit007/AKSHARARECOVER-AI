"""Text processing utilities."""

import re
import unicodedata


def normalize_unicode(text: str) -> str:
    """Apply NFC normalization (safe for Indic scripts)."""
    return unicodedata.normalize("NFC", text)


def clean_ocr_text(text: str) -> str:
    """Basic cleanup of OCR output text."""
    if not text:
        return ""
    # Collapse multiple spaces/tabs into single space
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def calculate_cer(reference: str, hypothesis: str) -> float:
    """Character Error Rate using edit distance."""
    ref = normalize_unicode(reference)
    hyp = normalize_unicode(hypothesis)
    if not ref:
        return 0.0 if not hyp else 1.0
    d = _edit_distance(ref, hyp)
    return d / len(ref)


def calculate_wer(reference: str, hypothesis: str) -> float:
    """Word Error Rate using edit distance on word tokens."""
    ref_words = normalize_unicode(reference).split()
    hyp_words = normalize_unicode(hypothesis).split()
    if not ref_words:
        return 0.0 if not hyp_words else 1.0
    d = _edit_distance(ref_words, hyp_words)
    return d / len(ref_words)


def _edit_distance(a, b) -> int:
    """Levenshtein edit distance for sequences (str or list)."""
    n, m = len(a), len(b)
    prev = list(range(m + 1))
    for i in range(1, n + 1):
        curr = [i] + [0] * m
        for j in range(1, m + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            curr[j] = min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
        prev = curr
    return prev[m]
