# High-Yield CourseBox Courses Design Spec
**Date:** 2026-10-16  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Context & Objective
In the Iranian national college entrance exams (Konkur) and high school final exams (امتحانات نهایی), GPA scores from final exams now carry a 50% to 60% definitive weight (تأثیر قطعی سوابق تحصیلی). Official exam grading schemes utilize strict, granular keys with 0.25-point increments. Minor lapses in recalling exact keywords, Qur'anic verse messages, biological qualifiers (قیدهای زیست), health definitions, or chemical element locations directly result in lost points.

The objective is to implement a suite of high-yield, objective, spaced-repetition courses in **Alqualite CourseBox** that target these exact exam traps without excessive cognitive strain on the student:

1. **`dini12_ayat.json` (شاه‌کلید آیات و روایات دین و زندگی دوازدهم)**:
   - Full coverage of all core verses and hadiths across Grade 12 lessons.
   - Interactive `fill_in_the_blank` for exact Sanjesh key messages and cause-and-effect conclusions.
   - Interactive `literary_matrix` / matching for mapping verses to theological principles (توحید در ربوبیت، خالقیت، مالکیت، ولایت، توبه، سنن الهی).

2. **`health12.json` (کپسول حفظیات سلامت و بهداشت دوازدهم)**:
   - Covers all high-frequency final exam questions from the Grade 12 textbook.
   - Interactive `fill_in_the_blank` for core definitions (BMI, vitamins, saturated/unsaturated/trans fatty acids, risk factors).
   - Interactive `correct_incorrect` for true/false textbook assertions.
   - Interactive `tree_diagram` for hierarchical classification of health dimensions and disease types.

3. **`biology_ghayd.json` (شکارگاه قیدهای زیست‌شناسی - دهم، یازدهم، دوازدهم)**:
   - Systematic coverage of biological qualifier assertions (*همه، هیچ، هر، اغلب، بیشتر، برخی، به ندرت، همیشه، فقط*).
   - Interactive `correct_incorrect` with explicit textbook explanations and exceptions.

4. **`chemistry_elements.json` (بانک ویژگی‌ها و جدول تناوبی شیمی کنکور و نهایی)**:
   - Elements 1 through 36 and key 4th-period transition metals (Sc to Zn).
   - Interactive `fill_in_the_blank` and attribute matching for atomic number, period, group, electron configuration, and textbook applications (alloys, catalysts, colors).

---

## 2. Interactive Mechanics & EU Schemas

### 2.1 Fill-In-The-Blank (`fill_in_the_blank`)
```json
{
  "id": "D12-AY-L1-1",
  "type": "fill_in_the_blank",
  "order": 1,
  "topic_tag": "آیات و روایات",
  "payload": {
    "word": "یا أَیهَا النّاسُ أَنتُمُ الفُقَراءُ إِلَی اللهِ وَ اللهُ هُوَ الغَنِی الحَمیدُ",
    "translation": "پیام آیه: وابستگی و نیاز ذاتی همه انسان‌ها در پیدایش و بقا به خداوند، و بی‌نیازی مطلق الهی",
    "keywords": [
      "نیاز ذاتی", "فقر ذاتی", "بقا", "پیدایش و بقا", "بی نیازی", "غنی", "بی نیاز مطلق"
    ],
    "hint": "درس اول: هستی‌بخش - ارتباط با فقر وجودی و نیاز در بقا",
    "lesson_ref": "درس ۱ - هستی‌بخش"
  }
}
```

### 2.2 Correct / Incorrect (`correct_incorrect`)
```json
{
  "id": "BIO-QD-1",
  "type": "correct_incorrect",
  "order": 1,
  "topic_tag": "قیدهای زیست",
  "payload": {
    "statement": "در انسان، همه سیاهرگ‌ها حاوی خون تیره و کربن‌دی‌اکسید دار هستند.",
    "is_correct": false,
    "explanation": "نادرست - سیاهرگ‌های ششی (۴ سیاهرگ ورودی به دهلیز چپ) حامل خون روشن و اکسیژن‌دار هستند."
  }
}
```

### 2.3 Tree Diagram (`tree_diagram`)
```json
{
  "id": "HL12-TD-1",
  "type": "tree_diagram",
  "order": 1,
  "topic_tag": "ابعاد سلامت",
  "payload": {
    "id": "root-health",
    "text": "ابعاد سلامت انسان",
    "mode": "full",
    "children": [
      {
        "id": "dim-physical",
        "text": "سلامت جسمانی",
        "children": [
          {"id": "phys-nutrition", "text": "تغذیه مناسب"},
          {"id": "phys-exercise", "text": "فعالیت بدنی"}
        ]
      },
      {
        "id": "dim-mental",
        "text": "سلامت روانی",
        "children": [
          {"id": "ment-stress", "text": "مدیریت استرس"},
          {"id": "ment-resilience", "text": "تاب‌آوری"}
        ]
      },
      {
        "id": "dim-social",
        "text": "سلامت اجتماعی",
        "children": [
          {"id": "soc-comms", "text": "روابط بین‌فردی"}
        ]
      },
      {
        "id": "dim-spiritual",
        "text": "سلامت معنوی",
        "children": [
          {"id": "spir-meaning", "text": "معناجویی در زندگی"}
        ]
      }
    ]
  }
}
```

---

## 3. API & Catalog Integration
- Courses stored in `backend/assets/courses/`:
  - `dini12_ayat.json` (topic_code: `di12_ayat`)
  - `health12.json` (topic_code: `he12`)
  - `biology_ghayd.json` (topic_code: `bi_ghayd`)
  - `chemistry_elements.json` (topic_code: `ch_pt`)
- Aliases registered in `backend/app/api/courses.py` (`ALIAS_MAP`).
- Filter tags added to `frontend/src/components/student/CourseLibrary.tsx` (e.g. `dini`, `health`, `chemistry`, `biology`).

---

## 4. Verification Plan
- Unit tests verifying:
  - Valid JSON schema and presence of non-empty EUs in each course file.
  - No empty or overly broad trigger keywords.
  - Proper resolution through the backend API router.
  - Frontend TypeScript compilation (`npm run build`).
