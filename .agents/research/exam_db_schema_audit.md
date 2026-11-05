# Audit Report: Mediqz Exam Analysis Ingestion Engine & Database Schema
**Date:** November 5, 2026  
**Auditor:** Elite R&D Worker Agent  
**Target Repository:** `/Users/amiralirakhshani/Projects/Alqualite CourseBox`  
**External Inspected Path:** `/Users/amiralirakhshani/Projects/R&D Mediaz/`  
**Reference Databases:** `backend/assets/exams.db`, `backend/assets/userdata.db`, `Question Selector/qnbank.db`  

---

## 1. Executive Summary

This audit establishes the concrete data schemas, taxonomy mapping conventions, behavioral workflows, and pedagogical logic required to ingest standard Konkur mock exams into Mediqz. Specifically, we audited the existing production exam database (`exams.db`), the user analysis tracking schema (`userdata.db`), the legacy vs. modern seed scripts (`seed_17mehr_maze_exam.py` vs. `seed_m10t_pure.py`), and the source materials located in `/Users/amiralirakhshani/Projects/R&D Mediaz/`.

### Key Findings:
1. **Schema Standardization:** The modern production schema uses the `exams` and `exam_questions` tables in `backend/assets/exams.db`, coupled with `student_exam_analyses` in `backend/assets/userdata.db`. Legacy column names (`q_type`, `topic`, `subtopic`) have been migrated to standardized identifiers (`question_type`, `topic_id`, `utid`, `time_taking_profile`).
2. **Pedagogical Alignment:** The theoretical foundation of Mediqz's two-phase analysis is derived directly from Dr. Khalili's framework in `Tahlil Azmoon.pdf`. The app operationalizes "Tactical vs. Technical Analysis" via rapid keypad entry (Phase 1) and deep post-exam root-cause journaling (Phase 2), calculating the student's *Anxiety Tax* ($\Delta\% = \text{Potential Score} - \text{Exam Score}$).
3. **Audit of `دوئل مدیاز - دوازدهم تجربی - ۲۲ آبان ۱۴۰۵.pdf`:** This is an authentic 32-page, 140-question national Konkur simulation booklet (Grade 12 Experimental Sciences) divided across 3 official booklets (Biology, Physics + Chemistry, Mathematics).
4. **Answer Key Status:** **NO answer key or explanatory solution file exists** inside the PDF or anywhere within `/Users/amiralirakhshani/Projects/R&D Mediaz/`. Ingestion into the database will require either external key assignment or key generation by subject matter specialists.

---

## 2. Database Architecture & Table Schemas

Mediqz splits its data across two SQLite WAL databases:
- `backend/assets/exams.db` (and runtime target `DATA_DIR / "exams.db"`): Stores static exam booklets, metadata, and questions.
- `backend/assets/userdata.db` (and runtime target `DATA_DIR / "userdata.db"`): Stores user sessions, Leitner progress, course logs, and individual exam analysis sessions (`student_exam_analyses`).

### 2.1 Table: `exams` (`backend/assets/exams.db`)
Stores top-level exam metadata and subject partition definitions.

| Column | Type | Nullable | Default | Description & Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `TEXT` | No | None | **PRIMARY KEY**. Standard alphanumeric test identifier (e.g. `'M10T-405Mehr17'`). |
| `title` | `TEXT` | No | None | Full Persian presentation title (e.g. `'آزمون ۱۷ مهر دهم تجربی ماز'`). |
| `provider` | `TEXT` | No | None | Exam publishing body: `'ماز'`, `'مدیاز'`, `'قلم‌چی'`, `'گزینه‌دو'`. |
| `grade` | `TEXT` | No | None | High school grade as string: `'10'`, `'11'`, `'12'`. |
| `major` | `TEXT` | No | None | Academic field: `'تجربی'`, `'ریاضی'`, `'انسانی'`. |
| `held_date` | `TEXT` | No | None | Shamsi or Gregorian date string: `'1403-07-17'` or `'1405-08-22'`. |
| `total_questions`| `INTEGER` | No | None | Total number of questions: `90` (Grade 10/11) or `140` (Grade 12). |
| `sections_json` | `TEXT` | No | None | JSON array of `ExamSection` objects defining subject splits. |

#### Sample Row (`exams`):
```json
{
  "id": "M10T-405Mehr17",
  "title": "آزمون ۱۷ مهر دهم تجربی ماز",
  "provider": "ماز",
  "grade": "10",
  "major": "تجربی",
  "held_date": "1403-07-17",
  "total_questions": 90,
  "sections_json": "[{\"subject\": \"زیست‌شناسی\", \"start_q\": 1, \"end_q\": 30, \"total_questions\": 30, \"prefix\": \"B\"}, {\"subject\": \"ریاضی\", \"start_q\": 31, \"end_q\": 50, \"total_questions\": 20, \"prefix\": \"M\"}, {\"subject\": \"فیزیک\", \"start_q\": 51, \"end_q\": 70, \"total_questions\": 20, \"prefix\": \"P\"}, {\"subject\": \"شیمی\", \"start_q\": 71, \"end_q\": 90, \"total_questions\": 20, \"prefix\": \"C\"}]"
}
```

---

### 2.2 Table: `exam_questions` (`backend/assets/exams.db`)
Stores individual questions, pedagogical classifications, options, and keys.

| Column | Type | Nullable | Default | Description & Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INTEGER` | Yes | None | **PRIMARY KEY AUTOINCREMENT**. |
| `utid` | `TEXT` | No | None | **UNIQUE NOT NULL**. Unique Test Item ID: `{exam_id}-{prefix}{q_num}`. |
| `exam_id` | `TEXT` | No | None | Foreign Key referencing `exams(id)`. |
| `q_num` | `INTEGER` | No | None | Question sequential number in exam booklet (1 to $N$). |
| `subject` | `TEXT` | No | None | Persian subject name: `'زیست‌شناسی'`, `'ریاضی'`, `'فیزیک'`, `'شیمی'`. |
| `correct_opt` | `INTEGER` | No | None | Designer correct answer: `1`, `2`, `3`, or `4`. |
| `topic_id` | `TEXT` | No | None | Taxonomy code referencing `backend/assets/topics.txt` (e.g. `'B10C1S1'`). |
| `time_taking_profile`| `TEXT` | No | None | Time expectation: `'Fast'`, `'Standard'`, `'Long af'`. |
| `question_type` | `TEXT` | No | None | Pedagogical type: `'Mafhoomi'`, `'Mohasebati'`, `'Tarkibi'`, `'Nokat Shekl'`, `'Hefzi'`, `'Nemoodari'`. |
| `difficulty` | `TEXT` | No | None | Difficulty level (Persian): `'آسان'`, `'متوسط'`, `'دشوار'`. |
| `question_text` | `TEXT` | Yes | `''` | Question statement or OCR transcription. |
| `options_json` | `TEXT` | Yes | `'[]'` | JSON array of 4 strings representing option choices. |
| `page_number` | `INTEGER` | Yes | `0` | Booklet page number containing the question. |
| `explanation_summary`| `TEXT` | Yes | `''` | Concise pedagogical solution note or key explanation. |

#### Composite Constraints:
- `UNIQUE(exam_id, q_num)`
- `UNIQUE(utid)`

#### Sample Row (`exam_questions`):
```json
{
  "id": 1,
  "utid": "M10T-405Mehr17-B1",
  "exam_id": "M10T-405Mehr17",
  "q_num": 1,
  "subject": "زیست‌شناسی",
  "correct_opt": 3,
  "topic_id": "B10C1S1",
  "time_taking_profile": "Fast",
  "question_type": "Mafhoomi",
  "difficulty": "آسان",
  "question_text": "سوال شماره 1 آزمون ۱۷ مهر دهم تجربی ماز (زیست‌شناسی) - مبحث: ویژگی‌های هفت‌گانه حیات جانداران",
  "options_json": "[\"گزینه ۱ سوال 1\", \"گزینه ۲ سوال 1\", \"گزینه ۳ سوال 1\", \"گزینه ۴ سوال 1\"]",
  "page_number": 1,
  "explanation_summary": "پاسخ تشریحی آزمون ماز: گزینه 3 صحیح است. این سوال با تیپ Mafhoomi، سختی آسان و پروفایل زمانی Fast طبقه‌بندی شده است."
}
```

---

### 2.3 Table: `student_exam_analyses` (`backend/assets/userdata.db`)
Tracks the student's live analysis state, rapid keypad responses, and detailed journaling.

| Column | Type | Nullable | Default | Description & Constraints |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INTEGER` | Yes | None | **PRIMARY KEY AUTOINCREMENT**. |
| `user_id` | `INTEGER` | No | None | Foreign Key referencing `users(id)`. |
| `exam_id` | `TEXT` | No | None | Target exam ID. |
| `status` | `TEXT` | No | `'phase1'` | Workflow status: `'not_started'`, `'phase1'`/`'keypad'`, `'journaling'`/`'phase2'`, `'completed'`. |
| `exam_score_pct` | `REAL` | Yes | `0.0` | In-exam percentage with standard Konkur penalty: $\frac{3C - W}{3T} \times 100$. |
| `potential_score_pct`| `REAL` | Yes | `0.0` | Potential score assuming outside-exam correct solutions were scored. |
| `anxiety_tax_pct` | `REAL` | Yes | `0.0` | Calculated difference: $\max(0.0, \text{potential\_score\_pct} - \text{exam\_score\_pct})$. |
| `phase1_answers_json`| `TEXT` | No | `'{}'` | Normalized dictionary of rapid keypad answers. |
| `phase2_resolves_json`| `TEXT` | No | `'{}'` | Normalized dictionary of question journal reflections. |
| `metrics_summary_json`| `TEXT` | Yes | `'{}'` | Cached metrics summary snapshot. |
| `created_at` | `TEXT` | No | None | ISO 8601 creation timestamp. |
| `updated_at` | `TEXT` | No | None | ISO 8601 modification timestamp. |
| `completed_at` | `TEXT` | Yes | None | ISO 8601 final completion timestamp. |

#### Composite Constraint:
- `UNIQUE(user_id, exam_id)`

#### JSON Structures:
1. **`phase1_answers_json`**:
```json
{
  "1": { "option": 3, "status": "correct" },
  "2": { "option": 1, "status": "wrong" },
  "3": { "option": null, "status": "blank" }
}
```

2. **`phase2_resolves_json`**:
```json
{
  "1": {
    "solve_faster_note": "می‌توانستم با رد گزینه ۲ و ۴ در کمتر از ۲۰ ثانیه حل کنم.",
    "personal_journal": "تسلط بر متن شکل صفحه ۳ کتاب کافی بود."
  },
  "2": {
    "outside_status": "solved_correctly_no_time",
    "error_reason": "بی‌دقتی",
    "subchapter_bug_note": "در صورت سوال کلمه «به‌جز» را ندیدم.",
    "solve_faster_note": "",
    "personal_journal": ""
  },
  "3": {
    "outside_status": "needed_answer_sheet",
    "error_reason": "ضعف علمی",
    "subchapter_bug_note": "فرمول انحلال‌پذیری گازها در دمای متغیر فراموش شده بود.",
    "solve_faster_note": "",
    "personal_journal": "نیاز به مرور درسنامه فصل ۱ شیمی"
  }
}
```

---

## 3. Data Dictionaries & Enum Definitions

Strict enum mappings enforced across backend endpoints (`backend/app/api/exams.py`), models (`backend/app/models/exam.py`), and TypeScript types (`frontend/src/types/tahlil.ts`):

### 3.1 Question Types (`question_type`)
| DB Code | Persian Label | Definition & Pedagogical Purpose |
| :--- | :--- | :--- |
| `Mafhoomi` | مفهومی | Conceptual reasoning without extensive computation. |
| `Mohasebati` | محاسباتی | Calculation-heavy, multi-step algebra/arithmetic. |
| `Tarkibi` | ترکیبی | Cross-chapter or cross-grade synthesis questions. |
| `Nokat Shekl`| نکات شکل | Diagram, anatomy, or graph-specific visual questions. |
| `Hefzi` | حفظی | Direct textbook recall, definitions, or verbatim facts. |
| `Nemoodari` | نموداری | Graph interpretation, kinematic plots, or rate curves. |

### 3.2 Time-Taking Profiles (`time_taking_profile`)
| DB Code | Persian Label | Nominal Budget | Pedagogical Criteria |
| :--- | :--- | :--- | :--- |
| `Fast` | سریع | $\le 45\text{ s}$ | High-speed recall, binary fact verification. |
| `Standard` | استاندارد | $45\text{ s} - 90\text{ s}$ | Standard Konkur single-step problem. |
| `Long af` | وقت‌گیر | $> 90\text{ s}$ | Multi-case combinations, intensive stoichiometric calculations. |

### 3.3 Difficulty Levels (`difficulty`)
Stored as pure Persian strings:
- `'آسان'` (Easy: Direct application of formulas/definitions)
- `'متوسط'` (Medium: Standard test item requiring 2 logical steps)
- `'دشوار'` (Hard: Trap-heavy, non-trivial synthesis or high time investment)

### 3.4 In-Exam Answer Status (`status` in Phase 1)
- `'correct'`: Student marked the designer's key.
- `'wrong'`: Student marked a wrong option (triggers $-\frac{1}{3}$ Konkur penalty).
- `'blank'`: Question skipped / no option marked (0 score change).

### 3.5 Outside-Exam Status (`outside_status` in Phase 2)
*(Rule: Never use colloquial labels like "حل در خانه")*
- `'solved_correctly_no_time'`: Solved correctly when given unlimited time outside exam conditions. Recovers potential score.
- `'needed_answer_sheet'`: Required looking at the official solution to solve.
- `'unsolved'`: Student could not solve the question even with unlimited time.

### 3.6 Error Reasons (`error_reason` in Phase 2)
The 5 validated root causes of Konkur errors:
1. `'بی‌دقتی'` (Carelessness / Calculation slip / Misreading)
2. `'دام آموزشی'` (Designer educational trap / Distractor trap)
3. `'کمبود زمان'` (Time deficit / Poor pacing)
4. `'ضعف علمی'` (Academic weakness / Concept not understood)
5. `'استرس'` (Cognitive panic / Blanking out)

### 3.7 Unique Test Item ID (`utid`) Convention
Format: `{exam_id}-{prefix}{q_num}`
- Prefixes:
  - `B`: Biology (زیست‌شناسی)
  - `M`: Mathematics (ریاضی)
  - `P`: Physics (فیزیک)
  - `C`: Chemistry (شیمی)
- Examples:
  - `M10T-405Mehr17-B1` (Maze 10th Tajrobi, Mehr 17, Biology Q1)
  - `MD12T-405Aba22-P46` (Duel Mediqz 12th Tajrobi, Aban 22, Physics Q46)

---

## 4. Taxonomy & Topic Hierarchy (`topics.txt`)

`backend/assets/topics.txt` contains 864 standardized topic IDs covering all 3 high school grades.

### Code Syntax:
`{Subject}{Grade}C{Chapter}S{Section}`
- `Subject`: `B` (Biology), `M` (Math), `P` (Physics), `C` (Chemistry)
- `Grade`: `10`, `11`, `12`
- `C{n}`: Chapter index (1 to $K$)
- `S{n}`: Section / Subtopic index (1 to $M$)

#### Sample Grade 12 Entries Relevant to Duel Mediqz:
- `B12C1S1`: نوکلئیک‌اسیدها، ساختار DNA و کشف ماده ژنتیک
- `B12C1S2`: همانندسازی DNA و آنزیم‌های دخیل
- `B12C2S1`: رونویسی و انواع RNA
- `P12C1S1`: شناخت حرکت، مسافت و جابه‌جایی
- `P12C1S2`: سرعت و تندی متوسط و لحظه‌ای
- `C12C1S1`: پاک‌کننده‌ها و صابون‌ها
- `C12C1S2`: اسیدها و بازها و تعادل‌های یونی
- `M12C1S1`: توابع چندجمله‌ای، صعودی و نزولی
- `M12C1S2`: ترکیب توابع و تابع وارون

---

## 5. Inspection of `/Users/amiralirakhshani/Projects/R&D Mediaz/`

### 5.1 Analysis of `Tahlil Azmoon.pdf`
- **Metadata:** 24 pages, 1.6 MB, authored by Dr. Khalili.
- **Pedagogical Purpose:** Instructor training and methodology deck outlining the exact psychological and cognitive structure of Konkur exam analysis.
- **Key Frameworks Identified:**
  1. **Mental Reframing:** Moving students from judgment ("آزمون انعکاس نتیجه کنکور است") to iterative feedback ("آزمون چک‌آپ مسیر است").
  2. **Two-Tier Analysis Architecture:**
     - **تحلیل تاکتیکی (سطح ماژور / سطح کل آزمون):** Evaluates macro behavior across the 3-hour sitting: strategy failure, anxiety bias, process errors, speed bottlenecks, and emotional stamina.
     - **تحلیل تکنیکی (سطح مینور / سطح تک‌سوال):** The two-pencil technique ("آزمون دو مداده"), question-by-question dissection of missed items, time audit per question type, and designer perspective evaluation.
  3. **Direct Legacy in Mediqz:** The 5 error categories (`بی‌دقتی`, `دام آموزشی`, `کمبود زمان`, `ضعف علمی`, `استرس`) and the two-pencil status breakdown in `backend/app/api/exams.py` are direct implementations of Dr. Khalili's framework.

---

### 5.2 Analysis of `دوئل مدیاز - دوازدهم تجربی - ۲۲ آبان ۱۴۰۵.pdf`
- **Metadata:** 32 pages, 2.3 MB, created November 3, 2026.
- **Test Identity:** آزمون‌های شبیه‌ساز کنکور سراسری (دوئل) • پایه دوازدهم تجربی • ۲۲ آبان ۱۴۰۵.
- **Structure:** Exactly 140 questions matching official Sanjesh booklet partitions:

| Booklet | Subject | Question Range | Question Count | Time Allocation | Booklet Page Span |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **دفترچه ۱** | زیست‌شناسی | 1 – 45 | 45 | 45 دقیقه | Pages 1 – 10 |
| **دفترچه ۲** | فیزیک | 46 – 75 | 30 | 40 دقیقه | Pages 11 – 18 |
| **دفترچه ۲** | شیمی | 76 – 110 | 35 | 35 دقیقه | Pages 19 – 26 |
| **دفترچه ۳** | ریاضی | 111 – 140 | 30 | 50 دقیقه | Pages 27 – 32 |
| **کل آزمون** | **۴ درس اختصاصی** | **1 – 140** | **140** | **170 دقیقه** | **32 صفحه کامل** |

- **Answer Key Audit:**
  - Page 32 ends directly at Question 140:
    $$\text{۱۴۰- اگر حاصل‌ضرب بیشترین و کمترین مقدار تابع...}$$
  - No answer key table (کلید پاسخنامه) exists anywhere in the PDF.
  - No separate answer key file exists in `/Users/amiralirakhshani/Projects/R&D Mediaz/`.
  - No corresponding TestID exists in Question Selector's `qnbank.db`.
  - **Verdict:** The exam question booklet is complete and publication-ready, but the answer key is pending external supply.

---

## 6. Asset & Figure Management

### Current Patterns:
1. **Mediqz CourseBox:**
   - Static files are served via FastAPI: `app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")`.
   - `exam_questions` stores text, JSON option arrays, and explanation summaries, but does not currently store image file paths in dedicated columns.
2. **Question Selector (`qnbank.db`):**
   - Questions are stored as high-resolution (300 DPI) cropped lossless PNG images directly inside SQLite columns `QuestionImage` (BLOB) and `AnswerImage` (BLOB).
3. **Recommended Figure Ingestion Strategy for Mediqz:**
   - To support visual questions (such as Biology anatomy diagrams, Physics circuit figures, and Math function graphs in Duel Mediqz), question diagram crops should be placed in `backend/assets/figures/exams/{exam_id}/q_{q_num}.png`.
   - The frontend can reference them via standard static path: `/assets/figures/exams/{exam_id}/q_{q_num}.png` or an optional `figure_url` column added to `exam_questions`.

---

## 7. Migration & Seeding Pipeline Evolution

A critical insight from comparing `scripts/seed_17mehr_maze_exam.py` with `scripts/seed_m10t_pure.py`:
- **Legacy Seeder (`seed_17mehr_maze_exam.py`):** Used non-standard column names `q_type`, `topic`, `subtopic`.
- **Modern Pure Seeder (`seed_m10t_pure.py`):** Adheres 100% to the production database schema:
  - Generates deterministic `utid` (`{exam_id}-{prefix}{q_num}`).
  - Maps to taxonomy codes in `topics.txt` (`topic_id`).
  - Sets standardized enums for `time_taking_profile` (`Fast`, `Standard`, `Long af`), `question_type` (`Mafhoomi`, `Mohasebati`, etc.), and `difficulty` (`آسان`, `متوسط`, `دشوار`).
  - Populates `sections_json` with start/end indices and subject prefixes.

---

## 8. Prescribed Ingestion Strategy for Duel Mediqz

When ingesting `دوئل مدیاز - دوازدهم تجربی - ۲۲ آبان ۱۴۰۵`:
1. **Exam Identifier:** `MD12T-405Aba22`
2. **Title:** `دوئل مدیاز - دوازدهم تجربی - ۲۲ آبان ۱۴۰۵`
3. **Provider:** `مدیاز`
4. **Grade:** `'12'`, **Major:** `'تجربی'`, **Held Date:** `'1405-08-22'`, **Total Questions:** `140`
5. **Section Schema:**
   ```json
   [
     {"subject": "زیست‌شناسی", "start_q": 1, "end_q": 45, "total_questions": 45, "prefix": "B"},
     {"subject": "فیزیک", "start_q": 46, "end_q": 75, "total_questions": 30, "prefix": "P"},
     {"subject": "شیمی", "start_q": 76, "end_q": 110, "total_questions": 35, "prefix": "C"},
     {"subject": "ریاضی", "start_q": 111, "end_q": 140, "total_questions": 30, "prefix": "M"}
   ]
   ```
6. **Key Assignment:**
   - Ingest all 140 questions with `correct_opt` initialized to placeholder `1` (or null if schema permits) until official keys are supplied.
   - Tag all 140 questions with appropriate Grade 12 topic codes from `backend/assets/topics.txt`.
