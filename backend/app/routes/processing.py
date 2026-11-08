"""Processing and job management routes with real-time SSE streaming."""

import asyncio
import json
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.schemas.common import success_response
from app.schemas.processing import ProcessingRequest
from app.services.job_service import JobService, JobBroadcaster
from app.utils.errors import NotFoundError
from app.utils.security import (
    get_current_user,
    verify_manuscript_ownership,
)

logger = logging.getLogger("akshararecover.routes.processing")

router = APIRouter(tags=["Processing"])


@router.post("/api/manuscripts/{id}/process", status_code=status.HTTP_202_ACCEPTED)
def start_processing(
    id: str,
    req: ProcessingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start asynchronous image enhancement and OCR processing pipeline.
    Requires manuscript ownership. Returns HTTP 202 with job tracking details.
    """
    manuscript = verify_manuscript_ownership(db, id, current_user)

    job = JobService.create_job(
        db,
        manuscript_id=id,
        job_type="processing",
        user_id=current_user.id,
    )

    background_tasks.add_task(
        JobService.execute_pipeline,
        job_id=job.id,
        manuscript_id=id,
        enhancement_enabled=req.enhancement_enabled,
        ocr_enabled=req.ocr_enabled,
        compare_original=req.compare_original,
        source_language=req.source_language or manuscript.source_language or "en",
        source_script=req.source_script or manuscript.source_script,
    )

    return success_response(
        data={
            "job_id": job.id,
            "manuscript_id": id,
            "status": job.status,
            "progress": job.progress,
            "current_stage": job.current_stage,
        },
        message="Processing job created",
    )


@router.get("/api/jobs/{job_id}")
def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check pipeline execution progress and stage status (requires ownership)."""
    job = JobService.get_job(db, job_id)
    if not job:
        raise NotFoundError(f"Job with ID '{job_id}' not found.")

    verify_manuscript_ownership(db, job.manuscript_id, current_user)

    error_info = None
    if job.error_code or job.error_message:
        error_info = {
            "code": job.error_code,
            "message": job.error_message,
        }

    return success_response(
        data={
            "job_id": job.id,
            "manuscript_id": job.manuscript_id,
            "status": job.status,
            "progress": job.progress,
            "current_stage": job.current_stage,
            "message": job.message,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "error": error_info,
        },
        message="Job status retrieved",
    )


@router.get("/api/jobs/{job_id}/stream")
async def stream_job_events(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Server-Sent Events (SSE) stream for real-time manuscript processing updates.
    Requires manuscript ownership.
    """
    job = JobService.get_job(db, job_id)
    if not job:
        raise NotFoundError(f"Job with ID '{job_id}' not found.")

    verify_manuscript_ownership(db, job.manuscript_id, current_user)

    async def event_generator():
        queue = JobBroadcaster.subscribe(job_id)
        try:
            init_data = json.dumps({
                "job_id": job.id,
                "manuscript_id": job.manuscript_id,
                "status": job.status,
                "stage": job.current_stage,
                "progress": job.progress,
                "message": job.message,
            })
            yield f"event: job.status\ndata: {init_data}\n\n"

            if job.status in ("completed", "failed"):
                return

            timeout_count = 0
            while timeout_count < 120:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=2.0)
                    evt_name = event.get("event_type", "message")
                    evt_data = json.dumps(event)
                    yield f"event: {evt_name}\ndata: {evt_data}\n\n"
                    if event.get("status") in ("completed", "failed"):
                        break
                    timeout_count = 0
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"
                    timeout_count += 1
        finally:
            JobBroadcaster.unsubscribe(job_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
