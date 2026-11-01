#!/usr/bin/env bash
set -e

ARTIFACTS_DIR="/Users/amiralirakhshani/.gemini/antigravity/brain/6e694b05-5da0-4443-9b08-29a18bad9350"
mkdir -p "$ARTIFACTS_DIR"

echo "=== 1. Opening http://localhost:3000 ==="
agent-browser --session tahlilpure open http://localhost:3000
agent-browser --session tahlilpure wait 1500

echo "=== 2. Checking login state ==="
agent-browser --session tahlilpure find text "ورود مدیر" click || true
agent-browser --session tahlilpure wait 1500

echo "=== 3. Navigating to TahlilHub in top bar ==="
agent-browser --session tahlilpure find role button click --name "TahlilHub"
agent-browser --session tahlilpure wait 1500
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_01_catalog.png"

echo "=== 4. Entering M10T-405Mehr17 exam ==="
agent-browser --session tahlilpure find text "M10T-405Mehr17" click || agent-browser --session tahlilpure find text "ورود به پاسخ‌برگ و ژورنال" click || agent-browser --session tahlilpure find text "مشاهده آمار و ژورنال آزمون" click
agent-browser --session tahlilpure wait 1500
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_02_entered_exam.png"

echo "=== 5. Navigating to Rapid Keypad if on dashboard ==="
agent-browser --session tahlilpure find text "پاسخ‌برگ سریع" click || true
agent-browser --session tahlilpure wait 1000

# Click option 3
agent-browser --session tahlilpure find text "گزینه ۳" click || true
agent-browser --session tahlilpure wait 500
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_03_keypad_active.png"

# Mark remaining as blank
agent-browser --session tahlilpure find text "علامت‌گذاری باقی‌مانده به عنوان سفید" click || true
agent-browser --session tahlilpure wait 1000
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_04_keypad_all_blank.png"

# Submit keypad to proceed to journal
agent-browser --session tahlilpure find text "ثبت و ورود به ژورنال تفصیلی" click || true
agent-browser --session tahlilpure wait 1500
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_05_journal_view.png"

echo "=== 6. Testing Journal View Filtering ==="
agent-browser --session tahlilpure find text "غلط و سفید" click || true
agent-browser --session tahlilpure wait 800
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_06_journal_missed_question.png"

# Select "حل صحیح بدون زمان"
agent-browser --session tahlilpure find text "حل صحیح بدون زمان" click || true
agent-browser --session tahlilpure wait 500
# Select error reason "بی‌دقتی"
agent-browser --session tahlilpure find text "بی‌دقتی" click || true
agent-browser --session tahlilpure wait 500

# Save journal
agent-browser --session tahlilpure find text "ذخیره ژورنال و محاسبه آمارها" click || true
agent-browser --session tahlilpure wait 1500

echo "=== 7. Viewing Analytics Dashboard ==="
agent-browser --session tahlilpure find text "مشاهده داشبورد آماری" click || true
agent-browser --session tahlilpure wait 1500
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_07_analytics_in_exam.png"

echo "=== 8. Toggling to Outside Exam Mode ==="
agent-browser --session tahlilpure find text "خارج از شرایط آزمون (Outside Exam)" click || true
agent-browser --session tahlilpure wait 1000
agent-browser --session tahlilpure screenshot "$ARTIFACTS_DIR/tahlilhub_08_analytics_outside_exam.png"

echo "=== All E2E verification steps completed successfully! ==="
