#!/usr/bin/env python3
"""
Comprehensive Live Cloud & Telegram E2E Verification Suite for Vercel (v2.7.0-vercel).
Audits:
1. Frontend Single Page Application (React Vite) on CDN Edge
2. FastAPI Serverless Health Probe
3. Interactive Course Catalog API
4. Telegram Bot Live Status & Webhook Metadata
5. Webhook HMAC Security Rejection of Unauthorized Payloads
6. Webhook Processing of Authorized /start Payload
7. Telegram WebApp Zero-Touch Silent Authentication
"""

import sys
import json
import urllib.request
import urllib.error

VERCEL_BASE_URL = "https://mediqz.vercel.app"
SECRET_TOKEN = "mediqz_webhook_secret_2026"

def log_test(name: str, passed: bool, detail: str = ""):
    status_icon = "✅ PASSED" if passed else "❌ FAILED"
    print(f"[{status_icon}] {name}")
    if detail:
        print(f"    └── {detail}")
    if not passed:
        sys.exit(1)

def test_frontend_root():
    url = f"{VERCEL_BASE_URL}/"
    req = urllib.request.Request(url, headers={"User-Agent": "Vercel-E2E-Tester/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            content = res.read().decode("utf-8")
            status = res.status
            content_type = res.headers.get("content-type", "")
            has_html = "<!doctype html>" in content.lower() or "<html" in content.lower()
            log_test(
                "1. Frontend React SPA Edge Root",
                status == 200 and has_html,
                f"HTTP {status}, Content-Type: {content_type}, Length: {len(content)} bytes"
            )
    except Exception as e:
        log_test("1. Frontend React SPA Edge Root", False, str(e))

def test_api_health():
    url = f"{VERCEL_BASE_URL}/api/health"
    req = urllib.request.Request(url, headers={"User-Agent": "Vercel-E2E-Tester/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode("utf-8"))
            is_healthy = data.get("status") == "healthy"
            log_test(
                "2. FastAPI Serverless Health Probe",
                res.status == 200 and is_healthy,
                f"Status: {data.get('status')}, Persian Name: {data.get('persian_name')}"
            )
    except Exception as e:
        log_test("2. FastAPI Serverless Health Probe", False, str(e))

def test_courses_catalog():
    url = f"{VERCEL_BASE_URL}/api/courses"
    req = urllib.request.Request(url, headers={"User-Agent": "Vercel-E2E-Tester/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            courses = json.loads(res.read().decode("utf-8"))
            count = len(courses)
            has_arabic = any("arabic" in c.get("id", "") for c in courses)
            has_persian = any("persian" in c.get("id", "") for c in courses)
            log_test(
                "3. Course Catalog API",
                res.status == 200 and count >= 10 and has_arabic and has_persian,
                f"Total Courses: {count}, Sample IDs: {[c['id'] for c in courses[:3]]}"
            )
    except Exception as e:
        log_test("3. Course Catalog API", False, str(e))

def test_telegram_bot_status():
    url = f"{VERCEL_BASE_URL}/api/telegram/status"
    req = urllib.request.Request(url, headers={"User-Agent": "Vercel-E2E-Tester/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode("utf-8"))
            active = data.get("active") is True
            bot_username = data.get("bot", {}).get("username")
            webhook_url = data.get("webhook", {}).get("url")
            expected_webhook = f"{VERCEL_BASE_URL}/api/telegram/webhook"
            log_test(
                "4. Telegram Bot Live Connectivity & Webhook Status",
                res.status == 200 and active and bot_username == "MediqzBot" and webhook_url == expected_webhook,
                f"Bot: @{bot_username}, Webhook: {webhook_url}, Pending: {data.get('webhook', {}).get('pending_update_count')}"
            )
    except Exception as e:
        log_test("4. Telegram Bot Live Connectivity & Webhook Status", False, str(e))

def test_webhook_hmac_security():
    url = f"{VERCEL_BASE_URL}/api/telegram/webhook"
    dummy_payload = json.dumps({"update_id": 999999}).encode("utf-8")
    
    # Send without token or with forged token -> MUST return 403
    req = urllib.request.Request(
        url,
        data=dummy_payload,
        headers={
            "Content-Type": "application/json",
            "X-Telegram-Bot-Api-Secret-Token": "invalid_forged_secret_token_123"
        },
        method="POST"
    )
    try:
        urllib.request.urlopen(req, timeout=15)
        log_test("5. Webhook HMAC Security Rejection (Forged Token)", False, "Expected HTTP 403 but got 200!")
    except urllib.error.HTTPError as e:
        log_test(
            "5. Webhook HMAC Security Rejection (Forged Token)",
            e.code == 403,
            f"Successfully rejected with HTTP {e.code} ({e.reason})"
        )
    except Exception as e:
        log_test("5. Webhook HMAC Security Rejection (Forged Token)", False, str(e))

def test_webhook_valid_update():
    url = f"{VERCEL_BASE_URL}/api/telegram/webhook"
    # Realistic Telegram update payload with /start command
    mock_update = {
        "update_id": 1000001,
        "message": {
            "message_id": 501,
            "from": {
                "id": 987654321,
                "is_bot": False,
                "first_name": "KonkurStudent",
                "username": "student_test",
                "language_code": "fa"
            },
            "chat": {
                "id": 987654321,
                "type": "private",
                "first_name": "KonkurStudent",
                "username": "student_test"
            },
            "date": 1793530000,
            "text": "/start"
        }
    }
    payload = json.dumps(mock_update).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "X-Telegram-Bot-Api-Secret-Token": SECRET_TOKEN
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode("utf-8"))
            ok = data.get("ok") is True
            log_test(
                "6. Webhook Processing of Authorized /start Payload",
                res.status == 200 and ok,
                f"HTTP {res.status}, Response: {data}"
            )
    except Exception as e:
        log_test("6. Webhook Processing of Authorized /start Payload", False, str(e))

def test_telegram_webapp_auth():
    url = f"{VERCEL_BASE_URL}/api/auth/telegram"
    auth_payload = json.dumps({
        "id": 987654321,
        "first_name": "KonkurStudent",
        "username": "student_test",
        "language_code": "fa"
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=auth_payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode("utf-8"))
            token = data.get("token")
            user = data.get("user", {})
            user_id = user.get("id")
            tg_id = user.get("telegram_user_id")
            log_test(
                "7. Telegram WebApp Zero-Touch Silent Authentication",
                res.status == 200 and bool(token) and tg_id == 987654321,
                f"User ID: {user_id}, Telegram ID: {tg_id}, Token: {token[:12]}..."
            )
    except Exception as e:
        log_test("7. Telegram WebApp Zero-Touch Silent Authentication", False, str(e))

def main():
    print("=" * 70)
    print("🚀 Running Alqualite CourseBox & MediqzBot Vercel Live Verification")
    print(f"Target URL: {VERCEL_BASE_URL}")
    print("=" * 70)

    test_frontend_root()
    test_api_health()
    test_courses_catalog()
    test_telegram_bot_status()
    test_webhook_hmac_security()
    test_webhook_valid_update()
    test_telegram_webapp_auth()

    print("=" * 70)
    print("🎉 ALL 7 LIVE CLOUD VERIFICATION GATES PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    main()
