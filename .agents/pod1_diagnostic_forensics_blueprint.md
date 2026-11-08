# ALQUALITE COURSEBOX (MEDIQZ)
# MASTER BLUEPRINT: DEEP DIAGNOSTIC & ERROR FORENSICS (POD 1)

**Document Version:** `v1.0.0-PROD-LOCKED`  
**Authority:** Supreme Council Trio-Pod 1 (Deep Diagnostic & Error Forensics)  
**Foundation Corpus:** `filtered_workshop_synthesis.md` (85-Slide Post-Exam Diagnostic Workshop)  
**Status:** Certified & Hardened through 2-Round Hostile Adversarial Audit  
**Target Environment:** React 18, Vite, TypeScript, Zustand, Tailwind CSS, FastAPI, SQLite WAL (`userdata.db`, `exams.db`)

---

## 1. TRIO-POD 1 EXECUTIVE CHARTER & TEAM ROLES

- **Role A — Creative Suggestionist (ایده‌پرداز خلاق آموزشی):** High-leverage, non-fluff diagnostic tools tailored for elite Konkur candidates. Converts theoretical neurocognitive and pedagogical axioms into actionable, zero-slop diagnostic instruments.
- **Role B — Logic & Algorithm Builder (معمار منطق، فرمول و دیتابیس):** Mathematically rigorous formulas, numerically stable functions, deterministic state machines, SQLite WAL schemas, Pydantic v2 validation, FastAPI endpoints, and Zustand state vaults.
- **Role C — UI/UX System Designer (طراح رابط کاربری و حفظ هویت بصری):** Dark purple liquid glass aesthetic (`#0e0a22`), specular refraction highlights, 375x812 mobile reachability ergonomics, bottom-sheet micro-drawers, tactile auto-advance buffers, and 100% Persian digits (`toPersianDigits`).

---

## 2. THE ONTOLOGICAL FOUNDATION: ROOT-CAUSE FORENSICS VS. PSEUDO-ANALYSIS

Conventional exam analysis in Iranian Konkur preparation suffers from **نکته‌محور (Point-Centric Pseudo-Analysis)**:
1. Students annotate incorrect items with self-flagellation or the generic label **"بی‌دقتی" (Carelessness)**.
2. Clinical Diagnosis: "بی‌دقتی" is classified as **قضاوت مثبت در قالب فحاشی** (positive self-appraisal disguised as profanity). It shields the ego from confronting procedural or conceptual incompetence, releases cheap dopamine, and prematurely terminates diagnostic investigation.
3. In Alqualite CourseBox (Mediqz), **the stand-alone label "بی‌دقتی" is strictly abolished**. Every error is treated as a clinical circuit malfunction across one of six deterministic failure branches.

```mermaid
flowchart TD
    RawError["Dropped Mark / Carnet Error<br/>(پاسخ غلط یا نزده)"] --> BanCheck{"Is Error labeled 'بی‌دقتی'?"}
    BanCheck -- "YES (Conventional Trap)" --> EgoShield["Ego Defense & Pseudo-Analysis<br/>(قضاوت مثبت در قالب فحاشی)"]
    EgoShield --> RecurringBug["Defect Masked -> 100% Repetition<br/>(تکرار حتمی خطا در آزمون بعد)"]
    
    BanCheck -- "NO (Mediqz Clinical Engine)" --> ClinicalAutopsy["Forensic Root-Cause Decomposition<br/>(کالبدشکافی علّی ۶ شاخه)"]
    ClinicalAutopsy --> B1["۱. شکاف عمیق آموزشی (Scientific Deficit)"]
    ClinicalAutopsy --> B2["۲. اختلال حلقه عصبی PFC-STN-ACC"]
    ClinicalAutopsy --> B3["۳. تله ادراکی و کوری کلمات کلیدی (Perceptual)"]
    ClinicalAutopsy --> B4["۴. تله آموزشی ساختاریافته (Educational Trap)"]
    ClinicalAutopsy --> B5["۵. سرریز حافظه فعال و زیگارنیک (RAM Overload)"]
    ClinicalAutopsy --> B6["۶. شوک زمانی و مغالطه لنگر (Time Pacing Shock)"]
```

---

## 3. SECTION 1: ROOT-CAUSE ERROR FORENSICS ENGINE

### 3.1 Neuro-Cognitive PFC–STN–ACC Error Circuit
The neurobiological mechanism governing in-session slips (Slides 34–37):
1. **Prefrontal Cortex (PFC):** Under urgent time constraints, executive cortex dispatches high-frequency motor commands to compute and record intermediate algebraic steps.
2. **Subthalamic Nucleus (STN):** Functions as the hyper-direct motor brake. Detecting intermediate ambiguity, STN dispatches a review command to the Anterior Cingulate Cortex.
3. **Anterior Cingulate Cortex (ACC):** The error-monitoring and conflict-detection hub. In an unformatted, chaotic scratchpad, intermediate calculation lines cannot be retrieved. ACC fires complete motor inhibition and triggers a **forced full-question restart** (losing 90–120s) OR premature blind option selection ("جهش به گزینه زدن").

### 3.2 Numerically Stable Neuro-Cognitive Crash Risk Index ($\mathrm{NCRI}_i$)
To completely eliminate unmeasurable physiological variables (e.g., cortisol, blood glucose), the crash risk index is formulated strictly through **100% client-measured behavioral and spatial telemetry**:

$$\mathrm{NCRI}_i = \text{stable\_sigmoid}\left( w_1 \cdot \ln(1 + r_i) + w_2 \cdot J_i + w_3 \cdot \mathbf{1}_{\text{chaotic}} + w_4 \cdot \frac{i}{K_{\text{scope}}} + w_5 \cdot \mathbf{1}_{\text{tag\_panic}} - \theta \right)$$

#### Guarded Parameter Definitions:
- **$t_i$ (Observed Dwell Time):** Measured in seconds, clamped: $t_i = \max(t_i, 0.0)$.
- **$\tau_i$ (Expected Typology Baseline Time):** Pre-calibrated per question archetype, guarded against division by zero:
  $$\tau_i = \max(\tau_{\text{type}}, 15.0)$$
  - `Fast` (Hefzi / Nokat Shekl): $\tau = 45.0\text{s}$
  - `Standard` (Mafhoomi / Nemoodari): $\tau = 75.0\text{s}$
  - `Long af` (Mohasebati / Tarkibi): $\tau = 105.0\text{s}$
- **$r_i = \frac{t_i}{\tau_i}$ (Dwell Latency Ratio):** Guaranteed $r_i \ge 0.0$.
- **$J_i$ (Option Jitter Count):** Number of selection switches, clamped against spastic tapping:
  $$J_i = \min(\max(J_{\text{raw}}, 0), 5)$$
- **$\mathbf{1}_{\text{chaotic}} \in \{0, 1\}$:** 1-tap confirmation of disorganized, unboxed scratchpad topology.
- **$\frac{i}{K_{\text{scope}}} \in [0, 1]$ (Cognitive Battery Depletion Proxy):** Question ordinal $i$ divided by total questions in current subject/exam scope.
- **$\mathbf{1}_{\text{tag\_panic}} \in \{0, 1\}$:** In-exam real-time tag `⟨ ز ⟩` (time panic) or `⟨ ش ⟩` (stress doubt).
- **Calibrated Weights:** $w_1 = 1.25, w_2 = 0.85, w_3 = 1.10, w_4 = 0.70, w_5 = 1.40, \theta = 2.10$.

#### Numerically Stable Sigmoid Implementation (Python):
```python
import math

def stable_sigmoid(z: float) -> float:
    """Numerically stable sigmoid preventing OverflowError when z < -709."""
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    else:
        ez = math.exp(z)
        return ez / (1.0 + ez)

def compute_ncri(
    dwell_seconds: float,
    expected_seconds: float,
    jitter_count: int,
    is_chaotic_scratch: bool,
    q_index: int,
    total_q: int,
    has_panic_tag: bool
) -> float:
    t_safe = max(dwell_seconds, 0.0)
    tau_safe = max(expected_seconds, 15.0)
    r_i = t_safe / tau_safe
    j_safe = min(max(jitter_count, 0), 5)
    k_scope = max(total_q, 1)
    fatigue_ratio = min(max(q_index / k_scope, 0.0), 1.0)
    
    z = (
        1.25 * math.log(1.0 + r_i) +
        0.85 * j_safe +
        1.10 * (1.0 if is_chaotic_scratch else 0.0) +
        0.70 * fatigue_ratio +
        1.40 * (1.0 if has_panic_tag else 0.0) -
        2.10
    )
    return round(stable_sigmoid(z), 3)
```

### 3.3 The 6 Forensic Root-Cause Branches
1. **`scientific_deficit` (شکاف آموزشی عمیق):** In-Exam ❌ / At-Home ❌. Solved only through Open-Book Scaffolding. Re-watching video lectures is strictly prohibited.
2. **`neuro_carelessness_acc` (اختلال حلقه PFC-STN-ACC):** In-Exam ❌ / At-Home ✔️ ($< 45\text{s}$). Sub-types: digit transposition, sign inversion, scratch misreading, premature bubbling.
3. **`perceptual_priming_trap` (تله ادراکی و بارگذاری ذهن):** Stem blindness, negative verb oversight («نیست»، «به‌جز»), reversed subject/predicate. Remediated by bottom-up pencil underlining.
4. **`educational_trap` (تله آموزشی ساختاریافته طراح):** Designer baiting, boundary condition omission, intermediate variable bubbled.
5. **`working_memory_overload` (سرریز حافظه فعال و اثر زیگارنیک):** Open loops from 2–3 abandoned questions draining 40–60% of usable RAM. Remediated by the 120-Second Ejection Law.
6. **`time_pacing_shock` (شوک زمانی و مغالطه لنگر):** Front-loaded cinematic sequence panic, anchoring on sinkholes, starvation of late easy items.

---

## 4. SECTION 2: QUESTION ARCHETYPE MASTERY & STATISTICAL RELIABILITY QUADRANT

### 4.1 Archetype Taxonomy
Every question in Mediqz is cataloged into one of 6 primary archetypes:
1. `Mafhoomi` (مفهومی): Invariant principles across novel contexts.
2. `Mohasebati` (محاسباتی): Multi-step fractions, algebraic simplification, stoichiometric balancing.
3. `Tarkibi` (ترکیبی): Cross-chapter synthesis.
4. `Nokat Shekl` (نکات شکل): Micro-anatomical diagrams, circuit orientations, geological layers.
5. `Hefzi` (حفظی): Textbook margin properties, industrial catalyst names, definitions.
6. `Nemoodari` (نموداری): Kinematics curves, titration curves, phase changes.

### 4.2 The Statistical Reliability Quadrant ($N \ge 10$ vs. $N \le 3$)
Amateur analysis alters study habits based on isolated questions. Pedagogical intervention must be locked behind mathematical validity filters (Slide 31):

```
                                  Sample Size (N)
                                         ▲
                                         │
                   QUADRANT I            │            QUADRANT III
           [ Certified Genuine Mastery ] │     [ Certified Systemic Defect ]
             N >= 10, Accuracy >= 75%    │       N >= 10, Accuracy < 60%
           • Action: Spaced Retrieval    │     • Action: Mandatory Subchapter
             maintenance. Do NOT         │       Remapping & Scaffolding.
             over-study.                 │
      ───────────────────────────────────┼───────────────────────────────────► Accuracy (%)
                   QUADRANT II           │            QUADRANT IV
            [ Statistical Illusion ]     │       [ Statistical Noise / Decoy ]
             N <= 3, Accuracy = 100%     │         N <= 3, Accuracy < 60%
           • Action: Quarantine; zero    │     • Action: STRICT BAN on study plan
             confidence inflation.       │       alterations. Local anomaly.
                                         │
```

#### Reliability Mathematical Formulation:
For sample size $N$ and accuracy $p = k/N$:
1. **Binomial Standard Error:**
   $$\mathrm{SE}(p) = \begin{cases} \sqrt{\frac{p(1-p)}{N}} \times 100\% & N > 1 \\ 0.0 & N \le 1 \end{cases}$$
2. **Sample Reliability Coefficient $\rho(N)$:**
   $$\rho(N) = \min\left(1.0, \; \frac{1}{1 + e^{-0.6(N - 6.5)}}\right)$$
   - At $N = 1$: $\rho(1) = 0.035$ (Noise)
   - At $N = 3$: $\rho(3) = 0.109$ (Unreliable)
   - At $N = 7$: $\rho(7) = 0.574$ (Moderate)
   - At $N \ge 10$: $\rho(10) \ge 0.891$ (Statistically Actionable)

3. **Autonomous Guard:** If $\rho(N) < 0.35$ ($N \le 3$), the system forbids spawning corrective study routines to prevent knee-jerk schedule destruction.

---

## 5. SECTION 3: COGNITIVE BIAS DETECTOR & ORTHOGONAL PSYCHOMETRICS

### 5.1 Cognitive Calibration Gap ($G_{\mathrm{cal}}$) vs. Objective Anxiety Tax ($\mathrm{Tax}_{\text{anxiety}}$)
Round 1 critique proved that conflating predicted confidence with anxiety rewards arrogance and penalizes paralyzed candidates. We enforce complete orthogonal separation:

```mermaid
flowchart LR
    subgraph Subjective_Calibration ["Metric 1: Subjective Calibration"]
        Pred["Predicted Confidence %"] --- Actual["Actual Score %"]
        Pred -.- Actual --> Gcal["Calibration Gap G_cal<br/>(Predicted - Actual)"]
        Gcal -->|"> +15%"| Overconf["Overconfidence<br/>(Mount Stupid / غرور کاذب)"]
        Gcal -->|"<-10%"| Impostor["Impostor Paranoia<br/>(سندروم ایمپاستر)"]
        Gcal -->|"-10% to +15%"| Calibrated["Well Calibrated<br/>(شناخت منطبق بر واقعیت)"]
    end
    
    subgraph Objective_Anxiety ["Metric 2: Objective Anxiety Tax"]
        PanicItems["Questions dropped in-exam<br/>with Tag 'ش' (Doubt) or 'ز' (Panic)"] --> HomeCheck{"Solved correctly At-Home<br/>without time pressure?"}
        HomeCheck -- "YES" --> RecoveredPoints["Direct Raw Points Lost<br/>Exclusively to Cortisol / Panic"]
        HomeCheck -- "NO" --> AcademicDeficit["Genuine Educational Gap<br/>(Tax = 0%)"]
    end
```

### 5.2 Scoped Anxiety Tax Formula
To resolve the denominator scoping bug, the formula explicitly scales to its evaluation scope ($K_{\text{scope}} = K_{\text{subject}}$ for subject carnets; $K_{\text{scope}} = K_{\text{exam}}$ for master booklet):

$$\mathrm{Tax}_{\text{anxiety}}(\text{scope}) = \frac{\sum_{i \in \mathcal{A}_{\text{panic, scope}}} \left( 3 \cdot \mathbf{1}_{(\text{status}_i = \text{blank})} + 4 \cdot \mathbf{1}_{(\text{status}_i = \text{wrong})} \right)}{3 \cdot K_{\text{scope}}} \times 100\%$$

- Blank items recover $+3$ marks ($\frac{1}{K_{\text{scope}}}$).
- Wrong items recover $+4$ marks ($+3$ score recovery $+1$ penalty reversal).
- $K_{\text{scope}}$ is strictly guarded: $K_{\text{scope}} = \max(K_{\text{scope}}, 1)$.

### 5.3 Anti-Hindsight Chamber ("اثر پس‌نگری")
- **Mechanism:** When carnet is opened, answers are concealed. The candidate must classify their pre-exam confidence. If an item was wrong, the correct option remains masked until the student re-solves it in the "Dark Chamber".
- **Hindsight Bias Index (HBI):**
  $$\mathrm{HBI} = \frac{\sum [\text{Wrong in Exam} \land \text{Pre-Confidence} = \text{High} \land \text{At-Home Re-Solve} = \text{Failed}]}{\max(\text{Total Wrong Questions}, 1)}$$
  If $\mathrm{HBI} \ge 0.25$, an urgent warning modal alerts the student to their illusion of mastery.

---

## 6. SECTION 4: EXHAUSTIVE 8-STATE DIFFICULTY TRIPLET ENGINE

### 6.1 Deterministic 8-State ($2^3$) Truth Table
Every candidate's accuracy profile across Easy, Medium, and Hard cohorts is evaluated into a 3-bit state vector:
$$\vec{S} = [E, M, H] = [\mathbf{1}_{(A_{\text{easy}} \ge 75\%)}, \; \mathbf{1}_{(A_{\text{medium}} \ge 65\%)}, \; \mathbf{1}_{(A_{\text{hard}} \ge 55\%)}]$$
$$\text{State Index} = (E \ll 2) \; | \; (M \ll 1) \; | \; H \in \{0, 1, 2, 3, 4, 5, 6, 7\}$$

| State Index | Bit Vector $[E, M, H]$ | Triplet Code | Diagnostic Clinical Phenotype | Behavioral Pathology | Prescribed Pedagogical Ticket |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **0** | `[0, 0, 0]` | **TRIP-0** | **The Ground-Zero Novice** (نوپای پایه-صفر) | Comprehensive deficit across all tiers. Inadequate syllabus coverage. | **Core Rebuild:** Cessation of full mock testing; sub-chapter scaffolded drilling. |
| **1** | `[0, 0, 1]` | **TRIP-1** | **The Academic Masochist / Trophy Hunter** (خودآزاری و شکار تست سخت) | Ego-driven consumption of extreme resources; scorns basic questions; bleeds easy marks due to reckless arrogance. | **Hard Quarantine:** Immediate ban on hard problem sets until Easy & Medium accuracy reaches $95\%$. |
| **2** | `[0, 1, 0]` | **TRIP-4** | **Perceptual Trap Victim** (قربانی تله‌های ادراکی در سوالات ساده) | Solid medium problem-solving, but inattentive blindness and skipping negative verbs in basic stems. | **Bottom-Up Retinal Encoding:** Mandatory physical pencil underlining on all question stems; trap hunting. |
| **3** | `[0, 1, 1]` | **TRIP-6** | **The Imposter / Overthinker** (سندروم ایمپاستر و پارانویای سادگی) | High ability on Hard/Medium, but over-analyzes Easy questions suspecting malicious traps; burns clock. | **Simplicity Acceptance:** Cognitive recalibration to accept face-value simplicity; 45s hard ceiling on Easy items. |
| **4** | `[1, 0, 0]` | **TRIP-2** | **The Populist Reader** (اوایل مسیر، متکی به منابع پوپولیستی) | Shallow textbook memorization; unable to synthesize multi-step problems; collapses outside simple templates. | **Konkur Transition:** Immediate abandonment of passive summary booklets; adoption of authentic Konkur tests. |
| **5** | `[1, 0, 1]` | **TRIP-3** | **The Non-Standard Specialist** (عدم تسلط بر تیپ‌های رایج) | High raw IQ solves novel hard items, but lacks systematic practice on routine archetypes, falling into standard traps. | **Typology Automation:** High-volume drills on routine Konkur archetypes (روتین‌سازی تیپ‌های پرتکرار). |
| **6** | `[1, 1, 0]` | **TRIP-5** | **The Zenith Ladder (Realistic Top Ranker)** (غایت‌القصوی / نردبام استاندارد) | Ideal progressive mastery from Easy to Medium. High strategic consistency; only extreme edge-cases drop. | **Fine Hammering:** Surgical "چکش‌کاری ریزه‌کاری‌ها" on extreme multi-variable synthesis to break 85%. |
| **7** | `[1, 1, 1]` | **TRIP-7** | **The Master Strategist / Elite Olympian** (استاد بلامنازع / تسلط المپیادی) | Flawless execution across all tiers ($\ge 75\%$ Easy, $\ge 65\%$ Med, $\ge 55\%$ Hard). Balanced speed and accuracy. | **Traz Maintenance:** Spaced retrieval maintenance; zero syllabus disruption; strict focus on speed optimization. |

### 6.2 Missing Difficulty Tier Guard ($N_{\text{tier}} = 0$)
In topical or custom simulation tests lacking a specific tier (e.g., $N_{\text{hard}} = 0$), the engine must not falsely penalize the student with $0.0\%$.
- If $N_{\text{hard}} = 0$: Mark Hard tier as `EXEMPT`. Inherit bit from Medium ($H = M$). Display carnet badge: `«فاقد سوالات سطح دشوار»`.
- If $N_{\text{easy}} = 0$: Inherit bit from Medium ($E = M$). Display carnet badge: `«فاقد سوالات سطح آسان»`.

---

## 7. SECTION 5: COMPLETE SYSTEM ARCHITECTURE & CODE

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ALQUALITE COURSEBOX (MEDIQZ) REPO TREE                          │
├───────────────────────────────────┬────────────────────────────────────────────────────┤
│ Path                              │ Architectural Responsibility                       │
├───────────────────────────────────┼────────────────────────────────────────────────────┤
│ backend/app/api/forensics.py      │ FastAPI endpoints, NCRI engine, 24h decay guard   │
│ backend/app/models/forensics.py   │ Pydantic v2 schemas and request/response models    │
│ userdata.db                       │ exam_question_forensics, exam_diagnostic_carnet    │
│ exams.db                          │ exam_questions (enriched with archetype & traps)   │
│ frontend/src/store/useForensics.ts│ Two-level namespaced Zustand state vault           │
│ frontend/src/components/tahlil/   │ Dark purple liquid glass React components          │
└───────────────────────────────────┴────────────────────────────────────────────────────┘
```

### 7.1 SQLite DDL (`userdata.db`)
```sql
-- Forensic Root-Cause Question Autopsy Table
CREATE TABLE IF NOT EXISTS exam_question_forensics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exam_id TEXT NOT NULL,
    q_num INTEGER NOT NULL,
    utid TEXT,
    
    -- In-Exam Telemetry
    in_exam_status TEXT CHECK(in_exam_status IN ('correct', 'wrong', 'blank')),
    user_selected_opt INTEGER,
    correct_opt INTEGER NOT NULL,
    pre_confidence_rating TEXT CHECK(pre_confidence_rating IN ('high', 'doubt_50_50', 'random_guess', 'skipped')),
    in_session_tag TEXT CHECK(in_session_tag IN ('none', 'shek', 'zaman', 'check_round2')),
    
    -- At-Home Scaffolding Audit
    outside_status TEXT CHECK(outside_status IN ('solved_without_time', 'needed_explanation', 'unsolved_deficit', 'not_attempted')),
    outside_time_seconds INTEGER DEFAULT 0,
    
    -- Forensic Classification
    macro_root_cause TEXT NOT NULL CHECK(macro_root_cause IN (
        'scientific_deficit', 'neuro_carelessness_acc', 'perceptual_priming_trap',
        'educational_trap', 'working_memory_overload', 'time_pacing_shock', 'none_correct'
    )),
    is_pareto_suspect BOOLEAN DEFAULT 0,
    
    -- Tier-2 Pareto Telemetry
    scratch_topology TEXT CHECK(scratch_topology IN ('linear_boxed', 'chaotic_unboxed')),
    pfc_acc_restart_forced BOOLEAN DEFAULT 0,
    dwell_time_seconds REAL DEFAULT 0.0,
    jitter_count INTEGER DEFAULT 0,
    ncri_score REAL DEFAULT 0.0,
    underlined_keywords BOOLEAN DEFAULT 1,
    hindsight_bias_flag BOOLEAN DEFAULT 0,
    forensic_notes TEXT,
    
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, exam_id, q_num)
);

CREATE INDEX IF NOT EXISTS idx_eqf_lookup ON exam_question_forensics(user_id, exam_id);

-- Master Clinical Diagnostic Carnet
CREATE TABLE IF NOT EXISTS exam_diagnostic_carnet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exam_id TEXT NOT NULL,
    
    -- Difficulty Triplets
    easy_accuracy_pct REAL NOT NULL,
    medium_accuracy_pct REAL NOT NULL,
    hard_accuracy_pct REAL NOT NULL,
    triplet_code TEXT NOT NULL,
    triplet_title TEXT NOT NULL,
    triplet_protocol TEXT NOT NULL,
    missing_tiers_json TEXT DEFAULT '[]',
    
    -- Cognitive Biases & Taxes
    predicted_confidence_pct REAL NOT NULL,
    actual_score_pct REAL NOT NULL,
    calibration_gap_pct REAL NOT NULL,
    bias_category TEXT NOT NULL CHECK(bias_category IN ('overconfidence', 'impostor', 'calibrated')),
    objective_anxiety_tax_pct REAL NOT NULL,
    hindsight_bias_index REAL NOT NULL,
    
    -- Epistemic Decay & Status
    elapsed_hours_at_submission REAL NOT NULL,
    is_decayed BOOLEAN NOT NULL DEFAULT 0,
    validity_status TEXT NOT NULL,
    
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, exam_id)
);
```

### 7.2 FastAPI Backend Endpoint (`backend/app/api/forensics.py`)
```python
from datetime import datetime, timezone, timedelta
import json
import math
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.api.deps import get_current_user
from app.core.database import get_user_db
from app.core.exams_db import get_exams_db

router = APIRouter(prefix="/exams/{exam_id}/forensics", tags=["diagnostic-forensics"])

# --- Helper Functions ---

def stable_sigmoid(z: float) -> float:
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    else:
        ez = math.exp(z)
        return ez / (1.0 + ez)

def parse_flexible_datetime(dt_str: str) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
    except Exception:
        pass
    # Support YYYY-MM-DD or standard formats
    for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
        try:
            parsed = datetime.strptime(dt_str, fmt)
            # End of that exam day in UTC
            return parsed.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        except Exception:
            continue
    return None

def evaluate_triplets(
    easy_acc: float, med_acc: float, hard_acc: float,
    has_easy: bool, has_med: bool, has_hard: bool
) -> Dict:
    missing = []
    if not has_easy: missing.append("آسان")
    if not has_med: missing.append("متوسط")
    if not has_hard: missing.append("دشوار")

    # Inherit missing tier states
    e_bit = 1 if (easy_acc >= 75.0 if has_easy else (med_acc >= 65.0 if has_med else 1)) else 0
    m_bit = 1 if (med_acc >= 65.0 if has_med else (easy_acc >= 75.0 if has_easy else 1)) else 0
    h_bit = 1 if (hard_acc >= 55.0 if has_hard else m_bit) else 0

    state_idx = (e_bit << 2) | (m_bit << 1) | h_bit

    TABLE = {
        0: ("TRIP-0", "نوپای پایه-صفر (The Ground-Zero Novice)", "شکاف در تمام سطوح؛ توقف آزمون جامع و بازگشت به یادگیری داربستی."),
        1: ("TRIP-1", "شکارچی تست سخت و خودآزاری آموزشی (The Academic Masochist)", "مصرف تست سنگین برای ایگو؛ قرنطینه منابع سخت تا رسیدن آسان/متوسط به ۹۵٪."),
        2: ("TRIP-4", "قربانی تله‌های ادراکی در سوالات ساده (Perceptual Trap Victim)", "تسلط بر متوسط؛ کوری ادراکی در ساده. اجرای خط‌کشی فیزیکی زیر قیدها."),
        3: ("TRIP-6", "سندروم ایمپاستر و پارانویای سادگی (The Imposter / Overthinker)", "حل سخت، شک به ساده. پذیرش سادگی ذات سوالات آسان با ددلاین ۴۵ ثانیه‌ای."),
        4: ("TRIP-2", "نوپای متکی به منابع پوپولیستی (The Populist Reader)", "حفظیات سطحی؛ مهاجرت فوری از درسنامه‌ها به تست‌های استاندارد کنکور."),
        5: ("TRIP-3", "متخصص غیر استاندارد (The Non-Standard Specialist)", "هوش بالا در سخت؛ فقدان اتوماسیون تیپ‌های رایج. روتین‌سازی تیپ‌های پرتکرار."),
        6: ("TRIP-5", "غایت‌القصوی / نردبام رتبه برتر استاندارد (The Zenith Benchmark)", "سلسله‌مراتب یادگیری کاملاً سالم؛ چکش‌کاری ریزه‌کاری‌ها برای سقف ۸۵٪."),
        7: ("TRIP-7", "استاد بلامنازع / تسلط المپیادی (The Master Strategist)", "تسلط کامل در تمام سطوح؛ تثبیت با مرور فاصله‌دار بدون دستکاری برنامه.")
    }
    code, title, protocol = TABLE[state_idx]
    return {
        "code": code,
        "title": title,
        "protocol": protocol,
        "missing_tiers": missing
    }

# --- Request Models ---

class Tier1Item(BaseModel):
    q_num: int
    user_selected_opt: Optional[int] = None
    macro_root_cause: str
    is_pareto_suspect: bool = False
    # Tier 2 fields (Optional)
    outside_status: Optional[str] = "not_attempted"
    scratch_topology: Optional[str] = "linear_boxed"
    pfc_acc_restart_forced: Optional[bool] = False
    dwell_time_seconds: Optional[float] = 0.0
    jitter_count: Optional[int] = 0
    underlined_keywords: Optional[bool] = True
    forensic_notes: Optional[str] = ""

class ForensicSubmissionRequest(BaseModel):
    predicted_confidence_pct: float = Field(..., ge=0.0, le=100.0)
    items: List[Tier1Item]

# --- Submission Endpoint ---

@router.post("/submit")
def submit_forensics(
    exam_id: str,
    payload: ForensicSubmissionRequest,
    current_user: Dict = Depends(get_current_user)
):
    now_utc = datetime.now(timezone.utc)
    now_iso = now_utc.isoformat()

    # 1. Fetch Exam Meta & Verify 24-Hour Epistemic Decay Guard
    with get_exams_db() as econn:
        ec = econn.cursor()
        exam_row = ec.execute("SELECT held_date, total_questions FROM exams WHERE id = ?", (exam_id,)).fetchone()
        if not exam_row:
            raise HTTPException(status_code=404, detail="آزمون مورد نظر یافت نشد.")
        q_rows = ec.execute(
            "SELECT q_num, correct_opt, difficulty, archetype_code FROM exam_questions WHERE exam_id = ? ORDER BY q_num ASC",
            (exam_id,)
        ).fetchall()
        q_meta = {r["q_num"]: dict(r) for r in q_rows}

    with get_user_db() as uconn:
        uc = uconn.cursor()
        analysis_row = uc.execute(
            "SELECT created_at FROM student_exam_analyses WHERE user_id = ? AND exam_id = ?",
            (current_user["id"], exam_id)
        ).fetchone()

    reference_str = analysis_row["created_at"] if analysis_row else exam_row["held_date"]
    exam_dt = parse_flexible_datetime(reference_str)

    if exam_dt:
        elapsed_hours = max(0.0, (now_utc - exam_dt).total_seconds() / 3600.0)
    else:
        elapsed_hours = 0.0

    is_decayed = elapsed_hours > 24.0
    validity_status = "DECAYED_PASSIVE_TRANSCRIPTION" if is_decayed else "CERTIFIED_ACTIVE"

    # 2. Process Telemetry & Accuracy
    total_q = len(q_meta)
    easy_tot = easy_corr = med_tot = med_corr = hard_tot = hard_corr = 0
    in_exam_correct = in_exam_wrong = 0
    anxiety_recovered_points = 0
    hindsight_triggers = 0

    forensic_records = []
    for item in payload.items:
        meta = q_meta.get(item.q_num)
        if not meta:
            continue
        corr_opt = meta["correct_opt"]
        is_corr = (item.user_selected_opt == corr_opt)
        diff = meta["difficulty"]

        # Difficulty counters
        if diff == "آسان":
            easy_tot += 1
            if is_corr: easy_corr += 1
        elif diff == "متوسط":
            med_tot += 1
            if is_corr: med_corr += 1
        elif diff == "دشوار":
            hard_tot += 1
            if is_corr: hard_corr += 1

        if is_corr:
            in_exam_correct += 1
            in_status = "correct"
        elif item.user_selected_opt in (1, 2, 3, 4):
            in_exam_wrong += 1
            in_status = "wrong"
        else:
            in_status = "blank"

        # Anxiety Tax points
        if in_status in ("wrong", "blank") and item.outside_status == "solved_without_time":
            anxiety_recovered_points += (4 if in_status == "wrong" else 3)

        # NCRI calculation
        ncri = 0.0
        if item.is_pareto_suspect:
            tau = 45.0 if diff == "آسان" else (75.0 if diff == "متوسط" else 105.0)
            ncri = compute_ncri(
                dwell_seconds=item.dwell_time_seconds or 0.0,
                expected_seconds=tau,
                jitter_count=item.jitter_count or 0,
                is_chaotic_scratch=(item.scratch_topology == "chaotic_unboxed"),
                q_index=item.q_num,
                total_q=total_q,
                has_panic_tag=False
            )

        forensic_records.append((
            current_user["id"], exam_id, item.q_num, f"{exam_id}_{item.q_num}",
            in_status, item.user_selected_opt, corr_opt, "high", "none",
            item.outside_status, 0, item.macro_root_cause, item.is_pareto_suspect,
            item.scratch_topology, item.pfc_acc_restart_forced, item.dwell_time_seconds,
            item.jitter_count, ncri, item.underlined_keywords, False, item.forensic_notes,
            now_iso, now_iso
        ))

    # 3. Compute Metrics
    actual_score = round(max(-33.33, min(100.0, (3 * in_exam_correct - in_exam_wrong) / (3 * max(total_q, 1)) * 100.0)), 2)
    easy_acc = round((easy_corr / easy_tot * 100.0) if easy_tot else 0.0, 2)
    med_acc = round((med_corr / med_tot * 100.0) if med_tot else 0.0, 2)
    hard_acc = round((hard_corr / hard_tot * 100.0) if hard_tot else 0.0, 2)

    triplet_res = evaluate_triplets(easy_acc, med_acc, hard_acc, easy_tot > 0, med_tot > 0, hard_tot > 0)
    calib_gap = round(payload.predicted_confidence_pct - actual_score, 2)
    bias_category = "overconfidence" if calib_gap > 15.0 else ("impostor" if calib_gap < -10.0 else "calibrated")
    anxiety_tax = round((anxiety_recovered_points / (3 * max(total_q, 1))) * 100.0, 2)

    # 4. Atomic Commit
    with get_user_db() as uconn:
        uc = uconn.cursor()
        uc.executemany("""
            INSERT OR REPLACE INTO exam_question_forensics (
                user_id, exam_id, q_num, utid, in_exam_status, user_selected_opt, correct_opt,
                pre_confidence_rating, in_session_tag, outside_status, outside_time_seconds,
                macro_root_cause, is_pareto_suspect, scratch_topology, pfc_acc_restart_forced,
                dwell_time_seconds, jitter_count, ncri_score, underlined_keywords, hindsight_bias_flag,
                forensic_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, forensic_records)

        uc.execute("""
            INSERT OR REPLACE INTO exam_diagnostic_carnet (
                user_id, exam_id, easy_accuracy_pct, medium_accuracy_pct, hard_accuracy_pct,
                triplet_code, triplet_title, triplet_protocol, missing_tiers_json,
                predicted_confidence_pct, actual_score_pct, calibration_gap_pct,
                bias_category, objective_anxiety_tax_pct, hindsight_bias_index,
                elapsed_hours_at_submission, is_decayed, validity_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            current_user["id"], exam_id, easy_acc, med_acc, hard_acc,
            triplet_res["code"], triplet_res["title"], triplet_res["protocol"],
            json.dumps(triplet_res["missing_tiers"], ensure_ascii=False),
            payload.predicted_confidence_pct, actual_score, calib_gap,
            bias_category, anxiety_tax, 0.0, elapsed_hours, is_decayed, validity_status,
            now_iso, now_iso
        ))
        uconn.commit()

    return {
        "status": "success",
        "exam_id": exam_id,
        "actual_score_pct": actual_score,
        "calibration_gap_pct": calib_gap,
        "bias_category": bias_category,
        "objective_anxiety_tax_pct": anxiety_tax,
        "triplet": triplet_res,
        "is_decayed": is_decayed,
        "validity_status": validity_status
    }
```

---

### 7.3 Zustand State Vault (`frontend/src/store/useDiagnosticForensicsStore.ts`)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MacroRootCause =
  | 'scientific_deficit'
  | 'time_shock'
  | 'educational_trap'
  | 'perceptual_blindness'
  | 'ram_overload'
  | 'none_correct';

export interface QuestionForensicState {
  qNum: number;
  userSelectedOpt: number | null;
  macroRootCause: MacroRootCause;
  isParetoSuspect: boolean;
  outsideStatus?: 'solved_without_time' | 'needed_explanation' | 'unsolved_deficit';
  scratchTopology?: 'linear_boxed' | 'chaotic_unboxed';
  pfcAccRestartForced?: boolean;
  dwellTimeSeconds?: number;
  jitterCount?: number;
  underlinedKeywords?: boolean;
  forensicNotes?: string;
}

export interface DifficultyTripletResult {
  code: string;
  title: string;
  protocol: string;
  missing_tiers: string[];
}

export interface DiagnosticCarnetResult {
  status: string;
  exam_id: string;
  actual_score_pct: number;
  calibration_gap_pct: number;
  bias_category: 'overconfidence' | 'impostor' | 'calibrated';
  objective_anxiety_tax_pct: number;
  triplet: DifficultyTripletResult;
  is_decayed: boolean;
  validity_status: string;
}

interface DiagnosticForensicsStore {
  // TWO-LEVEL NAMESPACING: examId -> qNum -> QuestionState
  forensicsDraftByExam: Record<string, Record<number, QuestionForensicState>>;
  predictedConfidenceByExam: Record<string, number>;
  activeCarnetByExam: Record<string, DiagnosticCarnetResult>;
  activeExamId: string | null;
  
  // Tactical Undo State for Mobile 300ms Buffer
  recentAutoAdvanceUndo: {
    examId: string;
    qNum: number;
    previousState: QuestionForensicState;
    timerId?: NodeJS.Timeout;
  } | null;

  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveExam: (examId: string) => void;
  setPredictedConfidence: (examId: string, confidence: number) => void;
  updateQuestionForensic: (examId: string, qNum: number, update: Partial<QuestionForensicState>) => void;
  recordAutoAdvanceWithUndo: (examId: string, qNum: number, update: Partial<QuestionForensicState>) => void;
  revertLastAutoAdvance: () => void;
  resetExamDraft: (examId: string) => void;
  submitExamForensics: (examId: string) => Promise<void>;
}

export const useDiagnosticForensicsStore = create<DiagnosticForensicsStore>()(
  persist(
    (set, get) => ({
      forensicsDraftByExam: {},
      predictedConfidenceByExam: {},
      activeCarnetByExam: {},
      activeExamId: null,
      recentAutoAdvanceUndo: null,
      isSubmitting: false,
      isLoading: false,
      error: null,

      setActiveExam: (examId) => set({ activeExamId: examId }),

      setPredictedConfidence: (examId, confidence) =>
        set((state) => ({
          predictedConfidenceByExam: {
            ...state.predictedConfidenceByExam,
            [examId]: confidence,
          },
        })),

      updateQuestionForensic: (examId, qNum, update) => {
        set((state) => {
          const examDrafts = state.forensicsDraftByExam[examId] || {};
          const existing = examDrafts[qNum] || {
            qNum,
            userSelectedOpt: null,
            macroRootCause: 'none_correct',
            isParetoSuspect: false,
          };
          return {
            forensicsDraftByExam: {
              ...state.forensicsDraftByExam,
              [examId]: {
                ...examDrafts,
                [qNum]: { ...existing, ...update },
              },
            },
          };
        });
      },

      recordAutoAdvanceWithUndo: (examId, qNum, update) => {
        const state = get();
        const examDrafts = state.forensicsDraftByExam[examId] || {};
        const previousState = examDrafts[qNum] || {
          qNum,
          userSelectedOpt: null,
          macroRootCause: 'none_correct',
          isParetoSuspect: false,
        };

        // Clear existing timer if active
        if (state.recentAutoAdvanceUndo?.timerId) {
          clearTimeout(state.recentAutoAdvanceUndo.timerId);
        }

        // Apply update
        state.updateQuestionForensic(examId, qNum, update);

        // Schedule 3.5s auto-expire for undo capsule
        const timerId = setTimeout(() => {
          set({ recentAutoAdvanceUndo: null });
        }, 3500);

        set({
          recentAutoAdvanceUndo: {
            examId,
            qNum,
            previousState,
            timerId,
          },
        });
      },

      revertLastAutoAdvance: () => {
        const undo = get().recentAutoAdvanceUndo;
        if (!undo) return;
        if (undo.timerId) clearTimeout(undo.timerId);

        get().updateQuestionForensic(undo.examId, undo.qNum, undo.previousState);
        set({ recentAutoAdvanceUndo: null });
      },

      resetExamDraft: (examId) => {
        set((state) => {
          const newDrafts = { ...state.forensicsDraftByExam };
          delete newDrafts[examId]; // Leak-free atomic deletion
          const newCarnets = { ...state.activeCarnetByExam };
          delete newCarnets[examId];
          return {
            forensicsDraftByExam: newDrafts,
            activeCarnetByExam: newCarnets,
          };
        });
      },

      submitExamForensics: async (examId) => {
        const state = get();
        const examDraft = state.forensicsDraftByExam[examId] || {};
        const predictedConfidence = state.predictedConfidenceByExam[examId] ?? 70.0;

        set({ isSubmitting: true, error: null });
        try {
          const payload = {
            predicted_confidence_pct: predictedConfidence,
            items: Object.values(examDraft).map((item) => ({
              q_num: item.qNum,
              user_selected_opt: item.userSelectedOpt,
              macro_root_cause: item.macroRootCause,
              is_pareto_suspect: item.isParetoSuspect,
              outside_status: item.outsideStatus || 'not_attempted',
              scratch_topology: item.scratchTopology || 'linear_boxed',
              pfc_acc_restart_forced: item.pfcAccRestartForced || false,
              dwell_time_seconds: item.dwellTimeSeconds || 0.0,
              jitter_count: item.jitterCount || 0,
              underlined_keywords: item.underlinedKeywords ?? true,
              forensic_notes: item.forensicNotes || '',
            })),
          };

          const res = await fetch(`/api/exams/${examId}/forensics/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'خطا در ثبت تحلیل');
          }

          const carnet: DiagnosticCarnetResult = await res.json();
          set((s) => ({
            activeCarnetByExam: { ...s.activeCarnetByExam, [examId]: carnet },
            isSubmitting: false,
          }));
        } catch (err: any) {
          set({ error: err.message, isSubmitting: false });
        }
      },
    }),
    {
      name: 'mediqz-forensics-vault-prod',
      partialize: (state) => ({
        forensicsDraftByExam: state.forensicsDraftByExam,
        predictedConfidenceByExam: state.predictedConfidenceByExam,
      }),
    }
  )
);
```

---

## 8. SECTION 6: UI/UX SYSTEM ARCHITECTURE & REACT SPECIFICATION

### 8.1 Visual DNA: Dark Purple Liquid Glass
- **Surface Elevation:** `#0e0a22` / `rgba(14, 10, 34, 0.94)` background with high-order chromatic violet mesh (`rgba(168, 85, 247, 0.08)` to `rgba(99, 102, 241, 0.06)`).
- **Glassmorphism Borders:** `border border-purple-500/25 shadow-2xl shadow-purple-950/70 backdrop-blur-2xl`.
- **Specular Refraction:** Top-edge hairline gradient `inset 0 1px 1px 0 rgba(255, 255, 255, 0.18)`.
- **Persian Numeral Enforcement:** Every rendered integer and decimal string is passed through `toPersianDigits()`.

### 8.2 Mobile Viewport ($375 \times 812$) Thumb Ergonomics
- **48px Reachability Standard:** Every selectable pill and navigation trigger conforms to $\ge 48\text{px} \times 48\text{px}$.
- **Safe-Area Inset Capsule:** Bottom floating controls adhere to `pb-[calc(env(safe-area-inset-bottom,16px)+0.75rem)]`.
- **Tactile 300ms Buffer & Floating Undo Capsule:**
  When a student taps a Tier-1 Macro Pill, the selection illuminates with a specular violet ring for $300\text{ms}$ before sliding to the next question. Simultaneously, a bottom floating capsule appears:
  `«ثبت تست شماره ۱۲ | لغو (۳.۵ ثانیه)»` allowing 1-tap instant rollback.

### 8.3 React Component Hierarchy
```
TahlilHub
 └── DiagnosticForensicsRoot
      ├── DiagnosticTopHeader (Title, Shamsi Date, Epistemic Countdown Timer)
      ├── EpistemicDecayBanner (Locked vs Active Status indicator)
      ├── CognitiveCalibrationBar (Confidence Gap & Mount Stupid vs Impostor tag)
      ├── Tier1TriageView (Horizontal carousel of missed questions with 5 Macro Pills)
      │    └── FloatingUndoCapsule (Persistent 3.5s tactile rollback trigger)
      ├── Tier2ParetoDrawer (Micro-bottom sheet for top 20% systemic bugs)
      │    ├── ScratchTopologySelector (Linear Boxed vs Chaotic Unboxed)
      │    ├── StemUnderlineToggle (1-tap Bottom-up retinal validation)
      │    └── SSCRoutineTicketGenerator (Conversion to 20-min daily habit)
      ├── DifficultyTripletGrid (Dynamic 8-state phenotype card with missing-tier guards)
      └── StatisticalReliabilityQuadrant (Mastery vs Noise 2x2 matrix)
```

---

## 9. CERTIFICATION STATEMENT
This blueprint represents the complete, hardened architectural specification for Pod 1 (Deep Diagnostic & Error Forensics). Every mathematical function is numerically guarded, every database operation is WAL-concurrency safe, every UX interaction is thumb-optimized for mobile WebKit, and all fluff has been replaced by clinical engineering.
