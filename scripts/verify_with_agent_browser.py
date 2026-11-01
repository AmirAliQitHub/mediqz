#!/usr/bin/env python3
import subprocess
import re
import time
from pathlib import Path

ARTIFACTS_DIR = Path("/Users/amiralirakhshani/.gemini/antigravity/brain/6e694b05-5da0-4443-9b08-29a18bad9350")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
SESSION = "tflow"

def run_cmd(cmd_list):
    full_cmd = ["agent-browser", "--session", SESSION] + cmd_list
    print(f">> Running: {' '.join(full_cmd)}")
    res = subprocess.run(full_cmd, capture_output=True, text=True)
    out = res.stdout.strip()
    err = res.stderr.strip()
    if res.returncode != 0 and err:
        print(f"ERR: {err[:200]}")
    return out

def get_snapshot():
    return run_cmd(["snapshot", "-i"])

def find_button_ref(snapshot_text, name_pattern):
    for line in snapshot_text.splitlines():
        if "button" in line and re.search(name_pattern, line):
            m = re.search(r'\[ref=(e\d+)\]', line)
            if m:
                return m.group(1)
    return None

def find_ref_any(snapshot_text, name_pattern):
    for line in snapshot_text.splitlines():
        if re.search(name_pattern, line):
            m = re.search(r'\[ref=(e\d+)\]', line)
            if m:
                return m.group(1)
    return None

def main():
    print("=== Step 1: Open localhost:3000 ===")
    run_cmd(["open", "http://localhost:3000"])
    run_cmd(["wait", "2000"])

    snap = get_snapshot()
    # Login if needed
    admin_btn = find_button_ref(snap, r"ورود مدیر")
    if admin_btn:
        print(f"Clicking Admin Login: @{admin_btn}")
        run_cmd(["click", f"@{admin_btn}"])
        run_cmd(["wait", "2000"])
        snap = get_snapshot()

    # Step 2: Navigate to TahlilHub
    print("=== Step 2: Click TahlilHub ===")
    tahlil_btn = find_button_ref(snap, r"TahlilHub")
    if tahlil_btn:
        print(f"Clicking TahlilHub: @{tahlil_btn}")
        run_cmd(["click", f"@{tahlil_btn}"])
        run_cmd(["wait", "2000"])
        snap = get_snapshot()
    
    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_01_catalog.png")])

    # Step 3: Enter M10T exam
    print("=== Step 3: Enter M10T-405Mehr17 exam ===")
    exam_btn = find_button_ref(snap, r"پاسخبرگ|ژورنال")
    if exam_btn:
        print(f"Clicking exam entry: @{exam_btn}")
        run_cmd(["click", f"@{exam_btn}"])
        run_cmd(["wait", "2000"])
        snap = get_snapshot()
    
    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_02_entered.png")])

    # Step 4: If on Dashboard, go to Keypad
    print("=== Step 4: Go to Rapid Keypad ===")
    keypad_nav = find_button_ref(snap, r"پاسخ.*سریع")
    if keypad_nav:
        print(f"Navigating to Keypad: @{keypad_nav}")
        run_cmd(["click", f"@{keypad_nav}"])
        run_cmd(["wait", "1500"])
        snap = get_snapshot()

    # Click Option 3 on Keypad
    opt3_btn = find_button_ref(snap, r"گزینه ۳")
    if opt3_btn:
        print(f"Clicking Option 3: @{opt3_btn}")
        run_cmd(["click", f"@{opt3_btn}"])
        run_cmd(["wait", "1000"])
        snap = get_snapshot()

    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_03_keypad.png")])

    # Mark remaining as blank
    blank_all_btn = find_button_ref(snap, r"علامت.*سفید")
    if blank_all_btn:
        print(f"Clicking Mark Remaining as Blank: @{blank_all_btn}")
        run_cmd(["click", f"@{blank_all_btn}"])
        run_cmd(["wait", "1000"])
        snap = get_snapshot()
    
    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_04_keypad_blanked.png")])

    # Submit Keypad to Journal
    submit_keypad_btn = find_button_ref(snap, r"ثبت و ورود به ژورنال")
    if submit_keypad_btn:
        print(f"Submitting Keypad: @{submit_keypad_btn}")
        run_cmd(["click", f"@{submit_keypad_btn}"])
        run_cmd(["wait", "2000"])
        snap = get_snapshot()

    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_05_journal.png")])

    # Step 5: Test Journal Filters and Outside Status
    print("=== Step 5: Test Journal Filters and Outside Status ===")
    missed_filter_btn = find_button_ref(snap, r"غلط و سفید")
    if missed_filter_btn:
        print(f"Clicking Missed Questions Filter: @{missed_filter_btn}")
        run_cmd(["click", f"@{missed_filter_btn}"])
        run_cmd(["wait", "1000"])
        snap = get_snapshot()

    # Click "حل صحیح بدون زمان"
    outside_solved_btn = find_button_ref(snap, r"حل صحیح بدون زمان")
    if outside_solved_btn:
        print(f"Selecting Outside Solved: @{outside_solved_btn}")
        run_cmd(["click", f"@{outside_solved_btn}"])
        run_cmd(["wait", "500"])
        snap = get_snapshot()

    # Click error reason "بی‌دقتی"
    err_careless_btn = find_button_ref(snap, r"بی‌دقتی")
    if err_careless_btn:
        print(f"Selecting Careless Error: @{err_careless_btn}")
        run_cmd(["click", f"@{err_careless_btn}"])
        run_cmd(["wait", "500"])
        snap = get_snapshot()

    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_06_journal_filled.png")])

    # Save Journal & Calculate
    save_journal_btn = find_button_ref(snap, r"ذخیره ژورنال")
    if save_journal_btn:
        print(f"Clicking Save Journal: @{save_journal_btn}")
        run_cmd(["click", f"@{save_journal_btn}"])
        run_cmd(["wait", "2000"])
        snap = get_snapshot()

    # Step 6: Go to Dashboard
    print("=== Step 6: Analytics Dashboard & Mode Toggle ===")
    dash_nav_btn = find_button_ref(snap, r"داشبورد آماری")
    if dash_nav_btn:
        print(f"Navigating to Dashboard: @{dash_nav_btn}")
        run_cmd(["click", f"@{dash_nav_btn}"])
        run_cmd(["wait", "2000"])
        snap = get_snapshot()

    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_07_dashboard_in_exam.png")])

    # Toggle to Outside Exam mode
    outside_mode_btn = find_button_ref(snap, r"خارج از شرایط آزمون")
    if outside_mode_btn:
        print(f"Toggling to Outside Exam mode: @{outside_mode_btn}")
        run_cmd(["click", f"@{outside_mode_btn}"])
        run_cmd(["wait", "1500"])

    run_cmd(["screenshot", str(ARTIFACTS_DIR / "tahlilhub_08_dashboard_outside_exam.png")])
    print("=== All screenshots captured successfully! ===")

if __name__ == "__main__":
    main()
