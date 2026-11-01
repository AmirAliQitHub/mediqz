# Comprehensive Persian Spelling Courses & Dual-Mode UI Spec
**Date:** 2026-10-18  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Vision & Core Mission
Transform the Persian spelling curriculum in **Alqualite CourseBox** by:
1. **Separating into 3 dedicated grade courses:**
   - `persian10_emla` (املای فارسی پایه دهم - ۸ فصل)
   - `persian11_emla` (املای فارسی پایه یازدهم - ۸ فصل)
   - `persian12_emla` (املای فارسی پایه دوازدهم - ۸ فصل)
2. **Comprehensive Chapter-by-Chapter Extraction (8 Parts per grade):**
   - Every single chapter of the official textbooks (فصول ۱ تا ۸) forms an independent part.
   - All multi-letter sound traps (ص/ث/س، ط/ت، ض/ظ/ذ/ز، ق/غ، ح/ه، ع/ء/ا، واو معدوله، هم‌آواها) extracted from lessons, poems, texts, and end-of-book glossaries.
3. **Dual-Mode Interactive UI (با یا بدون جمله کمکی):**
   - **Contextual Mode (با جمله کمکی):** Sentence context displayed as in traditional final exam fill-in-the-blank and error-spotting questions.
   - **Isolated Mode (بدون جمله کمکی):** Direct word and definition focus to build rapid mental orthographic imagery without reliance on surrounding text.
   - Instant toggle available in player header and modal selector on part launch.

---

## 2. Course Structure & Chapter Taxonomy

### Grade 10: `persian10_emla.json` (املای فارسی دهم)
- **Topic Code:** `fa10_emla`
- **Parts (8 Parts):**
  - پارت ۱ (فصل ۱: ادبیات تعلیمی - ستایش، درس ۱ چشمه، درس ۲ از رستم و سهراب)
  - پارت ۲ (فصل ۲: ادبیات سفر و زندگی - درس ۳ سفر به بصره، درس ۵ کلاس نقاشی)
  - پارت ۳ (فصل ۳: ادبیات غنایی - درس ۶ خسرو، درس ۷ جمال و کمال)
  - پارت ۴ (فصل ۴: ادبیات پایداری - درس ۸ از پاریز تا پاریس، درس ۹ کویر)
  - پارت ۵ (فصل ۵: ادبیات انقلاب اسلامی - درس ۱۰ دریادلان، درس ۱۱ خاک عشق‌ورزی)
  - پارت ۶ (فصل ۶: ادبیات حماسی - درس ۱۲ رستم و اشکبوس، درس ۱۳ گردآفرید)
  - پارت ۷ (فصل ۷: ادبیات داستانی - درس ۱۴ طوطی و بازرگان، درس ۱۵ خسرو انوشیروان)
  - پارت ۸ (فصل ۸: ادبیات جهان و نیایش - درس ۱۶ خسرو شکیبایی، درس ۱۷ کلبه عمو تم، نیایش)

### Grade 11: `persian11_emla.json` (املای فارسی یازدهم)
- **Topic Code:** `fa11_emla`
- **Parts (8 Parts):**
  - پارت ۱ (فصل ۱: ادبیات تعلیمی - نیکی، قناعت، طاعت، صواب)
  - پارت ۲ (فصل ۲: ادبیات سفر و زندگی - ذوق، فراست، طراوت، عمارت)
  - پارت ۳ (فصل ۳: ادبیات غنایی - حلاوت، صفیر، التفات، وصال)
  - پارت ۴ (فصل ۴: ادبیات پایداری - مصلحت، حضیض، انحطاط، عزم)
  - پارت ۵ (فصل ۵: ادبیات انقلاب اسلامی - ایثار، ضجه، استغنا، تقاضا)
  - پارت ۶ (فصل ۶: ادبیات حماسی - غلوا، خاستن، غارت، مقهور)
  - پارت ۷ (فصل ۷: ادبیات داستانی - مسطور، محمل، توجیه، بساط)
  - پارت ۸ (فصل ۸: ادبیات جهان و نیایش - تضرع، اخلاص، ثنا، فارغ)

### Grade 12: `persian12_emla.json` (املای فارسی دوازدهم)
- **Topic Code:** `fa12_emla`
- **Parts (8 Parts):**
  - پارت ۱ (فصل ۱: ادبیات تعلیمی - شکر نعمت، دماوندیه، مستغنی، بحران)
  - پارت ۲ (فصل ۲: ادبیات پایداری - در سایه‌سار نخل ولایت، از آسمان سبز)
  - پارت ۳ (فصل ۳: ادبیات غنایی - آزادی، کعبه مخفی، غازه، حلیم)
  - پارت ۴ (فصل ۴: ادبیات سفر و زندگی - سفرنامه اصفهان، راجع، قرب/غرب)
  - پارت ۵ (فصل ۵: ادبیات انقلاب اسلامی - خط خون، بهار دلنشین، انقضا)
  - پارت ۶ (فصل ۶: ادبیات حماسی - گذر سیاوش از آتش، خوان/خان)
  - پارت ۷ (فصل ۷: ادبیات داستانی - کباب غاز، کویر، ضریر، فارق)
  - پارت ۸ (فصل ۸: ادبیات جهان و نیایش - از پاریز تا پاریس، نیایش، انتساب)

---

## 3. Educational Unit (EU) Data Contract
```json
{
  "id": "fa10-emla-p1-eu01",
  "order": 1,
  "type": "fill_in_the_blank",
  "topic_tag": "انتخاب املای صحیح",
  "payload": {
    "word": "قناعت",
    "pair": "قناعت / غناعت",
    "sentence": "پای در دامن (قناعت / غناعت) کشید و دست از طلب کوتاه کرد.",
    "isolated_prompt": "املای صحیح واژه برای معنای «بی‌نیازی و خرسندی به اندک» را بنویسید:",
    "context_sentence": "پای در دامن قناعت کشید و دست از طلب کوتاه کرد.",
    "meaning": "بی‌نیازی، بسنده کردن به مقدار کم و رضا دادن به قسمت خود",
    "full_meaning": "قناعت: بی‌نیازی و بسنده کردن به اندک",
    "keywords": ["قناعت", "بی نیازی", "بسنده کردن", "خرسندی"],
    "trap_note": "نکته املایی: «قناعت» با «ق» به معنی خرسندی است؛ واژه «غناعت» غلط است (اما «غنا» با «غ» به معنی توانگری است)."
  }
}
```

---

## 4. UI/UX Interaction Design for Dual-Mode (با / بدون جمله کمکی)
1. **Mode State & Storage:**
   - Stored in `useCourseStore` or local storage: `showContextSentence: boolean` (default `true`).
2. **CoursePlayer Header Control:**
   - Floating pill next to slide counter:
     - When active: `[ 👁️ بستر متن: فعال ]`
     - When clicked: switches to `[ 🎯 فقط واژه (بدون جمله) ]`
3. **Slide Rendering in `FillInTheBlank.tsx`:**
   - If `showContextSentence` is active:
     - Displays `payload.sentence` (e.g. `پای در دامن (قناعت / غناعت) کشید...`).
   - If `showContextSentence` is inactive:
     - Displays `payload.isolated_prompt` or `املای صحیح واژه را انتخاب یا تایپ کنید:`
     - Prominently displays the target pair `[ قناعت / غناعت ]` alongside the definition.
4. **Part Start Dialog / Option in `CoursePartsView`:**
   - Before launching a part, a subtle capsule switch lets students pre-select their preferred training mode:
     - «آزمون در بستر جملات نهایی»
     - «تمرکز خالص بر واژگان دام‌دار»
