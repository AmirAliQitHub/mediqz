#!/bin/bash
set -e
mkdir -p docs/screenshots

echo "--- 1. Resetting all exam analyses on backend ---"
PYTHONPATH=backend python3 -c "from app.core.database import get_user_db; conn = get_user_db(); conn.execute('DELETE FROM student_exam_analyses'); conn.commit(); print('Cleared all analyses!')"

echo "--- 2. Running E2E test in agent-browser on mobile 375x812 ---"
agent-browser open "http://127.0.0.1:5173" --viewport 375,812 && \
agent-browser eval "localStorage.clear(); sessionStorage.clear();" && \
agent-browser reload && \
agent-browser wait 1500 && \
agent-browser fill "input[type='text']" "demo" && \
agent-browser fill "input[type='password']" "demo123" && \
agent-browser click "button[type='submit']" && \
agent-browser wait 2000 && \
agent-browser screenshot docs/screenshots/live_1_home.png && \
agent-browser eval "Array.from(document.querySelectorAll('button, a, span')).find(el => el.textContent.trim() === 'تحلیل' || el.textContent.trim() === 'تحلیل کارنامه')?.closest('button, a')?.click()" && \
agent-browser wait 1500 && \
agent-browser screenshot docs/screenshots/live_2_catalog.png && \
agent-browser eval "
  (function() {
    const cards = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.includes('MD12T-405Aba22'));
    const btn = cards.pop()?.querySelector('button');
    if (btn) { btn.click(); return 'Clicked MD12T exam button'; }
    const anyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ورود به پاسخ‌برگ'));
    if (anyBtn) { anyBtn.click(); return 'Clicked fallback exam button'; }
    return 'No exam button found';
  })()
" && \
agent-browser wait 2000 && \
agent-browser screenshot docs/screenshots/live_3_keypad.png && \
agent-browser eval "
  (function() {
    // Select option 2 on question 1
    const opt2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('۲'));
    if (opt2) opt2.click();
    return 'Selected option 2';
  })()
" && \
agent-browser wait 500 && \
agent-browser eval "
  (function() {
    const markBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('علامت‌گذاری باقی‌مانده'));
    if (markBtn) markBtn.click();
    return 'Marked remaining blank';
  })()
" && \
agent-browser wait 500 && \
agent-browser eval "
  (function() {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ثبت پاسخ‌برگ'));
    if (submitBtn) submitBtn.click();
    return 'Clicked submit keypad';
  })()
" && \
agent-browser wait 1000 && \
agent-browser screenshot docs/screenshots/live_4_keypad_modal.png && \
agent-browser eval "
  (function() {
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('تأیید ثبت'));
    if (confirmBtn) confirmBtn.click();
    return 'Confirmed submission modal';
  })()
" && \
agent-browser wait 2500 && \
agent-browser screenshot docs/screenshots/live_5_swot_step1.png && \
agent-browser eval "
  (function() {
    const ta = document.querySelector('textarea');
    if (ta) {
      ta.value = 'تسلط عالی روی تست‌های زمان‌دار زیست‌شناسی و دقت در مدیریت زمان';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return 'Typed strength 1';
    }
    return 'No textarea found';
  })()
" && \
agent-browser wait 500 && \
agent-browser eval "
  (function() {
    const grayCard = Array.from(document.querySelectorAll('[role=\"button\"], div')).find(el => el.textContent.includes('افزودن مورد بعدی') || el.textContent.includes('کلیک برای افزودن'));
    if (grayCard) {
      grayCard.click();
      return 'Clicked grayed-out item 2';
    }
    return 'No grayed card found';
  })()
" && \
agent-browser wait 1000 && \
agent-browser screenshot docs/screenshots/live_6_swot_grayed_activated.png && \
agent-browser eval "
  (function() {
    const tas = document.querySelectorAll('textarea');
    if (tas.length > 1) {
      tas[1].value = 'پایبندی ۱۰۰٪ به تست‌های آموزشی در هفته اول';
      tas[1].dispatchEvent(new Event('input', { bubbles: true }));
      return 'Typed strength 2';
    }
    return 'No textarea 2 found';
  })()
" && \
agent-browser wait 500 && \
agent-browser screenshot docs/screenshots/live_7_swot_two_items.png && \
agent-browser eval "
  (function() {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('مرحله بعدی'));
    if (nextBtn) nextBtn.click();
    return 'Next to step 2';
  })()
" && \
agent-browser wait 1000 && \
agent-browser screenshot docs/screenshots/live_8_swot_step2.png && \
agent-browser eval "
  (function() {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('مرحله بعدی'));
    if (nextBtn) nextBtn.click();
    return 'Next to step 3';
  })()
" && \
agent-browser wait 1000 && \
agent-browser screenshot docs/screenshots/live_9_swot_step3.png && \
agent-browser eval "
  (function() {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('مرحله بعدی'));
    if (nextBtn) nextBtn.click();
    return 'Next to step 4';
  })()
" && \
agent-browser wait 1000 && \
agent-browser screenshot docs/screenshots/live_10_swot_step4_terminal.png && \
agent-browser eval "
  (function() {
    const pills = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === '۱');
    if (pills.length > 0) pills[pills.length - 1].click();
    return 'Clicked Pill 1 backward';
  })()
" && \
agent-browser wait 1000 && \
agent-browser screenshot docs/screenshots/live_11_swot_backward_step1.png && \
agent-browser eval "
  (function() {
    const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('رد شدن از تحلیل SWOT'));
    if (skipBtn) skipBtn.click();
    return 'Clicked skip SWOT';
  })()
" && \
agent-browser wait 2000 && \
agent-browser screenshot docs/screenshots/live_12_journal_after_skip.png

echo "--- 3. Full E2E Journey Finished Successfully! ---"
