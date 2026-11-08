"""Upload service – handles file storage, preview generation, PDF conversion."""

import io
import uuid
import logging
from pathlib import Path
from PIL import Image

from app.config import get_settings
from app.utils.file_validation import validate_upload, IMAGE_EXTENSIONS
from app.utils.image_utils import generate_preview, pdf_to_images

logger = logging.getLogger("akshararecover.upload_service")


class UploadService:
    """Manage manuscript file uploads."""

    def __init__(self):
        self.settings = get_settings()
        self.settings.ensure_upload_dirs()

    def process_upload(
        self,
        filename: str,
        content_type: str | None,
        data: bytes,
        title: str | None = None,
        source_language: str | None = None,
        source_script: str | None = None,
    ) -> dict:
        """
        Validate, store and return metadata for an uploaded manuscript.
        """
        meta = validate_upload(filename, content_type, data)
        ext = meta["extension"]

        manuscript_id = str(uuid.uuid4())
        stored_filename = f"{manuscript_id}.{ext}" if ext != "pdf" else f"{manuscript_id}.pdf"

        # Store original file
        original_path = self.settings.upload_originals_dir / stored_filename
        original_path.write_bytes(data)
        logger.info("Stored original: %s (%d bytes)", original_path, len(data))

        preview_path: str | None = None
        page_paths: list[str] = []

        if ext in IMAGE_EXTENSIONS:
            preview_name = f"{manuscript_id}_preview.jpg"
            preview_full = self.settings.upload_previews_dir / preview_name
            generate_preview(data, preview_full)
            preview_path = str(preview_full)

            # Save normalized RGB PNG as page 1 for OpenCV/OCR processing
            page_img_path = self.settings.upload_originals_dir / f"{manuscript_id}_page_1.png"
            img = Image.open(io.BytesIO(data))
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(str(page_img_path), "PNG")
            page_paths.append(str(page_img_path))

        elif ext == "pdf":
            images = pdf_to_images(data)
            for idx, pil_img in enumerate(images, start=1):
                page_img_name = f"{manuscript_id}_page_{idx}.png"
                page_img_path = self.settings.upload_originals_dir / page_img_name
                pil_img.save(str(page_img_path), "PNG")
                page_paths.append(str(page_img_path))

            if images:
                preview_name = f"{manuscript_id}_preview.jpg"
                preview_full = self.settings.upload_previews_dir / preview_name
                first = images[0].copy()
                first.thumbnail((800, 800))
                if first.mode != "RGB":
                    first = first.convert("RGB")
                first.save(str(preview_full), "JPEG", quality=85)
                preview_path = str(preview_full)

        mime_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
            "tif": "image/tiff",
            "tiff": "image/tiff",
            "pdf": "application/pdf",
        }

        return {
            "manuscript_id": manuscript_id,
            "original_filename": filename,
            "stored_filename": stored_filename,
            "original_file_path": str(original_path),
            "preview_path": preview_path,
            "file_type": mime_map.get(ext, content_type or "application/octet-stream"),
            "page_count": meta.get("page_count", 1),
            "title": (title.strip() if title and title.strip() else Path(filename).stem),
            "source_language": source_language,
            "source_script": source_script,
            "page_paths": page_paths,
        }
