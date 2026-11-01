#!/usr/bin/env python3
"""
scripts/verify_mobile_twa.py
Automated end-to-end mobile browser verification script for Telegram Mini App (TWA).
Executes layout assertions on 375x812 viewport, checks zero console errors,
and captures visual evidence in docs/screenshots/.
"""

import os
import sys
import json
import time
import shlex
import signal
import urllib.request
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SCREENSHOTS_DIR = BASE_DIR / "docs" / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

AGENT_BROWSER = os.environ.get(
    "AGENT_BROWSER_BIN",
    str(Path.home() / ".gemini" / "antigravity" / "bin" / "agent-browser")
)
if not os.path.exists(AGENT_BROWSER):
    AGENT_BROWSER = "agent-browser"


def run_cmd(cmd, check=True):
    res = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed [{res.returncode}]: {cmd}\nStderr: {res.stderr}\nStdout: {res.stdout}")
    return res


def is_port_open(port):
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def wait_for_http(url, timeout=20):
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


def main():
    print("=" * 60)
    print("🚀 Starting Mobile TWA Verification (375x812 Viewport)")
    print("=" * 60)

    spawned_procs = []

    try:
        # 1. Start Backend if not running
        if not is_port_open(8008):
            print("🔹 Starting FastAPI backend on port 8008...")
            backend_env = os.environ.copy()
            backend_env["PYTHONPATH"] = str(BASE_DIR / "backend")
            p_backend = subprocess.Popen(
                [sys.executable, str(BASE_DIR / "backend" / "run.py")],
                cwd=str(BASE_DIR / "backend"),
                env=backend_env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            spawned_procs.append(p_backend)
            if not wait_for_http("http://127.0.0.1:8008/docs", timeout=15):
                raise RuntimeError("Backend failed to respond on port 8008 within 15 seconds")
            print("✅ Backend is ready.")
        else:
            print("ℹ️ Backend already running on port 8008.")

        # 2. Start Frontend if not running
        if not is_port_open(3000):
            print("🔹 Starting Vite frontend on port 3000...")
            p_frontend = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=str(BASE_DIR / "frontend"),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            spawned_procs.append(p_frontend)
            if not wait_for_http("http://127.0.0.1:3000", timeout=15):
                raise RuntimeError("Frontend failed to respond on port 3000 within 15 seconds")
            print("✅ Frontend is ready.")
        else:
            print("ℹ️ Frontend already running on port 3000.")

        # 3. Create / Fetch test Telegram user token
        print("🔹 Provisioning authenticated test user via /api/auth/telegram...")
        auth_req_data = json.dumps({
            "id": 99887766,
            "telegram_user_id": 99887766,
            "username": "mobile_verifier",
            "first_name": "دانش‌آموز تستی موبایل",
            "display_name": "دانش‌آموز تستی موبایل"
        }).encode("utf-8")
        auth_req = urllib.request.Request(
            "http://127.0.0.1:8008/api/auth/telegram",
            data=auth_req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(auth_req, timeout=5.0) as resp:
            auth_payload = json.loads(resp.read().decode("utf-8"))
        
        token = auth_payload.get("token")
        user = auth_payload.get("user")
        assert token and user, f"Invalid auth payload: {auth_payload}"
        print(f"✅ User provisioned: {user['display_name']} (@{user['username']})")

        # 3.1 Complete onboarding if needed so student lands on Course Library
        if auth_payload.get("needs_onboarding") or not user.get("is_onboarded"):
            print("🔹 Completing student onboarding...")
            onboard_req_data = json.dumps({
                "display_name": "دانش‌آموز تستی موبایل",
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
                onboard_resp = json.loads(resp.read().decode("utf-8"))
                user = onboard_resp.get("user", user)
            print("✅ Onboarding completed.")

        # 4. Configure agent-browser session
        print("🔹 Launching agent-browser and setting viewport to 375x812...")
        run_cmd(f"{AGENT_BROWSER} set viewport 375 812")

        # Open frontend
        print("🔹 Navigating to http://127.0.0.1:3000...")
        run_cmd(f"{AGENT_BROWSER} open http://127.0.0.1:3000")
        run_cmd(f"{AGENT_BROWSER} wait 1500")

        # Inject Auth and Mock Telegram WebApp
        print("🔹 Injecting coursebox_token and Telegram WebApp environment...")
        inject_js = (
            f"localStorage.setItem('coursebox_token', '{token}');"
            f"localStorage.setItem('coursebox_user', JSON.stringify({json.dumps(user)}));"
            "window.Telegram = window.Telegram || {};"
            "window.Telegram.WebApp = {"
            "  initData: 'query_id=mock_query&user=%7B%22id%22%3A99887766%7D',"
            "  initDataUnsafe: { user: { id: 99887766, first_name: 'دانش‌آموز تستی موبایل', username: 'mobile_verifier' } },"
            "  ready: function() { console.log('TWA ready'); },"
            "  expand: function() { console.log('TWA expand'); },"
            "  close: function() {},"
            "  enableClosingConfirmation: function() {},"
            "  setHeaderColor: function() {},"
            "  setBackgroundColor: function() {},"
            "  themeParams: { bg_color: '#ffffff', text_color: '#000000' }"
            "};"
        )
        run_cmd(f"{AGENT_BROWSER} eval {shlex.quote(inject_js)}")
        run_cmd(f"{AGENT_BROWSER} reload")
        run_cmd(f"{AGENT_BROWSER} wait 3000")

        # 5. Measure Layout & Overflow in Library View
        print("🔹 Auditing layout overflow on Course Library View (375px)...")
        check_overflow_js = (
            "(() => {"
            "  const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);"
            "  const innerW = window.innerWidth;"
            "  const clientW = document.documentElement.clientWidth;"
            "  return JSON.stringify({"
            "    scrollW: scrollW,"
            "    clientW: clientW,"
            "    innerW: innerW,"
            "    hasOverflow: scrollW > innerW"
            "  });"
            "})()"
        )
        eval_res = run_cmd(f"{AGENT_BROWSER} eval {shlex.quote(check_overflow_js)}")
        raw_output = eval_res.stdout.strip()
        # agent-browser eval may return JSON wrapped in quotes
        if raw_output.startswith('"') and raw_output.endswith('"'):
            raw_output = json.loads(raw_output)
        layout_data = json.loads(raw_output)
        print(f"📊 Course Library Layout Metrics: {layout_data}")

        if layout_data.get("hasOverflow") or layout_data.get("scrollW", 0) > 375:
            raise AssertionError(f"Horizontal overflow detected! {layout_data}")
        print("✅ Course Library View: Zero horizontal overflow on 375px viewport.")

        # Capture Library Screenshot
        lib_shot = SCREENSHOTS_DIR / "mobile_375x812_library.png"
        run_cmd(f"{AGENT_BROWSER} screenshot {shlex.quote(str(lib_shot))}")
        print(f"📸 Saved library screenshot: {lib_shot}")

        # 6. Navigate into First Course & First Part (Course Player)
        print("🔹 Navigating into first course and course player...")
        click_course_js = (
            "(() => {"
            "  const cards = document.querySelectorAll('.liquid-glass-card, [class*=\"bg-gradient-to-br\"]');"
            "  for (let i = 0; i < cards.length; i++) {"
            "    if (cards[i].innerText && (cards[i].innerText.includes('دوره') || cards[i].innerText.includes('پارت'))) {"
            "      cards[i].click();"
            "      return true;"
            "    }"
            "  }"
            "  if (cards.length > 0) {"
            "    cards[0].click();"
            "    return true;"
            "  }"
            "  return false;"
            "})()"
        )
        run_cmd(f"{AGENT_BROWSER} eval {shlex.quote(click_course_js)}")
        run_cmd(f"{AGENT_BROWSER} wait 2000")

        # Now click first part to open Course Player
        click_part_js = (
            "(() => {"
            "  const elements = document.querySelectorAll('button, div[onClick], .liquid-glass-card');"
            "  for (let i = 0; i < elements.length; i++) {"
            "    const text = elements[i].innerText || '';"
            "    if (text.includes('پارت') || text.includes('شروع') || text.includes('ورود')) {"
            "      elements[i].click();"
            "      return true;"
            "    }"
            "  }"
            "  return false;"
            "})()"
        )
        run_cmd(f"{AGENT_BROWSER} eval {shlex.quote(click_part_js)}")
        run_cmd(f"{AGENT_BROWSER} wait 2000")

        # Measure Layout in Course Player View
        eval_player_res = run_cmd(f"{AGENT_BROWSER} eval {shlex.quote(check_overflow_js)}")
        raw_player_output = eval_player_res.stdout.strip()
        if raw_player_output.startswith('"') and raw_player_output.endswith('"'):
            raw_player_output = json.loads(raw_player_output)
        player_layout_data = json.loads(raw_player_output)
        print(f"📊 Course Player Layout Metrics: {player_layout_data}")

        if player_layout_data.get("hasOverflow") or player_layout_data.get("scrollW", 0) > 375:
            raise AssertionError(f"Horizontal overflow detected in Player! {player_layout_data}")
        print("✅ Course Player View: Zero horizontal overflow on 375px viewport.")

        player_shot = SCREENSHOTS_DIR / "mobile_375x812_player.png"
        run_cmd(f"{AGENT_BROWSER} screenshot {shlex.quote(str(player_shot))}")
        print(f"📸 Saved player screenshot: {player_shot}")

        # 7. Check browser console errors
        print("🔹 Checking for unhandled console errors...")
        error_res = run_cmd(f"{AGENT_BROWSER} errors", check=False)
        error_output = error_res.stdout.strip()
        print(f"Console errors output: {error_output if error_output else 'None'}")
        if error_output and "Error" in error_output:
            raise AssertionError(f"Unhandled console errors detected:\n{error_output}")
        print("✅ 0 unhandled console errors.")

        print("=" * 60)
        print("🎉 ALL MOBILE TWA VERIFICATIONS PASSED SUCCESSFULLY!")
        print("=" * 60)

    finally:
        print("🔹 Cleaning up browser session and child processes...")
        try:
            run_cmd(f"{AGENT_BROWSER} close", check=False)
        except Exception:
            pass

        for p in spawned_procs:
            try:
                p.terminate()
                p.wait(timeout=3)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
        print("✅ Cleanup complete.")


if __name__ == "__main__":
    main()
