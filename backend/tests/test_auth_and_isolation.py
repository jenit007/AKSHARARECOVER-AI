"""Comprehensive tests for authentication, security, rate limiting, ownership isolation, and QR visibility."""

from app.database.models import User
from app.utils.security import create_access_token
from app.config import get_settings
from scripts.seed_dev import seed_development_user


def test_user_registration_and_validation(unauth_client, test_db):
    # 1. Mismatched confirm_password -> 422
    resp_mismatch = unauth_client.post(
        "/api/auth/register",
        json={
            "full_name": "Meera Nair",
            "email": "meera@kerala-archive.org",
            "password": "password123",
            "confirm_password": "password999",
        },
    )
    assert resp_mismatch.status_code == 422
    assert resp_mismatch.json()["success"] is False

    # 2. Weak password (no digits) -> 422
    resp_weak = unauth_client.post(
        "/api/auth/register",
        json={
            "full_name": "Meera Nair",
            "email": "meera@kerala-archive.org",
            "password": "onlyletters",
            "confirm_password": "onlyletters",
        },
    )
    assert resp_weak.status_code == 422

    # 3. Valid registration -> 201
    resp_ok = unauth_client.post(
        "/api/auth/register",
        json={
            "full_name": "Dr. Meera Nair",
            "email": "Meera@Kerala-Archive.org",
            "password": "securePass123",
            "confirm_password": "securePass123",
        },
    )
    assert resp_ok.status_code == 201
    payload = resp_ok.json()
    assert payload["success"] is True
    user_data = payload["data"]["user"]
    assert user_data["email"] == "meera@kerala-archive.org"
    assert user_data["full_name"] == "Dr. Meera Nair"
    assert "password" not in user_data
    assert "password_hash" not in user_data

    # Verify bcrypt hash in DB (not plaintext)
    db_user = test_db.query(User).filter(User.email == "meera@kerala-archive.org").first()
    assert db_user is not None
    assert db_user.password_hash != "securePass123"
    assert db_user.password_hash.startswith("$2b$")

    # 4. Duplicate email -> 409 Conflict
    resp_dup = unauth_client.post(
        "/api/auth/register",
        json={
            "full_name": "Another User",
            "email": "meera@kerala-archive.org",
            "password": "securePass123",
            "confirm_password": "securePass123",
        },
    )
    assert resp_dup.status_code == 409
    assert resp_dup.json()["success"] is False


def test_login_session_logout_and_rate_limit(unauth_client, test_db):
    # Seed development test user (jenit@gmail.com / jenit123)
    seeded = seed_development_user(test_db)
    assert seeded.email == "jenit@gmail.com"

    # 1. Wrong password -> 401
    bad_resp = unauth_client.post(
        "/api/auth/login",
        json={"email": "jenit@gmail.com", "password": "wrongpassword1"},
    )
    assert bad_resp.status_code == 401
    assert bad_resp.json()["success"] is False

    # 2. Correct login -> 200 + sets session cookie
    ok_resp = unauth_client.post(
        "/api/auth/login",
        json={"email": "jenit@gmail.com", "password": "jenit123"},
    )
    assert ok_resp.status_code == 200
    assert ok_resp.json()["data"]["user"]["email"] == "jenit@gmail.com"
    settings = get_settings()
    assert settings.COOKIE_NAME in unauth_client.cookies

    # 3. Session check /api/auth/me & /api/auth/profile
    me_resp = unauth_client.get("/api/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["user"]["email"] == "jenit@gmail.com"

    prof_resp = unauth_client.get("/api/auth/profile")
    assert prof_resp.status_code == 200
    assert "stats" in prof_resp.json()["data"]
    assert "recent_manuscripts" in prof_resp.json()["data"]

    # 4. Logout clears session
    logout_resp = unauth_client.post("/api/auth/logout")
    assert logout_resp.status_code == 200
    unauth_client.cookies.clear()

    me_after = unauth_client.get("/api/auth/me")
    assert me_after.status_code == 401

    # 5. Rate limiting on repeated failed login attempts -> 429
    for _ in range(settings.LOGIN_RATE_LIMIT_MAX_ATTEMPTS):
        r = unauth_client.post(
            "/api/auth/login",
            json={"email": "ratelimit@test.org", "password": "badpassword1"},
        )
        assert r.status_code == 401

    rate_resp = unauth_client.post(
        "/api/auth/login",
        json={"email": "ratelimit@test.org", "password": "badpassword1"},
    )
    assert rate_resp.status_code == 429
    assert rate_resp.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"


def test_ownership_isolation_and_public_qr_sharing(
    client, unauth_client, test_user, second_user, sample_image_bytes
):
    # User 1 (client) uploads a manuscript with description
    up_resp = client.post(
        "/api/manuscripts/upload",
        files={"file": ("kerala_ola.jpg", sample_image_bytes, "image/jpeg")},
        data={
            "title": "Private Temple Ola Folio",
            "description": "18th century Ayurvedic palm-leaf manuscript from Thrissur.",
            "source_language": "mal",
            "source_script": "Malayalam",
        },
    )
    assert up_resp.status_code == 201
    man_id = up_resp.json()["data"]["manuscript_id"]
    assert up_resp.json()["data"]["description"] == "18th century Ayurvedic palm-leaf manuscript from Thrissur."

    # Unauthenticated client cannot access private manuscript, list, or preview file -> 401
    assert unauth_client.get("/api/manuscripts").status_code == 401
    assert unauth_client.get(f"/api/manuscripts/{man_id}").status_code == 401
    assert unauth_client.get(f"/api/files/previews/{man_id}_preview.jpg").status_code == 401

    # Authenticate unauth_client as second_user (User 2)
    settings = get_settings()
    token2, csrf2 = create_access_token(second_user.id, second_user.email)
    unauth_client.cookies.set(settings.COOKIE_NAME, token2)
    unauth_client.cookies.set(settings.CSRF_COOKIE_NAME, csrf2)

    # User 2's manuscript library must NOT include User 1's manuscript
    u2_list = unauth_client.get("/api/manuscripts")
    assert u2_list.status_code == 200
    assert u2_list.json()["data"]["pagination"]["total"] == 0

    # User 2 cannot read, process, export, or view files of User 1's private manuscript -> 403 Forbidden
    assert unauth_client.get(f"/api/manuscripts/{man_id}").status_code == 403
    assert unauth_client.get(f"/api/manuscripts/{man_id}/results").status_code == 403
    assert unauth_client.get(f"/api/manuscripts/{man_id}/export").status_code == 403
    assert unauth_client.get(f"/api/files/previews/{man_id}_preview.jpg").status_code == 403
    assert unauth_client.post(f"/api/manuscripts/{man_id}/process", json={}).status_code == 403

    # User 1 generates Digital Heritage Record (default visibility is PRIVATE)
    hr_resp = client.get(f"/api/manuscripts/{man_id}/heritage-record")
    assert hr_resp.status_code == 200
    hr_data = hr_resp.json()["data"]
    slug = hr_data["unique_slug"]
    assert hr_data["visibility"] == "PRIVATE"

    # User 2 cannot access private public-endpoint or passport page -> 403
    assert unauth_client.get(f"/api/public/heritage-records/{slug}").status_code == 403
    assert unauth_client.get(f"/passport/{slug}").status_code == 403

    # User 1 explicitly enables PUBLIC sharing for QR verification
    vis_resp = client.patch(
        f"/api/manuscripts/{man_id}/heritage-record/visibility",
        json={"visibility": "PUBLIC"},
    )
    assert vis_resp.status_code == 200
    assert vis_resp.json()["data"]["visibility"] == "PUBLIC"

    # Now User 2 / external QR scanner CAN view the public heritage record & files
    assert unauth_client.get(f"/api/public/heritage-records/{slug}").status_code == 200
    assert unauth_client.get(f"/passport/{slug}").status_code == 200
    assert unauth_client.get(f"/api/manuscripts/{man_id}?token={slug}").status_code == 200

    # Still, User 2 cannot modify or change visibility of User 1's manuscript -> 403
    assert unauth_client.patch(
        f"/api/manuscripts/{man_id}/heritage-record/visibility",
        json={"visibility": "PRIVATE"},
    ).status_code == 403


def test_metadata_enhancement_toggle_export_and_contribution(client, sample_image_bytes):
    # 1. Upload manuscript with description, historical_period, region
    up_resp = client.post(
        "/api/manuscripts/upload",
        files={"file": ("ayurveda_leaf.jpg", sample_image_bytes, "image/jpeg")},
        data={
            "title": "Ayurvedic Herbal Folio",
            "description": "Contains botanical notes on Kerala palm-leaf conservation.",
            "source_language": "mal",
            "source_script": "Malayalam",
            "historical_period": "18th Century CE",
            "region": "Thrissur, Kerala",
        },
    )
    assert up_resp.status_code == 201
    man_data = up_resp.json()["data"]
    man_id = man_data["manuscript_id"]
    assert man_data["description"] == "Contains botanical notes on Kerala palm-leaf conservation."
    assert man_data["historical_period"] == "18th Century CE"
    assert man_data["region"] == "Thrissur, Kerala"

    # 2. Run pipeline with enhancement_enabled=False
    proc_resp = client.post(
        f"/api/manuscripts/{man_id}/process",
        json={
            "enhancement_enabled": False,
            "ocr_enabled": True,
            "compare_original": False,
            "source_language": "en",
            "source_script": "Latin",
        },
    )
    assert proc_resp.status_code == 202
    job_id = proc_resp.json()["data"]["job_id"]

    job_resp = client.get(f"/api/jobs/{job_id}")
    assert job_resp.status_code == 200
    assert job_resp.json()["data"]["status"] in ("completed", "processing", "pending")

    # 3. Export structured JSON dossier
    exp_resp = client.get(f"/api/manuscripts/{man_id}/export")
    assert exp_resp.status_code == 200
    dossier = exp_resp.json()
    assert dossier["manuscript"]["id"] == man_id
    assert dossier["manuscript"]["description"] == "Contains botanical notes on Kerala palm-leaf conservation."
    assert "processing_results" in dossier
    assert "digital_heritage_record" in dossier

    # 4. Community contribution endpoint persistence
    contrib_resp = client.post(
        "/api/contributions",
        data={
            "title": "Theyyam Thottam Oral Archive",
            "description": "Recorded provenance notes from North Malabar.",
            "cultural_category": "Performing Arts",
            "art_form": "Theyyam",
            "region": "Kerala",
            "district": "Kannur",
            "contributor_name": "Research Scholar",
            "permission_to_store": "true",
            "permission_to_display": "true",
            "permission_to_publish": "false",
        },
        files={"media_file": ("theyyam_sample.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert contrib_resp.status_code == 201
    c_data = contrib_resp.json()["data"]
    assert c_data["title"] == "Theyyam Thottam Oral Archive"
    assert c_data["review_status"] == "PENDING"
