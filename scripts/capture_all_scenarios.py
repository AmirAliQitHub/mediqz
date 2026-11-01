#!/usr/bin/env python3
"""
scripts/capture_all_scenarios.py
Automated visual audit harness that captures screenshots across all 4 primary user scenarios:
1. Phone in Telegram WebApp (375x812, TWA SDK mock)
2. Phone in Non-Telegram WebApp (375x812, standalone mobile browser)
3. Desktop in Telegram WebApp (1024x768, Telegram Desktop embedded client)
4. Desktop in Non-Telegram WebApp (1440x900, standalone widescreen browser)

Saves 8 paired captures (Login & Library) to docs/screenshots/scenarios/.
"""

import os
import sys
import json
import time
import shlex
import urllib.request
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SCENARIOS_DIR = BASE_DIR / "docs" / "screenshots" / "scenarios"
SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)

AGENT_BROWSER = os.environ.get(
    "AGENT_BROWSER_BIN",
    str(Path.home() / ".gemini" / "antigravity" / "bin" / "agent-browser")
)
if not os.path.exists(AGENT_BROWSER):
    AGENT_BROWSER = "agent-browser"


def run_cmd(cmd: str, check: bool = True):
    res = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed [{res.returncode}]: {cmd}\nStderr: {res.stderr}\nStdout: {res.stdout}")
    return res


def is_port_open(port: int) -> bool:
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def wait_for_http(url: str, timeout: int = 15) -> bool:
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "HealthCheck/1.0"})
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status in (200, 404):
                    return True
        except Exception:
            time.sleep(0.5)
    return False


def provision_test_token() -> tuple[str, dict]:
    """Ensures a valid test user session exists in backend."""
    auth_req_data = json.dumps({
        "id": 99887766,
        "telegram_user_id": 99887766,
        "username": "scenario_auditor",
        "first_name": "حساب تستی اسکن چهارگانه",
        "display_name": "حساب تستی اسکن چهارگانه"
    }).encode("utf-8")
    auth_req = urllib.request.Request(
        "http://127.0.0.1:8008/api/auth/telegram",
        data=auth_req_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(auth_req, timeout=5.0) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    
    token = payload["token"]
    user = payload["user"]

    # Mark onboarded so library renders immediately
    if payload.get("needs_onboarding") or not user.get("is_onboarded"):
        onboard_req_data = json.dumps({
            "display_name": user.get("display_name", "حساب تستی اسکن چهارگانه"),
            "grade": "دهم"
        }).encode("utf-8")
        onboard_req = urllib.request.Request(
            "http://127.0.0.1:8008/api/auth/onboarding",
            data=onboard_req_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        with urllib.request.urlopen(onboard_req, timeout=5.0) as resp:
            user = json.loads(resp.read().decode("utf-8")).get("user", user)

    return token, user


def capture_scenario(
    name: str,
    width: int,
    height: int,
    is_telegram: bool,
    token: str,
    user: dict
):
    print(f"\n📸 Capturing Scenario: {name} ({width}x{height}, Telegram={is_telegram})")
    
    # 1. Set Viewport
    run_cmd(f"{AGENT_BROWSER} set viewport {width} {height}")

    # 2. Open clean unauthenticated page for Login view
    run_cmd(f"{AGENT_BROWSER} open http://127.0.0.1:3000")
    run_cmd(f"{AGENT_BROWSER} wait 1000")

    # Clear any previous auth state to capture unauthenticated view
    clean_js = "localStorage.clear(); sessionStorage.clear(); delete window.Telegram;"
    run_cmd(f"{AGENT_BROWSER} eval {shlex.quote(clean_js)}")
    run_cmd(f"{AGENT_BROWSER} reload")
    run_cmd(f"{AGENT_BROWSER} wait 1500")

    login_path = SCENARIOS_DIR / f"{name}_login.png"
    run_cmd(f"{AGENT_BROWSER} screenshot {shlex.quote(str(login_path))}")
    print(f"  ✓ Saved Login capture: {login_path.name}")

    # 3. Authenticate and capture Library view
    if is_telegram:
        auth_js = (
            f"localStorage.setItem('coursebox_token', '{token}');"
            f"localStorage.setItem('coursebox_user', JSON.stringify({json.dumps(user)}));"
            "window.Telegram = window.Telegram || {};"
            "window.Telegram.WebApp = {"
            "  initData: 'query_id=mock_query&user=%7B%22id%22%3A99887766%7D',"
            "  initDataUnsafe: { user: { id: 99887766, first_name: 'دانش‌آموز تستی', username: 'scenario_auditor' } },"
            "  ready: () => {},"
            "  expand: () => {},"
            "  close: () => {},"
            "  enableClosingConfirmation: () => {},"
            "  setHeaderColor: () => {},"
            "  setBackgroundColor: () => {},"
            "  themeParams: { bg_color: '#f4f8fd', text_color: '#0f172a' }"
            "};"
        )
    else:
        auth_js = (
            f"localStorage.setItem('coursebox_token', '{token}');"
            f"localStorage.setItem('coursebox_user', JSON.stringify({json.dumps(user)}));"
            "delete window.Telegram;"
        )

    run_cmd(f"{AGENT_BROWSER} eval {shlex.quote(auth_js)}")
    run_cmd(f"{AGENT_BROWSER} reload")
    run_cmd(f"{AGENT_BROWSER} wait 2500")

    lib_path = SCENARIOS_DIR / f"{name}_library.png"
    run_cmd(f"{AGENT_BROWSER} screenshot {shlex.quote(str(lib_path))}")
    print(f"  ✓ Saved Library capture: {lib_path.name}")


def main():
    print("=" * 65)
    print("🚀 Initiating 4-Scenario Visual Audit Capture Suite")
    print("=" * 65)

    # Health checks
    if not is_port_open(8008):
        print("❌ FastAPI backend is not running on port 8008. Please start it before auditing.")
        sys.exit(1)
    if not is_port_open(3000):
        print("❌ Vite frontend is not running on port 3000. Please start it before auditing.")
        sys.exit(1)

    token, user = provision_test_token()
    print(f"✅ Auth session ready for {user['display_name']} (@{user['username']})")

    try:
        # Scenario 1: Phone in Telegram WebApp
        capture_scenario("s1_phone_twa", 375, 812, True, token, user)

        # Scenario 2: Phone in Non-Telegram WebApp
        capture_scenario("s2_phone_web", 375, 812, False, token, user)

        # Scenario 3: Desktop in Telegram WebApp
        capture_scenario("s3_desktop_twa", 1024, 768, True, token, user)

        # Scenario 4: Desktop in Non-Telegram WebApp
        capture_scenario("s4_desktop_web", 1440, 900, False, token, user)

        print("\n" + "=" * 65)
        print("🎉 ALL 8 SCENARIO CAPTURES COMPLETED SUCCESSFULLY!")
        print(f"📁 Destination: {SCENARIOS_DIR}")
        print("=" * 65)

    finally:
        try:
            run_cmd(f"{AGENT_BROWSER} close", check=False)
        except Exception:
            pass


if __name__ == "__main__":
    main()
