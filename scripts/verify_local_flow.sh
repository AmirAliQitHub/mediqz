#!/usr/bin/env bash
set -e

ARTIFACTS_DIR="/Users/amiralirakhshani/.gemini/antigravity/brain/6e694b05-5da0-4443-9b08-29a18bad9350"
mkdir -p "$ARTIFACTS_DIR"

echo "=== 1. Opening http://localhost:3000 ==="
agent-browser --session localflow open http://localhost:3000
agent-browser --session localflow wait 1500
agent-browser --session localflow screenshot "$ARTIFACTS_DIR/e2e_01_loginpad.png"

echo "=== 2. Logging in as Admin via quick pill ==="
agent-browser --session localflow find role button click --name "👑 ورود مدیر"
agent-browser --session localflow wait 2000
agent-browser --session localflow screenshot "$ARTIFACTS_DIR/e2e_02_admin_courses.png"

echo "=== 3. Navigating to TahlilHub (تحلیل آزمون) ==="
agent-browser --session localflow find role button click --name "تحلیل آزمون"
agent-browser --session localflow wait 2000
agent-browser --session localflow screenshot "$ARTIFACTS_DIR/e2e_03_admin_tahlilhub.png"

echo "=== 4. Navigating to RoutineHub ==="
agent-browser --session localflow find role button click --name "RoutineHub"
agent-browser --session localflow wait 2000
agent-browser --session localflow screenshot "$ARTIFACTS_DIR/e2e_04_admin_routinehub.png"

echo "=== 5. Opening User Profile Menu and Logging out ==="
agent-browser --session localflow find role button click --name "مدیر سیستم"
agent-browser --session localflow wait 1000
agent-browser --session localflow screenshot "$ARTIFACTS_DIR/e2e_05_profile_menu.png"
agent-browser --session localflow find role button click --name "خروج از حساب"
agent-browser --session localflow wait 1500
agent-browser --session localflow screenshot "$ARTIFACTS_DIR/e2e_06_after_logout.png"

echo "=== 6. Logging in as Demo Student ==="
agent-browser --session localflow find role button click --name "🎓 ورود دانش‌آموز"
agent-browser --session localflow wait 2000
agent-browser --session localflow screenshot "$ARTIFACTS_DIR/e2e_07_demo_courses.png"

echo "=== Verification Complete! ==="
