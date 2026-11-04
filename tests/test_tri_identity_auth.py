import pytest
import sys
import uuid
from pathlib import Path
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.main import app
from app.core.database import get_user_db
from app.core.security import hash_password, generate_salt
from app.api.auth import is_legacy_username, normalize_persian_text

client = TestClient(app)


def test_normalize_persian_text():
    assert normalize_persian_text("علي رضايي") == "علی رضایی"
    assert normalize_persian_text("بانك ملي") == "بانک ملی"
    assert normalize_persian_text("  امیر‌علی  ") == "امیر‌علی"
    assert normalize_persian_text("") == ""


def test_is_legacy_username():
    assert is_legacy_username("tg_123456") is True
    assert is_legacy_username("tg_user_123") is True
    assert is_legacy_username("12345678") is True
    assert is_legacy_username("admin") is True
    assert is_legacy_username("system") is True
    assert is_legacy_username("___") is True
    assert is_legacy_username("") is True
    assert is_legacy_username(None) is True
    assert is_legacy_username("amirali_rakhshani") is False
    assert is_legacy_username("sara_student") is False
    assert is_legacy_username("konkuri_1405") is False


def test_check_username_rules_and_self_collision():
    # 1. Empty / invalid
    res = client.get("/api/auth/check-username?username=")
    assert res.json()["available"] is False

    # 2. Pure digits
    res = client.get("/api/auth/check-username?username=987654321")
    assert res.json()["available"] is False
    assert "صرفاً عدد" in res.json()["reason"]

    # 3. tg_ prefix
    res = client.get("/api/auth/check-username?username=tg_test99")
    assert res.json()["available"] is False
    assert "پیشوند tg_" in res.json()["reason"]

    # 4. Reserved system name
    res = client.get("/api/auth/check-username?username=admin")
    assert res.json()["available"] is False
    assert "رزرو" in res.json()["reason"]

    # 5. Underscores only
    res = client.get("/api/auth/check-username?username=____")
    assert res.json()["available"] is False

    # 6. Valid available username
    unique_u = f"u_{uuid.uuid4().hex[:10]}"
    res = client.get(f"/api/auth/check-username?username={unique_u}")
    assert res.json()["available"] is True

    # 7. Self-collision exemption with exclude_user_id
    # demo user has id 1
    res = client.get("/api/auth/check-username?username=demo")
    assert res.json()["available"] is False
    res_exempt = client.get("/api/auth/check-username?username=demo&exclude_user_id=1")
    assert res_exempt.json()["available"] is True


def test_register_and_login_validation():
    uid = uuid.uuid4().hex[:8]
    test_user = f"v_usr_{uid}"

    # Missing display_name
    res = client.post("/api/auth/register", json={
        "username": test_user,
        "password": "password123",
        "display_name": "   "
    })
    assert res.status_code == 400
    assert "فارسی الزامی است" in res.json()["detail"]

    # Valid registration
    res = client.post("/api/auth/register", json={
        "username": test_user,
        "password": "password123",
        "display_name": "سارا محمدي" # Arabic Yeh will be normalized
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["display_name"] == "سارا محمدی"
    assert data["user"]["needs_legacy_migration"] is False
    token = data["token"]

    # Login rejection on pure digits
    res_digit = client.post("/api/auth/login", json={
        "username": "12345678",
        "password": "password123"
    })
    assert res_digit.status_code == 400
    assert "عددی تلگرام پشتیبانی نمی‌شود" in res_digit.json()["detail"]

    # Valid login
    res_login = client.post("/api/auth/login", json={
        "username": test_user,
        "password": "password123"
    })
    assert res_login.status_code == 200
    assert res_login.json()["user"]["needs_legacy_migration"] is False


def test_magic_login_pure_digits_rejection():
    res = client.post("/api/auth/magic-login/request", json={
        "identifier": "555123456"
    })
    assert res.status_code == 400
    assert "عددی تلگرام پشتیبانی نمی‌شود" in res.json()["detail"]


def test_change_username_endpoint():
    uid = uuid.uuid4().hex[:8]
    orig_user = f"ch_orig_{uid}"
    new_user = f"ch_new_{uid}"

    # Register a user to change username
    reg = client.post("/api/auth/register", json={
        "username": orig_user,
        "password": "password123",
        "display_name": "کاربر تغییر آیدی"
    })
    assert reg.status_code == 200
    token = reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Unauthorized
    res_unauth = client.post("/api/auth/change-username", json={"new_username": new_user})
    assert res_unauth.status_code == 401

    # 2. Invalid new username (reserved)
    res_reserved = client.post("/api/auth/change-username", json={"new_username": "admin"}, headers=headers)
    assert res_reserved.status_code == 400

    # 3. Invalid new username (starts with tg_)
    res_tg = client.post("/api/auth/change-username", json={"new_username": "tg_invalid"}, headers=headers)
    assert res_tg.status_code == 400

    # 4. Short password rejection (< 4 chars)
    res_short_pwd = client.post("/api/auth/change-username", json={
        "new_username": f"u_{uuid.uuid4().hex[:8]}",
        "password": "123"
    }, headers=headers)
    assert res_short_pwd.status_code == 400
    assert "حداقل ۴ کاراکتر" in res_short_pwd.json()["detail"]

    # 5. Collision rejection against another existing user
    collision_uid = uuid.uuid4().hex[:8]
    other_username = f"other_u_{collision_uid}"
    client.post("/api/auth/register", json={
        "username": other_username,
        "password": "password123",
        "display_name": "کاربر دیگر"
    })
    res_collision = client.post("/api/auth/change-username", json={
        "new_username": other_username
    }, headers=headers)
    assert res_collision.status_code == 400
    assert "قبلاً توسط کاربر دیگری" in res_collision.json()["detail"]

    # 6. Valid update with password and display name
    res_valid = client.post("/api/auth/change-username", json={
        "new_username": new_user,
        "password": "new_strong_password_123",
        "display_name": "نام جديد فارسي"
    }, headers=headers)
    assert res_valid.status_code == 200
    updated_data = res_valid.json()["user"]
    assert updated_data["username"] == new_user
    assert updated_data["display_name"] == "نام جدید فارسی"
    assert updated_data["has_password"] is True
    assert updated_data["needs_legacy_migration"] is False

    # 7. Verify /auth/me reflects the new username
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == new_user
