# Complete CourseBox Content & Artistic Elevation Plan
**Spec:** `docs/superpowers/specs/2026-10-18-complete-expansion-design.md`  
**Date:** 2026-10-18  

---

### Task 1: Persian Spelling Traps Course (`persian_emla.json`)
- Files:
  - Create: `backend/assets/courses/persian_emla.json`
  - Create: `scripts/generate_persian_emla_course.py`
  - Create: `tests/test_persian_emla_course.py`
- Verification: failing test -> generate course -> passing test -> git commit.

---

### Task 2: Persian Literary Figures Course (`persian_araye.json`)
- Files:
  - Create: `backend/assets/courses/persian_araye.json`
  - Create: `scripts/generate_persian_araye_course.py`
  - Create: `tests/test_persian_araye_course.py`
- Verification: failing test -> generate course -> passing test -> git commit.

---

### Task 3: Chemistry Catalysts, Flame Colors & Reactions Course (`chemistry_catalysts_colors.json`)
- Files:
  - Create: `backend/assets/courses/chemistry_catalysts_colors.json`
  - Create: `scripts/generate_chemistry_catalysts_course.py`
  - Create: `tests/test_chemistry_catalysts_course.py`
- Verification: failing test -> generate course -> passing test -> git commit.

---

### Task 4: Physics SI Units & Dimensional Analysis Course (`physics_units_si.json`)
- Files:
  - Create: `backend/assets/courses/physics_units_si.json`
  - Create: `scripts/generate_physics_units_course.py`
  - Create: `tests/test_physics_units_course.py`
- Verification: failing test -> generate course -> passing test -> git commit.

---

### Task 5: Arabic Translation Rules Course (`arabic_translation_rules.json`)
- Files:
  - Create: `backend/assets/courses/arabic_translation_rules.json`
  - Create: `scripts/generate_arabic_rules_course.py`
  - Create: `tests/test_arabic_rules_course.py`
- Verification: failing test -> generate course -> passing test -> git commit.

---

### Task 6: Organic Chemistry Functional Groups Course (`chemistry_functional_groups.json`)
- Files:
  - Create: `backend/assets/courses/chemistry_functional_groups.json`
  - Create: `scripts/generate_chemistry_groups_course.py`
  - Create: `tests/test_chemistry_groups_course.py`
- Verification: failing test -> generate course -> passing test -> git commit.

---

### Task 7: Artistic UI Elevation, Acoustic Synthesizer & Visual Effects
- Files:
  - Create: `frontend/src/services/soundEffects.ts` (Web Audio API synthesizer for serene chime & soft thud)
  - Create: `frontend/src/components/common/ConfettiEffect.tsx` (Lightweight golden celebration particles)
  - Modify: `frontend/src/components/layout/CourseBoxTopBar.tsx` (Add sound toggle, Persian inspirational calligraphy/epigraph, visual polish)
  - Modify: `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx` (Trigger haptics & confetti on success)
  - Modify: `frontend/src/components/student/CourseLibrary.tsx` (Add all new subject filters with custom radiant glow themes)
  - Modify: `backend/app/api/courses.py` (Register all new course aliases and ensure auto-discovery)

---

### Task 8: End-to-End Verification & Autonomous `agent-browser` Inspection
- Start backend (`uvicorn`) and frontend (`vite`).
- Run `agent-browser open http://localhost:5173` and capture screenshots.
- Verify UI rendering, library filters, course loading, and interactive answering.
- Final whole-suite tests and audit.
