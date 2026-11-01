# Design Specification: Clinical Exam Analysis Engine (تحلیل آزمون / TahlilHub)

**Document Path:** `docs/superpowers/specs/2026-10-19-exam-analysis-tahlilhub-design.md`  
**Date:** 2026-10-19  
**Status:** In Review (Superpowers Brainstorming & Spec Phase)  
**Target Platform:** Web (Desktop & Mobile-Responsive for Alqualite CourseBox, port-ready for MediqzBot)  
**Seed Dataset:** آزمون ۱۷ مهر دهم تجربی ماز (90 Questions across Biology, Math, Physics, Chemistry)

---

## 1. Intent & The "Why"

Taking a 90-question competitive exam (like Maze / آزمون‌های ماز) on Friday morning is emotionally exhausting for 10th-grade students transitioning from middle school. Standard test platforms merely assign a score and list raw mistakes, which triggers **learned helplessness (درماندگی آموخته‌شده)** and post-exam avoidance.

The **Clinical Exam Analysis Engine (تحلیل آزمون / TahlilHub)** shifts the paradigm from punitive grading to a **cognitive biopsy (بیوپسی شناختی)**:
1. **Separates Knowledge from Test Anxiety:** By contrasting exam performance with an untimed **Home Re-solve (حل مجدد در خانه)**, the system calculates the student's **Potential Score (درصد بالقوه)** and **Anxiety/Pacing Tax (مالیات اضطراب و زمان)**.
2. **Eliminates Data-Entry Friction:** A specialized high-velocity keypad and keyboard hotkeys (`1` = درست, `2` = غلط, `3` = نزده) allow students to record all 90 questions in under 90 seconds without tedious dropdowns or cognitive fatigue.
3. **Automated Topic & Typology Aggregation:** Questions are automatically mapped to subjects, topics, and question types (مفهومی, محاسباتی, حفظی, ترکیبی) via an isolated exam metadata catalog.
4. **Actionable Clinical Prescription (نسخه تجویزی):** Instead of twenty pages of confusing charts, the engine outputs an immediate 2-week prioritized remediation plan: Top 3 Quick Wins, weekly study time budget, and topic triage.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Frictionless Entry:** Record 90 questions in under 90 seconds on desktop (`1`, `2`, `3` numpad) and mobile (3 large thumb buttons).
- **Home Re-solve Flow:** Seamless transition to re-solving only wrong and blank questions without pressure, celebrating reclaimed points with a golden badge ("شکار شد در خانه! 🎯").
- **Clinical Diagnostics:** Calculate Actual Score vs. Potential Score, Anxiety Tax %, and categorize causes of error (علمی, یادگیری ناقص, بی‌دقتی, زمان/استرس, تله طراح).
- **Taxonomy Breakdown:** Display performance split by question type (مفهومی, محاسباتی, حفظی, ترکیبی) and topic chapters across the 4 subjects.
- **Strict Architectural Decoupling:** Keep Exam Metadata Profiles (`exams.db` / read-only templates) strictly separated from Student Submissions (`userdata.db`), ready for automated scraping/sync from Maze, Kanoon, or Gozine2 in future phases.
- **Seed Data Quality:** Include the authentic 90-question 17 Mehr Dahom Tajrobi Maze exam dataset with real answer keys and difficulty/topic tags.

### Non-Goals
- Real-time multiplayer competition during analysis.
- Live video Proctoring or camera monitoring.
- Automated OCR scanning of paper bubble sheets in this iteration (future phase).

### Anti-Goals
- **No Demoralizing "Red Walls":** Never present a punitive, crimson-dominated wall of shame. Use soft coral/amber accents and empowering pedagogical framing ("تله‌های کشف‌شده", "ایستگاه یادگیری").
- **No Multi-Click Surveys During Phase 1:** Never interrupt rapid question entry with popups asking "why did you miss this?"—cause tagging is deferred to the Home Re-solve phase.
- **No Generic Platitudes:** Never tell a student "study harder"; provide specific chapter, subtopic, and hour budgets (e.g. "فصل ۱ فیزیک، تبدیل زنجیره‌ای واحدها: ۱.۵ ساعت تست آموزشی").

---

## 3. System Architecture & Database Schema

The architecture maintains strict decoupling between **Exam Catalog (Master Templates)** and **User Submissions (Student Analytics)**.

```
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│      EXAM MASTER CATALOG (exams.db)    │       │     USER SESSIONS (userdata.db)        │
│  - Static / Read-only template         │       │  - Student specific submissions        │
│  - Syncable via API/Scraper            │       │  - Progress, tags & home re-solves     │
├────────────────────────────────────────┤       ├────────────────────────────────────────┤
│ • exams (id, title, provider, date)    │       │ • student_exam_analyses                │
│ • exam_questions (q_num, subject,      │◄──────┤   (id, user_id, exam_id, status,       │
│   correct_opt, topic, q_type, diff)    │       │    phase1_answers, phase2_resolves,    │
└────────────────────────────────────────┘       │    calculated_metrics, completed_at)   │
                                                 └────────────────────────────────────────┘
```

### 3.1. `exams.db` — Exam Catalog Schema

```sql
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,               -- e.g. 'maze-10t-14030717'
    title TEXT NOT NULL,               -- e.g. 'آزمون ۱۷ مهر دهم تجربی ماز'
    provider TEXT NOT NULL,            -- 'ماز' | 'قلم‌چی' | 'گزینه دو'
    grade TEXT NOT NULL,               -- '10'
    major TEXT NOT NULL,               -- 'تجربی'
    held_date TEXT NOT NULL,           -- '1403-07-17'
    total_questions INTEGER NOT NULL,  -- 90
    sections_json TEXT NOT NULL        -- JSON list of subject metadata
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id TEXT NOT NULL,
    q_num INTEGER NOT NULL,            -- 1 .. 90
    subject TEXT NOT NULL,             -- 'زیست‌شناسی', 'ریاضی', 'فیزیک', 'شیمی'
    correct_opt INTEGER NOT NULL,      -- 1, 2, 3, 4
    difficulty TEXT NOT NULL,          -- 'آسان', 'متوسط', 'دشوار'
    q_type TEXT NOT NULL,              -- 'مفهومی', 'محاسباتی', 'حفظی', 'ترکیبی', 'نکات شکل'
    topic TEXT NOT NULL,               -- e.g. 'فصل ۱: دنیای زنده'
    subtopic TEXT,                     -- e.g. 'یاخته و بافت‌های جانوری'
    page_number INTEGER,               -- Reference to page in official booklet
    explanation_summary TEXT,          -- Core educational takeaway
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    UNIQUE(exam_id, q_num)
);
```

### 3.2. `userdata.db` — Student Submissions Schema

```sql
CREATE TABLE IF NOT EXISTS student_exam_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exam_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'phase1', -- 'phase1' | 'phase2' | 'completed'
    exam_score_pct REAL DEFAULT 0.0,
    potential_score_pct REAL DEFAULT 0.0,
    anxiety_tax_pct REAL DEFAULT 0.0,
    phase1_answers_json TEXT NOT NULL,     -- { "1": "correct", "2": "wrong", ... }
    phase2_resolves_json TEXT NOT NULL,    -- { "2": { "home_status": "solved_correctly", "cause": "careless", "notes": "" } }
    metrics_summary_json TEXT,             -- Cached subject & typology aggregates
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, exam_id)
);
```

### 3.3. Phase 1 & Phase 2 Interaction & Grading Clarifications (Builder Decisions)
- **Phase 1 Input Modes (Zero-Friction Dual Input):**
  - **Outcome-First (Default High-Speed Mode):** Quick keys `1` (صحیح), `2` (غلط), `3` (نزده) allow entering 90 questions in under 90 seconds.
  - **Option-Based Mode (Optional Toggle):** Students who prefer entering raw bubble choices (`1`, `2`, `3`, `4`) can toggle "ثبت با شماره گزینه" where the engine auto-grades against `correct_opt`.
- **Phase 2 Home Re-solve Verification:**
  - Card view displays the question metadata (Subject, Topic, Difficulty, Type, Page in Booklet).
  - Student selects their home resolution:
    - **«در خانه حل شد 🎯»** (or picks option 1..4 which reveals instant green match)
    - **«نیاز به بررسی / بلد نیستم 🔍»** (reveals official explanation and key)
  - 1-Tap Cause Tagging: Primary cause tag (علمی، یادگیری ناقص، بی‌دقتی، زمان/استرس، تله طراح) + optional notes.
- **Scoring Formulas:**
  - **Actual Score (درصد شرایط آزمون):**
    $$\text{Actual} = \frac{3 \times C_{\text{exam}} - W_{\text{exam}}}{3 \times T} \times 100$$
  - **Potential Score (درصد با آرامش خانه):**
    $$\text{Potential} = \frac{3 \times (C_{\text{exam}} + S_{\text{home}}) - W_{\text{remaining}}}{3 \times T} \times 100$$
  - **Anxiety/Pacing Tax (مالیات اضطراب و زمان):**
    $$\text{Tax} = \text{Potential} - \text{Actual}$$
- **Question Content Presentation:**
  - Fast, responsive cards rendering Subject, Chapter, Topic taxonomy, Question Type, Difficulty, and Booklet Page number.
  - Full official solution and key explanations stored in DB and displayed on-demand.

---

## 4. User Journey & Interaction Flow

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Exam Catalog │──────►│ 2. Rapid Keypad │──────►│ 3. Home Re-solve│──────►│ 4. Prescription │
│ Select Exam     │       │ Under 90 sec    │       │ Calm second pass│       │ Action plan &   │
│ 17 Mehr Maze    │       │ 1 / 2 / 3 Hotkey│       │ 1-tap cause tag │       │ Twin score card │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Phase 1: Rapid 90-Second Input (ثبت سرعتی نتیجه آزمون)
- **Grid & Status:** A 90-item visual grid categorized into the 4 subjects:
  - زیست‌شناسی: Q1–30 (30 questions)
  - ریاضی: Q31–50 (20 questions)
  - فیزیک: Q51–70 (20 questions)
  - شیمی: Q71–90 (20 questions)
- **Keyboard Hotkeys (Desktop):**
  - Press `1` or `D` (درست) -> Sets question as Correct (Green) and immediately advances to next question.
  - Press `2` or `G` (غلط) -> Sets question as Wrong (Soft Coral) and auto-advances.
  - Press `3` or `N` (نزده) -> Sets question as Blank (Slate Gray) and auto-advances.
  - Arrow keys (`Left` / `Right`) or `Backspace` to navigate back and edit any item.
- **Mobile Touch Keypad:**
  - 3 large, haptic-friendly buttons pinned to the ergonomic bottom thumb-zone.
  - Live indicator: "سوال ۲۴ از ۹۰ (زیست‌شناسی)".
- **Emergency Button:**
  - "علامت‌گذاری باقی‌مانده به عنوان نزده" (Mark Remaining as Blank) for students who ran out of time on later subjects.
- **Standard Scoring Formula:**
  $$\text{Score} \% = \frac{3 \times \text{Correct} - \text{Wrong}}{3 \times \text{Total}} \times 100$$

### Phase 2: Home Re-solve (حل مجدد در خانه / فرصت دوم در آرامش)
- Isolates ONLY questions marked as **غلط** or **نزده**.
- The student re-attempts each question in a calm, distraction-free card view.
- Per question outcome buttons:
  - **«در خانه حل شد 🎯»** -> Reclaims question value into Potential Score.
  - **«هنوز بلد نیستم / نیاز به بررسی 🔍»** -> Remains a Conceptual Void (شکاف علمی).
- 1-Tap Cause Tagging (5 Cognitive Buckets):
  1. 🧠 **ندانسته علمی (Hard Conceptual Void)**
  2. ⚡ **یادگیری ناقص / شک بین دو گزینه (Unconsolidated)**
  3. 🧮 **بی‌دقتی محاسباتی / خطای دیداری (Arithmetic/Careless Slip)**
  4. ⏳ **کمبود وقت / استرس و مدیریت دفترچه (Pacing/Anxiety)**
  5. 🪤 **تله طراح (Cognitive Trap)**
- Optional short voice/text memo note for personal review.

### Phase 3: Clinical Diagnostic Dashboard & Action Plan (داشبورد بالینی و نسخه تجویزی)
- **Twin Score Card (دوگانه کارنامه):**
  - **درصد سر جلسه (Actual):** e.g. 34.2%
  - **درصد بالقوه در خانه (Potential):** e.g. 68.5%
  - **مالیات اضطراب و زمان (Anxiety/Pacing Tax):** +34.3% (نشان‌دهنده پتانسیل کشف‌شده).
- **Typology Breakdown (تفکیک تیپ سوالات):**
  - Bar/progress charts for: مفهومی (Conceptual), محاسباتی (Algorithmic), حفظی/خط‌به‌خط (Recall), ترکیبی (Integrative).
- **Subject & Topic Heatmap:**
  - Color-coded mastery badges for each chapter and subtopic.
- **Prescriptive 2-Week Action Plan (نسخه تجویزی ۲ هفته‌ای):**
  - **Top 3 Quick Wins:** Immediate targets with highest ROI (e.g. فیزیک: تبدیل زنجیره‌ای واحدها، شیمی: جرم اتمی میانگین).
  - **Study Budget:** Estimated hours needed to close the gaps (e.g. ۴ ساعت در هفته).
  - **Mistake Review Sheet (لیست سوالات نیازمند بازخوانی):** Filterable list of all missed questions with detailed explanations from the official Maze booklet.

---

## 5. UI/UX Design & Top Navigation Integration

- **Theme & Aesthetic:** Follows modern liquid-glass (`ui-ux-pro-max`), fluid chromatic background aura, backdrop-blur-2xl, and crisp typography.
- **Top Bar Integration:**
  - Update `CourseBoxTopBar.tsx` center capsule switcher to include 3 core hubs:
    1. **دوره‌ها (Courses)**
    2. **RoutineHub (روتین‌ها)**
    3. **تحلیل آزمون (TahlilHub)**
- **Responsive Layout:**
  - Desktop: Full side-by-side or multi-column layout with quick keypad legend.
  - Mobile: Full height single-column flow with fixed bottom controls.

---

## 6. Seed Dataset: آزمون ۱۷ مهر دهم تجربی ماز

The seed dataset is extracted from `pdfs/10T-17Mehr-A.pdf`:
- **Exam ID:** `maze-10t-14030717`
- **Provider:** ماز (Biomaze)
- **Grade:** دهم تجربی (10th Experimental Sciences)
- **Date:** ۱۷ مهر ۱۴۰۳
- **Total Questions:** 90
- **Sections:**
  1. زیست‌شناسی: Q1 to Q30 (فصل ۱: دنیای زنده — ساختار یاخته، مولکول‌های زیستی، بافت‌ها)
  2. ریاضی: Q31 to Q50 (فصل ۱: الگو، دنباله، مجموعه‌ها و بازه‌ها)
  3. فیزیک: Q51 to Q70 (فصل ۱: فیزیک و اندازه‌گیری — چگالی، تبدیل یکاها، دقت اندازه‌گیری)
  4. شیمی: Q71 to Q90 (فصل ۱: کیهان زادگاه الفبای هستی — اتم، ایزوتوپ‌ها، جرم اتمی میانگین)
- **Official Answer Key (All 90 Questions):**
  - Q1–10: `[3, 3, 1, 4, 2, 4, 3, 3, 3, 3]`
  - Q11–20: `[3, 1, 4, 4, 4, 4, 2, 2, 2, 2]`
  - Q21–30: `[2, 4, 4, 4, 4, 4, 3, 1, 4, 2]`
  - Q31–40: `[2, 2, 4, 3, 1, 3, 2, 4, 4, 3]`
  - Q41–50: `[1, 2, 2, 1, 2, 3, 4, 3, 1, 1]`
  - Q51–60: `[4, 3, 4, 4, 3, 1, 2, 1, 1, 1]`
  - Q61–70: `[3, 3, 2, 4, 4, 4, 2, 1, 3, 2]`
  - Q71–80: `[4, 4, 3, 4, 3, 2, 2, 3, 4, 4]`
  - Q81–90: `[4, 2, 4, 4, 3, 1, 3, 1, 2, 1]`

---

## 7. Backend API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/exams` | Returns catalog of available exams. |
| `GET` | `/api/exams/{id}` | Returns exam metadata, section summary, and question list. |
| `GET` | `/api/exams/{id}/analysis` | Gets current user's analysis session for this exam. |
| `POST` | `/api/exams/{id}/analysis/phase1` | Submits Phase 1 rapid answers (`{ "1": "correct", ... }`). |
| `POST` | `/api/exams/{id}/analysis/phase2` | Submits Phase 2 home re-solve and cause tags. |
| `GET` | `/api/exams/{id}/analysis/report` | Returns full clinical diagnostic report, twin scores, and prescription. |
| `POST` | `/api/exams/{id}/analysis/reset` | Resets analysis for clean retries. |

---

## 8. What's Left to the Builder
- Visual micro-animations (e.g., golden particle confetti on home resolution, smooth progress bars).
- Seed script implementation that parses the PDF and populates `exams.db`.
- Hotkey handling cross-browser compatibility (handling both Persian and English keyboard layouts seamlessly).
