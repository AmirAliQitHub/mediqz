# Complete CourseBox Content & Artistic Design Expansion Spec
**Date:** 2026-10-18  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Vision & Core Mission
Elevate **Alqualite CourseBox** into a breathtaking, museum-grade educational platform that marries:
1. **Academic Rigor:** 6 additional high-yield courses (Persian Spelling Traps, Persian Literary Figures, Chemistry Catalysts & Colors, Physics SI Units & Dimensions, Arabic Translation Rules, Organic Chemistry Functional Groups) built from official 1403–1406 Iranian textbooks and Sanjesh final exam keys.
2. **Artistic & Emotional UI Excellence:** Poetic Persian typography, refined liquid-glass surfaces, ambient mesh gradients, haptic Web Audio acoustic chimes for learning feedback, fluid micro-interactions, study mastery streaks, and celebratory confetti.
3. **Autonomous End-to-End Visual Verification:** Automated verification via `agent-browser` inspecting the running application across desktop and mobile viewports.

---

## 2. Content Expansion Architecture (6 New Master Courses)

### 2.1 Course 1: `persian_emla.json` (واژه‌گزینی و املای دام‌دار نهایی و کنکور)
- **Topic Code:** `fa_emla`
- **Parts:** 3 parts (پایه دهم، پایه یازدهم، پایه دوازدهم)
- **EU Count:** 45+ EUs
- **EU Types:** `fill_in_the_blank` (انتخاب شکل صحیح واژه از میان دو کمانک) & `correct_incorrect` (کشف غلط‌های املایی پنهان در ابیات و عبارات متون نهایی)
- **High-Yield Traps:** صواب/ثواب، قرب/غرب، راجع/راغب، بحران/بحران، مصلحت، التفات، مستغنی، توجیه، فراست/فراست، خاست/خواست، غلیا/غلوا، تله‌های حروف ص/ث/س، ط/ت، ض/ظ/ذ/ز، ق/غ.

### 2.2 Course 2: `persian_araye.json` (کارگاه تشخیص فوق‌سریع آرایه‌های ادبی)
- **Topic Code:** `fa_araye`
- **Parts:** 3 parts (پایه دهم، پایه یازدهم، پایه دوازدهم)
- **EU Count:** 45+ EUs
- **EU Types:** `fill_in_the_blank` & `correct_incorrect`
- **High-Yield Figures:** استعاره مصرحه، استعاره مکنیه/تشخیص، مجاز و علاقه‌های اصلی (کلیه، جزئیه، محلیه، سببیه)، اسلوب معادله، حسن تعلیل، ایهام و ایهام تناسب، حس‌آمیزی، متناقض‌نما (پارادوکس)، لف و نشر، اغراق.

### 2.3 Course 3: `chemistry_catalysts_colors.json` (اطلس کاتالیزورها، رنگ‌ها، شعله‌ها و واکنش‌های شیمی)
- **Topic Code:** `ch_catalysts`
- **Parts:** 3 parts (رنگ شعله‌ها و رسوب‌ها / کاتالیزورهای صنعتی / سلول‌های الکتروشیمیایی و فرآیندها)
- **EU Count:** 40+ EUs
- **EU Types:** `fill_in_the_blank` & `correct_incorrect`
- **High-Yield Data:** رنگ شعله‌های Li, Na, K, Ca, Cu؛ رسوب‌های زرد PbI2, آبی Cu(OH)2, سرخ-قهوه‌ای Fe(OH)3, سبز Fe(OH)2؛ کاتالیزورهای هابر (Fe)، استوالد (Pt-Rh)، تماسی (V2O5)، هیدروژناسیون (Ni)؛ سلول‌های دانز، دانیل، سوختی و مبدل کاتالیستی.

### 2.4 Course 4: `physics_units_si.json` (الفبای یکاها، دیمانسیون و نمادهای SI فیزیک)
- **Topic Code:** `ph_units`
- **Parts:** 3 parts (مکانیک و گرما / الکتریسیته و مغناطیس / نوسان، موج و فیزیک اتمی)
- **EU Count:** 36+ EUs
- **EU Types:** `fill_in_the_blank` & `correct_incorrect`
- **High-Yield Data:** تسلا ($T$), وبر ($Wb$), هانری ($H$), فاراد ($F$), پاسکال ($Pa$), ژول ($J$), وات ($W$), کولن ($C$), ولت ($V$) بر حسب یکاهای بنیادین SI ($kg, m, s, A$).

### 2.5 Course 5: `arabic_translation_rules.json` (فنون ترجمه و صیغه‌های افعال دام‌دار عربی)
- **Topic Code:** `ar_rules`
- **Parts:** 3 parts (ساختارهای زمانی افعال / ادوات نفی، حصر و شروط / افعال ناقصه و ضمایر)
- **EU Count:** 40+ EUs
- **EU Types:** `fill_in_the_blank` & `correct_incorrect`
- **High-Yield Data:** کانَ + ماضی (ماضی بعید)، کانَ + مضارع (ماضی استمراری)، لَمْ + مضارع (ماضی منفی)، لَنْ + مضارع (مستقبل منفی)، قَدْ + ماضی (ماضی نقلی)، لا نفی جنس، اسلوب حصر با إلا، اسلوب شرط.

### 2.6 Course 6: `chemistry_functional_groups.json` (شناسنامه گروه‌های عاملی و شیمی آلی)
- **Topic Code:** `ch_groups`
- **Parts:** 3 parts (اکسیژن‌دارها / نیتروژن‌دارها و پلیمرها / داروهای شاخص کنکور)
- **EU Count:** 36+ EUs
- **EU Types:** `fill_in_the_blank` & `correct_incorrect`
- **High-Yield Data:** الکل، اتر، آلدهید، کتون، اسید کربوکسیلیک، استر، آمین، آمید؛ مولکول‌های آسپرین، استامینوفن، کلوگزاسیلین، وانیلین، منتول، متیل سالیسیلات، پت (PET)، نایلون، کولار.

---

## 3. UI/UX & Emotional Polish ("Design so thoughtful you cry")
1. **Acoustic Learning Haptics (Zero Asset Download, Web Audio API):**
   - Synthesize ultra-soft crystalline chime on correct answers: frequencies [523.25 Hz (C5), 659.25 Hz (E5), 783.99 Hz (G5), 1046.50 Hz (C6)] with smooth exponential decay.
   - Gentle warm acoustic thud on incorrect answers: [130.81 Hz (C3)] with soft low-pass filter.
   - Clean toggle in top bar to mute/unmute audio.
2. **Golden Celebration Confetti & Sparkles:**
   - Lightweight canvas particle burst on correct streak and slide completion.
3. **Mastery Badges & Inspirational Epigraphs:**
   - Subtle Persian poetic micro-quotes in header/footer (سعدی: *«مروّت کارمای مردمان است»*، حافظ: *«در ره عشق نشد کس به یقین گمراهی»*).
   - Dynamic mastery progress ring per part.
4. **Subject Pill Glows & Category Palette:**
   - Persian: Radiant warm saffron `#F59E0B`
   - Arabic: Deep royal cobalt `#2563EB`
   - Dini: Luminous emerald `#059669`
   - Health: Rose coral `#E11D48`
   - Biology: Fresh mint & jade `#10B981`
   - Chemistry: Electric violet & indigo `#7C3AED`
   - Physics: Neon cyan `#0284C7`

---

## 4. Verification & Browser Inspection
- Automated Python unit tests verifying all 6 new courses and their EUs.
- Full API integration tests.
- Frontend build validation (`npm run build`).
- `agent-browser` autonomous inspection of the dev server:
  - Take desktop screenshot of the library with all glowing filters.
  - Test course navigation and answer interactive slide.
  - Inspect console for 0 errors.
