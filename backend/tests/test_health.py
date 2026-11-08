"""Tests for health check and system information endpoints."""

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ("healthy", "degraded")
    assert "app" in data
    assert "database_connected" in data
    assert data["database_connected"] is True
    assert "device" in data
    assert "models" in data


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["documentation"] == "/docs"


def test_docs_and_openapi(client):
    resp_docs = client.get("/docs")
    assert resp_docs.status_code == 200
    resp_openapi = client.get("/openapi.json")
    assert resp_openapi.status_code == 200
    assert "openapi" in resp_openapi.json()
