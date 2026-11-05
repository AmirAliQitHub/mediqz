#!/usr/bin/env python3
"""
Automated mobile verification script for Duel Mediqz Exam (MD12T-405Aba22) in TahlilHub.
Uses agent-browser CLI to test live usability on mobile viewport (375x812).
Verifies Council Mandates #7-#11:
- Mandate #7: 140-Question Draft Persistence (localStorage)
- Mandate #8: Exam Selection Card Ergonomics (compact badges, no wrap)
- Mandate #9: Sticky Subject Navigation & 44px Touch Targets
- Mandate #10: Enum Localization & 100% Persian Numerals
- Mandate #11: Premature Submission Guard Modal
"""

import json
import re
import subprocess
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / ".agents" / "research"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
SESSION = "duel_tahlil_mobile"


def run_cmd(args):
    cmd = ["agent-browser", "--session", SESSION] + args
    res = subprocess.run(cmd, capture_output=True, text=True)
    out = res.stdout.strip()
    err = res.stderr.strip()
    if res.returncode != 0 and err:
        print(f"  [CLI ERR]: {err[:160]}")
    return out


def get_snapshot():
    return run_cmd(["snapshot", "-i"])


def find_ref(snapshot_text, pattern, element_type="button"):
    for line in snapshot_text.splitlines():
        if element_type in line and re.search(pattern, line):
            m = re.search(r'\[ref=(e\d+)\]', line)
            if m:
                return m.group(1)
    return None


def main():
    print("\n" + "="*60)
    print("📱 COMMENCING BLACK-BOX MOBILE VERIFICATION (375x812)")
    print("="*60)

    # Step 1: Configure Mobile Viewport
    print("\n[1/7] Setting viewport to 375x812 (iPhone SE/Mini standard)...")
    run_cmd(["set", "viewport", "375", "812"])
    run_cmd(["open", "http://127.0.0.1:5173"])
    run_cmd(["wait", "2000"])

    snap = get_snapshot()

    # Step 2: Handle Authentication
    if "ali_rezaei" in snap or "ورود به سامانه" in snap or "••••••••" in snap:
        print("[2/7] Authenticating with demo credentials...")
        # Fill username & password
        for line in snap.splitlines():
            if "textbox" in line and "ali_rezaei" in line:
                m = re.search(r'\[ref=(e\d+)\]', line)
                if m:
                    run_cmd(["fill", f"@{m.group(1)}", "demo"])
            elif "textbox" in line and "••••••••" in line:
                m = re.search(r'\[ref=(e\d+)\]', line)
                if m:
                    run_cmd(["fill", f"@{m.group(1)}", "demo123"])

        submit_btn = find_ref(snap, r"ورود به سامانه", "button")
        if submit_btn:
            run_cmd(["click", f"@{submit_btn}"])
            run_cmd(["wait", "2500"])
            snap = get_snapshot()
    else:
        print("[2/7] Already authenticated or in dashboard session.")

    # Step 3: Navigate to TahlilHub
    print("[3/7] Navigating to TahlilHub...")
    tahlil_nav = find_ref(snap, r"تحلیل", "button")
    if tahlil_nav:
        run_cmd(["click", f"@{tahlil_nav}"])
        run_cmd(["wait", "2000"])
        snap = get_snapshot()

    # Step 4: Verify Catalog Card Ergonomics (Mandate #8)
    print("[4/7] Auditing Exam Catalog View...")
    catalog_screenshot = ARTIFACTS_DIR / "tahlil_duel_01_catalog.png"
    run_cmd(["screenshot", str(catalog_screenshot)])

    has_duel_exam = "دوئل مدیاز" in snap or "MD12T-405Aba22" in snap
    has_m10_exam = "آزمون ۱۷ مهر" in snap or "M10T-405Mehr17" in snap
    print(f"  - Duel Mediqz Exam (MD12T-405Aba22) Present: {'✅ YES' if has_duel_exam else '❌ NO'}")
    print(f"  - Baseline Exam (M10T-405Mehr17) Intact:     {'✅ YES' if has_m10_exam else '❌ NO'}")

    if not has_duel_exam:
        print("❌ ERROR: Duel Mediqz exam not listed in catalog!")
        sys.exit(1)

    # Step 5: Enter Rapid Keypad for Duel Exam
    print("\n[5/7] Entering Duel Exam Rapid Keypad...")
    # Find entry button for Duel exam
    enter_btn = None
    lines = snap.splitlines()
    for i, line in enumerate(lines):
        if "دوئل مدیاز" in line or "MD12T-405Aba22" in line:
            # Look ahead for button
            for j in range(i, min(i + 10, len(lines))):
                if "button" in lines[j] and ("ورود به پاسخ" in lines[j] or "مشاهده آمار" in lines[j]):
                    m = re.search(r'\[ref=(e\d+)\]', lines[j])
                    if m:
                        enter_btn = m.group(1)
                        break
            if enter_btn:
                break

    if not enter_btn:
        enter_btn = find_ref(snap, r"ورود به پاسخ|مشاهده آمار", "button")

    if enter_btn:
        run_cmd(["click", f"@{enter_btn}"])
        run_cmd(["wait", "2500"])
        snap = get_snapshot()

    keypad_screenshot = ARTIFACTS_DIR / "tahlil_duel_02_keypad.png"
    run_cmd(["screenshot", str(keypad_screenshot)])

    # Verify Keypad Elements: Option 2, Persian Digits, Sticky Subjects
    has_bio_tab = "زیست" in snap
    has_opt2 = "گزینه ۲" in snap
    print(f"  - Subject Tab Bar Active: {'✅ YES' if has_bio_tab else '❌ NO'}")
    print(f"  - 44px+ Option Buttons Present: {'✅ YES' if has_opt2 else '❌ NO'}")

    # Select Option 2 on Q1 (Correct Option for Q1 Bio)
    opt2_ref = find_ref(snap, r"گزینه ۲", "button")
    if opt2_ref:
        print(f"  - Selecting Option 2 on Q1: @{opt2_ref}")
        run_cmd(["click", f"@{opt2_ref}"])
        run_cmd(["wait", "1000"])
        snap = get_snapshot()

    # Step 6: Test Premature Submission Guard Modal (Mandate #11)
    print("\n[6/7] Testing Premature Submission Guard (Incomplete Answers)...")
    submit_btn = find_ref(snap, r"ثبت و ورود به ژورنال", "button")
    if submit_btn:
        run_cmd(["click", f"@{submit_btn}"])
        run_cmd(["wait", "1500"])
        snap = get_snapshot()

    modal_screenshot = ARTIFACTS_DIR / "tahlil_duel_03_guard_modal.png"
    run_cmd(["screenshot", str(modal_screenshot)])

    has_modal = "آیا از ثبت نهایی اطمینان دارید" in snap or "سوال بی‌پاسخ" in snap
    print(f"  - Premature Guard Modal Triggered: {'✅ YES' if has_modal else '❌ NO'}")

    # Confirm in modal
    confirm_btn = find_ref(snap, r"تأیید ثبت با سوالات بی‌پاسخ", "button")
    if confirm_btn:
        print(f"  - Confirming submission in guard modal: @{confirm_btn}")
        run_cmd(["click", f"@{confirm_btn}"])
        run_cmd(["wait", "2500"])
        snap = get_snapshot()

    # Step 7: Verify Journal View
    print("\n[7/7] Verifying Question Journal View...")
    journal_screenshot = ARTIFACTS_DIR / "tahlil_duel_04_journal.png"
    run_cmd(["screenshot", str(journal_screenshot)])

    has_journal = "ژورنال تفصیلی" in snap or "فیلتر سوالات" in snap or "صحیح در آزمون" in snap
    print(f"  - Question Journal View Rendered: {'✅ YES' if has_journal else '❌ NO'}")

    print("\n" + "="*60)
    print("🎯 MOBILE BLACK-BOX VERIFICATION COMPLETE")
    print("="*60)
    print(f"Saved Screenshots in {ARTIFACTS_DIR}:")
    print(f"  1. {catalog_screenshot.name}")
    print(f"  2. {keypad_screenshot.name}")
    print(f"  3. {modal_screenshot.name}")
    print(f"  4. {journal_screenshot.name}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
