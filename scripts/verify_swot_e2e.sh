#!/usr/bin/env bash
set -e

echo "=== [1/6] Opening app & Resetting Exam Analysis on Backend ==="
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"demo","password":"demo123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
curl -s -X POST "http://127.0.0.1:8000/api/exams/MD12T-405Aba22/analysis/reset" -H "Authorization: Bearer $TOKEN"

agent-browser open "http://127.0.0.1:5173" --viewport 375,812
sleep 1

# Check if login required
agent-browser eval "
  (function() {
    const userInp = document.querySelector('input[type=\"text\"]');
    const pwdInp = document.querySelector('input[type=\"password\"]');
    if (userInp && pwdInp) {
      userInp.value = 'demo';
      userInp.dispatchEvent(new Event('input', { bubbles: true }));
      pwdInp.value = 'demo123';
      pwdInp.dispatchEvent(new Event('input', { bubbles: true }));
      const btn = document.querySelector('button[type=\"submit\"]');
      if (btn) btn.click();
      return 'Logged in';
    }
    return 'Already logged in';
  })()
"
sleep 2

# Navigate to Tahlil tab
echo "=== [2/6] Navigating to TahlilHub ==="
agent-browser eval "
  (function() {
    const tahlilBtn = Array.from(document.querySelectorAll('button, a, span')).find(el => el.textContent.trim() === 'تحلیل' || el.textContent.trim() === 'تحلیل کارنامه');
    if (tahlilBtn) (tahlilBtn.closest('button, a') || tahlilBtn).click();
    return 'Clicked Tahlil tab';
  })()
"
sleep 2

# Click on Exam Card
echo "=== [3/6] Selecting Exam MD12T-405Aba22 ==="
agent-browser eval "
  (function() {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('ورود به پاسخ‌برگ') || b.textContent.includes('پاسخ‌برگ'));
    if (btns.length > 0) {
      btns[btns.length - 1].click();
      return 'Clicked exam card button';
    }
    return 'Button not found';
  })()
"
sleep 2
agent-browser screenshot docs/screenshots/live_step4_keypad_view.png

echo "=== [4/6] Answering on Keypad & Submitting ==="
agent-browser eval "
  (function() {
    // Pick option 2 on question 1
    const opt2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('۲'));
    if (opt2) opt2.click();

    // Mark remaining blank
    setTimeout(() => {
      const markBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('علامت‌گذاری باقی‌مانده'));
      if (markBtn) markBtn.click();
    }, 400);

    // Submit keypad
    setTimeout(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ثبت پاسخ‌برگ'));
      if (submitBtn) submitBtn.click();
    }, 800);

    return 'Initiated keypad submission';
  })()
"
sleep 2

# Confirm modal if open
agent-browser eval "
  (function() {
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('تأیید ثبت'));
    if (confirmBtn) confirmBtn.click();
    return 'Confirmed modal';
  })()
"
sleep 3
agent-browser screenshot docs/screenshots/live_step5_swot_step1.png

echo "=== [5/6] Interacting with Dynamic Grayed-Out Inputs ==="
# Type into item 1
agent-browser eval "
  (function() {
    const ta = document.querySelector('textarea');
    if (ta) {
      ta.value = 'تسلط عالی روی تست‌های زمان‌دار زیست‌شناسی و دقت بالا در گزینه‌های دام‌دار';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return 'Typed into item 1';
    }
    return 'Textarea not found';
  })()
"
sleep 1

# Click Grayed-Out card to activate Item 2
agent-browser eval "
  (function() {
    const grayCard = Array.from(document.querySelectorAll('[role=\"button\"], div')).find(el => el.textContent.includes('افزودن مورد بعدی') || el.textContent.includes('کلیک برای افزودن'));
    if (grayCard) {
      grayCard.click();
      return 'Clicked grayed card';
    }
    return 'Gray card not found';
  })()
"
sleep 2
agent-browser screenshot docs/screenshots/live_step6_swot_item2_activated.png

# Type into item 2
agent-browser eval "
  (function() {
    const tas = document.querySelectorAll('textarea');
    if (tas.length > 1) {
      tas[1].value = 'پایبندی ۱۰۰٪ به بودجه‌بندی آزمون در طول هفته اول';
      tas[1].dispatchEvent(new Event('input', { bubbles: true }));
      return 'Typed into item 2';
    }
    return 'Item 2 textarea not found';
  })()
"
sleep 1
agent-browser screenshot docs/screenshots/live_step7_swot_two_items.png

echo "=== [6/6] Testing Step 4 Terminal Button & Backward Navigation ==="
# Advance to Step 4
agent-browser eval "
  (function() {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('مرحله بعدی'));
    if (nextBtn) nextBtn.click();
    return 'Clicked Next';
  })()
"
sleep 1
agent-browser eval "
  (function() {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('مرحله بعدی'));
    if (nextBtn) nextBtn.click();
    return 'Clicked Next';
  })()
"
sleep 1
agent-browser eval "
  (function() {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('مرحله بعدی'));
    if (nextBtn) nextBtn.click();
    return 'Clicked Next';
  })()
"
sleep 2
agent-browser screenshot docs/screenshots/live_step8_swot_step4_terminal.png

# Click Pill 1 to test backward navigation
agent-browser eval "
  (function() {
    const pills = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === '۱');
    if (pills.length > 0) {
      pills[pills.length - 1].click();
      return 'Clicked Pill 1';
    }
    return 'Pill 1 not found';
  })()
"
sleep 2
agent-browser screenshot docs/screenshots/live_step9_backward_nav_step1.png

echo "=== Complete! All live mobile screenshots captured successfully ==="
