"""Tests for manuscript upload, validation, and storage."""

import io


def test_upload_valid_jpeg(client, sample_image_bytes):
    response = client.post(
        "/api/manuscripts/upload",
        files={"file": ("sample.jpg", sample_image_bytes, "image/jpeg")},
        data={"title": "Palm Leaf Manuscript", "source_language": "mal", "source_script": "Malayalam"},
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    data = payload["data"]
    assert "manuscript_id" in data
    assert data["title"] == "Palm Leaf Manuscript"
    assert data["file_type"] == "image/jpeg"
    assert data["page_count"] == 1
    assert data["status"] == "uploaded"


def test_upload_valid_png(client, sample_png_bytes):
    response = client.post(
        "/api/manuscripts/upload",
        files={"file": ("manuscript.png", sample_png_bytes, "image/png")},
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["file_type"] == "image/png"


def test_upload_valid_pdf(client, sample_pdf_bytes):
    response = client.post(
        "/api/manuscripts/upload",
        files={"file": ("document.pdf", sample_pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["file_type"] == "application/pdf"
    assert payload["data"]["page_count"] >= 1


def test_upload_unsupported_extension(client):
    response = client.post(
        "/api/manuscripts/upload",
        files={"file": ("script.sh", b"echo hello", "text/x-shellscript")},
    )
    assert response.status_code in (415, 422)
    payload = response.json()
    assert payload["success"] is False
    assert payload["data"] is None
    assert payload["error"]["code"] in ("UNSUPPORTED_MEDIA_TYPE", "VALIDATION_ERROR")


def test_upload_fake_image_magic_bytes_mismatch(client):
    # File named .jpg but content is plain ASCII
    fake_data = b"This is just random text disguised as image"
    response = client.post(
        "/api/manuscripts/upload",
        files={"file": ("fake.jpg", fake_data, "image/jpeg")},
    )
    assert response.status_code in (415, 422)
    payload = response.json()
    assert payload["success"] is False


def test_upload_empty_file(client):
    response = client.post(
        "/api/manuscripts/upload",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
    )
    assert response.status_code in (400, 422)
    payload = response.json()
    assert payload["success"] is False
