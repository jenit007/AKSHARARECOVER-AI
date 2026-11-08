"""Unit and integration tests for the Real-Time Manuscript Processing Journey."""

import pytest
from app.services.condition_analysis_service import ConditionAnalysisService
from app.services.job_service import JobBroadcaster
import numpy as np
import cv2


def test_condition_analysis_metrics(tmp_path):
    # Create test image with distinct properties
    img = np.full((150, 200, 3), 135, dtype=np.uint8)
    cv2.putText(img, "AKSHARA RECOVER", (15, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 20), 2)
    # Add dark stain
    cv2.circle(img, (50, 50), 25, (10, 10, 10), -1)

    img_file = tmp_path / "test_condition.png"
    cv2.imwrite(str(img_file), img)

    analysis = ConditionAnalysisService.analyze_condition(str(img_file))
    assert "measured_metrics" in analysis
    assert "heuristic_damage_indicators" in analysis
    assert "assessment_methodology" in analysis

    m = analysis["measured_metrics"]
    assert m["resolution"]["width"] == 200
    assert m["resolution"]["height"] == 150
    assert "brightness" in m
    assert "contrast" in m
    assert "sharpness_laplacian" in m

    h = analysis["heuristic_damage_indicators"]
    assert "visible_stains" in h
    assert h["visible_stains"]["detected"] is True
    assert "text_readability" in h


def test_job_broadcaster_pubsub():
    test_job_id = "test-job-uuid-1234"
    q = JobBroadcaster.subscribe(test_job_id)

    # Publish event
    JobBroadcaster.publish(test_job_id, "stage.progress", {
        "job_id": test_job_id,
        "progress": 45,
        "stage": "image_enhancement",
    })

    assert not q.empty()
    item = q.get_nowait()
    assert item["event_type"] == "stage.progress"
    assert item["progress"] == 45
    assert "timestamp" in item

    JobBroadcaster.unsubscribe(test_job_id, q)


def test_journey_endpoints(client, sample_png_bytes):
    # Upload manuscript first
    upload_resp = client.post(
        "/api/manuscripts/upload",
        files={"file": ("test_folio.png", sample_png_bytes, "image/png")},
        data={"title": "Palm-Leaf Rigvedic Test Inscription", "source_language": "sa", "source_script": "Devanagari"},
    )
    assert upload_resp.status_code == 201
    mid = upload_resp.json()["data"]["manuscript_id"]

    # 1. Processing timeline
    resp = client.get(f"/api/manuscripts/{mid}/processing-timeline")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "stages" in data
    assert len(data["stages"]) == 12
    assert data["stages"][0]["id"] == "upload"
    assert data["stages"][11]["id"] == "heritage_record"

    # 2. Artifacts endpoint
    resp_art = client.get(f"/api/manuscripts/{mid}/artifacts")
    assert resp_art.status_code == 200
    art_data = resp_art.json()["data"]
    assert "original_image" in art_data
    assert "intermediate_enhanced" in art_data
    assert "damage" in art_data

    # 3. Cultural entities endpoint
    resp_ent = client.get(f"/api/manuscripts/{mid}/cultural-entities")
    assert resp_ent.status_code == 200
    ent_data = resp_ent.json()["data"]
    assert "entities" in ent_data
    assert ent_data["total_entities"] >= 3

    # 4. Knowledge graph endpoint
    resp_graph = client.get(f"/api/manuscripts/{mid}/knowledge-graph")
    assert resp_graph.status_code == 200
    graph_data = resp_graph.json()["data"]
    assert "nodes" in graph_data
    assert "edges" in graph_data
    assert len(graph_data["nodes"]) >= 3

    # 5. Heritage record endpoint
    resp_rec = client.get(f"/api/manuscripts/{mid}/heritage-record")
    assert resp_rec.status_code == 200
    rec_data = resp_rec.json()["data"]
    assert "qr_code_url" in rec_data
    assert "unique_slug" in rec_data

    # 6. Journey HTML view
    resp_ui = client.get("/journey")
    assert resp_ui.status_code == 200
    assert "AKSHARARECOVER AI" in resp_ui.text
