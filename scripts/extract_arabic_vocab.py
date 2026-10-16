"""
Arabic Vocabulary and Footnote Extraction Engine
Extracts vocabulary from 'المعجم' tables, footnotes ('پاورقی'),
and sub-defined terms (synonyms, antonyms, singular/plural pairs).
"""

import re
from typing import List, Dict, Any, Optional

def clean_arabic_text(text: str) -> str:
    """Strips tatweel, extra spaces, and normalizes Arabic/Persian presentation forms."""
    if not text:
        return ""
    # Strip tatweel/kashida
    t = re.sub(r'[\u0640]', '', text)
    # Strip left-to-right / right-to-left marks
    t = re.sub(r'[\u200e\u200f\u202a-\u202e]', '', t)
    # Normalize multiple spaces
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def strip_diacritics(text: str) -> str:
    """Removes Arabic harakat / diacritics."""
    return re.sub(r'[\u064B-\u065F\u0670]', '', text)

def normalize_for_lookup(text: str) -> str:
    t = strip_diacritics(clean_arabic_text(text))
    t = t.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    t = t.replace('ة', 'ه').replace('ي', 'ی').replace('ك', 'ک')
    t = re.sub(r'[\(\)\[\]«»\{\}:،,؛;!\?\.]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

KNOWN_ANTONYMS = {
    "اَلسِّلْم": "صلح، آشتی، صلح و سازش (متضادِ کشمکش و جنگ)",
    "اَلصِّغار": "خردسالان، کوچکان، بچه‌ها (مفرد: اَلصَّغير / متضادِ اَلْکِبار)",
}

KNOWN_SYNONYMS = {
    "اَلنِّزاع": "نزاع، کشمکش، دعوا، ستیز و درگیری",
    "يَقْدِرُ": "می‌تواند، توانایی دارد (مترادفِ يَسْتَطيعُ)",
}

def parse_mojam_entry(entry_text: str) -> List[Dict[str, Any]]:
    """
    Parses a single المعجم entry text which might contain:
    - Main word and meaning
    - Synonyms (=) and antonyms (≠)
    - Singulars («مفرد: ...») and plurals («جمع: ...»)
    """
    entry_text = clean_arabic_text(entry_text)
    if not entry_text or ":" not in entry_text:
        return []

    parts = entry_text.split(":", 1)
    raw_word = clean_arabic_text(parts[0])
    raw_desc = clean_arabic_text(parts[1])

    # Clean leading dash or bullets
    raw_word = re.sub(r'^[—\-_•\*\d\.\s]+', '', raw_word).strip()

    entries: List[Dict[str, Any]] = []

    # 1. Main entry
    # Extract base meaning before any extra annotations if possible
    main_meaning = raw_desc
    # Remove trailing exercise markings if any
    main_meaning = re.sub(r'\s*[\u2700-\u27BF\uE000-\uF8FF\uf03f\uf070\uf071\u2713\u2717\u2714\u2718\uF050\uF04F]+.*$', '', main_meaning).strip()

    entries.append({
        "word": raw_word,
        "full_meaning": main_meaning,
        "source": "mojam"
    })

    # 2. Check for singular / plural sub-definitions
    # Pattern: «جمع: ...» or (جمع: ...)
    plural_match = re.search(r'[«\(\[]\s*جمع\s*:\s*([^»\)\]]+)[»\)\]]', raw_desc)
    if plural_match:
        plural_word = clean_arabic_text(plural_match.group(1))
        # Derive plural meaning
        # e.g., تبر -> تبرها
        base_clean = re.sub(r'[«\(\[].*?[»\)\]]', '', main_meaning).strip()
        base_clean = re.sub(r'[:،,].*$', '', base_clean).strip()
        plural_meaning = f"{base_clean}ها (جمعِ {raw_word})" if not base_clean.endswith("ها") else f"{base_clean} (جمعِ {raw_word})"
        entries.append({
            "word": plural_word,
            "full_meaning": plural_meaning,
            "source": "mojam_subdef_plural"
        })

    # Pattern: «مفرد: ...» or (مفرد: ...)
    singular_match = re.search(r'[«\(\[]\s*مفرد\s*:\s*([^»\)\]]+)[»\)\]]', raw_desc)
    if singular_match:
        singular_word = clean_arabic_text(singular_match.group(1))
        # Derive singular meaning from plural
        # e.g., بت‌ها -> بت
        base_clean = re.sub(r'[«\(\[].*?[»\)\]]', '', main_meaning).strip()
        first_meaning = re.split(r'[:،,]', base_clean)[0].strip()
        if first_meaning.endswith("ها"):
            sing_meaning = first_meaning[:-2] + f" (مفردِ {raw_word})"
        elif first_meaning.endswith("ان"):
            sing_meaning = first_meaning[:-2] + f" (مفردِ {raw_word})"
        else:
            sing_meaning = f"مفردِ {raw_word} ({first_meaning})"
        entries.append({
            "word": singular_word,
            "full_meaning": sing_meaning,
            "source": "mojam_subdef_singular"
        })

    # 3. Check for Antonyms (≠)
    antonym_match = re.search(r'≠\s*([^«»\(\)\[\]،,\s]+)', raw_desc)
    if antonym_match:
        antonym_word = clean_arabic_text(antonym_match.group(1))
        custom_meaning = KNOWN_ANTONYMS.get(antonym_word)
        if not custom_meaning:
            custom_meaning = f"متضادِ {raw_word}"
        entries.append({
            "word": antonym_word,
            "full_meaning": custom_meaning,
            "source": "mojam_subdef_antonym"
        })

    # 4. Check for Synonyms (=)
    synonym_match = re.search(r'=\s*([^«»\(\)\[\]،,≠\s]+)', raw_desc)
    if synonym_match:
        synonym_word = clean_arabic_text(synonym_match.group(1))
        custom_meaning = KNOWN_SYNONYMS.get(synonym_word)
        if not custom_meaning:
            custom_meaning = f"{main_meaning.split('=')[0].strip()} (مترادفِ {raw_word})"
        entries.append({
            "word": synonym_word,
            "full_meaning": custom_meaning,
            "source": "mojam_subdef_synonym"
        })

    return entries

def parse_footnote_line(line: str) -> List[Dict[str, Any]]:
    """
    Parses a footnote line which may contain one or multiple footnotes.
    Example:
      "ــ أَنْ أُسافِرَ: که سفر کنم4   ــ مَطار: فرودگاه3   ــ قاعَة: سالن2   ــ تَعارُف: آشنايی1"
      "١ـ لا شَعْبَ مِنْ شُعوبِ الْأَرضِ: هیچ ملّتی از ملّت‌های زمین نیست. ..."
    """
    if not line or ":" not in line:
        return []

    # Normalize various dash/separator characters before stripping tatweel
    norm_line = re.sub(r'[\u2014\u2015\u2013]', ' --- ', line)
    norm_line = re.sub(r'[\u0640]{2,}', ' --- ', norm_line)
    norm_line = re.sub(r'\s*[\u0640]*[-–—ـ]+\s*', ' --- ', norm_line)

    # Split on our standard separator ' --- '
    raw_segments = [s.strip() for s in norm_line.split(' --- ') if s.strip()]

    # Also handle multiple items separated by large whitespace or numbered dots e.g. "2."
    segments = []
    for s in raw_segments:
        if s.count(":") > 1:
            # Further split by large whitespace (>= 3 spaces) if each has ':'
            sub_segs = re.split(r'\s{3,}', s)
            if len(sub_segs) > 1 and all(":" in sub for sub in sub_segs):
                segments.extend(sub_segs)
            else:
                segments.append(s)
        else:
            segments.append(s)

    entries: List[Dict[str, Any]] = []

    for seg in segments:
        # Remove footnote numbers e.g. "١ـ", "1-", "ـ1", "ـ١", etc.
        seg = re.sub(r'^[١-٩1-9]+[\-ـ\.\s]+', '', seg).strip()
        seg = re.sub(r'^[ـ—\-]+', '', seg).strip()
        if ":" not in seg:
            continue

        parts = seg.split(":", 1)
        word_part = clean_arabic_text(parts[0]).strip()
        meaning_part = clean_arabic_text(parts[1]).strip()

        # Clean trailing footnote numbers from meaning, e.g. "آشنایی1" -> "آشنایی"
        meaning_part = re.sub(r'[\d١-٩]+$', '', meaning_part).strip()
        # Clean trailing dot
        meaning_part = re.sub(r'^\.+|\.+$', '', meaning_part).strip()

        # Clean word part from leading/trailing numbers
        word_part = re.sub(r'[\d١-٩]+$', '', word_part).strip()
        word_part = re.sub(r'^[\d١-٩]+[\.\-ـ]\s*', '', word_part).strip()

        # If there are sub-clauses in sentence translation footnotes:
        # e.g. "لا شَعْبَ مِنْ شُعوبِ الْأَرضِ: هیچ ملّتی... إِلاّ وَ کانَ لَهُ دينٌ: مگر اینکه..."
        # Check if meaning_part contains another ": "
        if ":" in meaning_part:
            sub_parts = meaning_part.split(":", 1)
            # sub_parts[0] might contain the next Arabic phrase at the end
            # e.g. "هیچ ملتی از ملتهای زمین نیست. إِلاّ وَ کانَ لَهُ دينٌ"
            # Let's extract the main entry first
            sub_ar_match = re.search(r'([\u0600-\u06FF\s]+)$', sub_parts[0])
            if sub_ar_match and len(sub_ar_match.group(1).strip()) > 3:
                first_meaning = sub_parts[0][:sub_ar_match.start()].strip()
                second_word = sub_ar_match.group(1).strip()
                second_meaning = sub_parts[1].strip()

                entries.append({
                    "word": word_part,
                    "full_meaning": first_meaning,
                    "source": "footnote"
                })
                entries.append({
                    "word": second_word,
                    "full_meaning": second_meaning,
                    "source": "footnote"
                })
                continue

        if word_part and meaning_part:
            entries.append({
                "word": word_part,
                "full_meaning": meaning_part,
                "source": "footnote"
            })

    return entries

STOP_WORDS = {
    "کرد", "شد", "بود", "گشت", "گردید", "داد", "داشت", "یک", "از", "به", "با", "در", "بر",
    "که", "تا", "این", "آن", "من", "تو", "او", "ما", "شما", "آنها", "آنان", "ایشان",
    "برای", "چون", "یا", "و", "نه", "نیز", "هم", "است", "هست", "نیست", "پس", "اگر",
    "مگر", "هر", "همه", "هیچ", "چند", "چه", "چرا", "کجا", "کی", "را"
}

DISTRACTOR_TEXTS = [
    "امروز هوا بسیار سرد بود و من به مدرسه رفتم و تکالیفم را انجام دادم و کار کردم",
    "کتاب را بر روی میز گذاشت و به سمت در حرکت کرد و گفت سلام",
    "او یک دانش آموز بسیار کوشا در کلاس بود که همیشه درس می خواند",
]

# Curated synonym expansions for textbook words
CURATED_SYNONYMS = {
    "أَحْضَرَ": ["آورد", "حاضر کرد", "حاضر ساخت", "آوردن", "حاضر کردن"],
    "أَقِمْ وَجْهَكَ": ["روی بیاور", "روی آور", "رو کن", "متوجه شو", "توجه کن"],
    "بَدَؤوا يَتَهامَسُونَ": ["شروع به پچ پچ کردند", "شروع به پچ‌پچ کردند", "پچ پچ کردند", "پچ‌پچ کردند", "نجوا کردند", "پچ پچ", "پچ‌پچ", "نجوا"],
    "اَلتَّجَنُّب": ["دوری کردن", "پرهیز کردن", "دوری", "پرهیز", "اجتناب", "اجتناب کردن"],
    "حَرَّقَ": ["سوزاند", "به آتش کشید", "سوزانید", "سوزاندن"],
    "اَلْحَنيف": ["یکتاپرست", "یکتا پرست", "موحد", "حق گرا", "حق‌گرا"],
    "اَلسُّدى": ["بیهوده", "پوچ", "بیهوده و پوچ", "رها شده", "باطل"],
    "اَلسّيرَة": ["روش و کردار", "کردار", "سرگذشت", "روش", "رفتار"],
    "اَلشَّعائِر": ["مراسم", "آیین ها", "آیین‌ها", "مناسک", "مناسک دینی", "شعائر"],
    "اَلصِّراع": ["کشمکش", "ستیز", "نزاع", "درگیری", "دعوا"],
    "اَلنِّزاع": ["نزاع", "کشمکش", "دعوا", "ستیز", "درگیری"],
    "اَلسِّلْم": ["صلح", "آشتی", "سازش", "صلح و سازش", "آرامش"],
    "عَلَّقَ": ["آویخت", "آویزان کرد", "آویختن", "آویزان کردن"],
    "اَلْفَأْس": ["تبر"],
    "اَلْفُؤوس": ["تبرها", "تبر ها"],
    "اَلْقَرابين": ["قربانی ها", "قربانی‌ها"],
    "اَلْقُرْبان": ["قربانی"],
    "اَلْكَتِف": ["شانه", "دوش"],
    "اَلْكِتْف": ["شانه", "دوش"],
    "اَأْلَكْتاف": ["شانه ها", "شانه‌ها", "دوش‌ها"],
    "كَسَّرَ": ["شکست", "خرد کرد", "شکستن"],
    "اَلنُّقوش": ["کنده کاری ها", "کنده‌کاری‌ها", "نگاره ها", "نگاره‌ها", "نقش ها", "نقش‌ها"],
    "اَلنَّقْش": ["کنده کاری", "کنده‌کاری", "نگاره", "نقش"],
    "اَأْلَصْنام": ["بت ها", "بت‌ها"],
    "اَلصَّنَم": ["بت"],
    "آلَمَ": ["به درد آورد", "درد آورد", "به درد آوردن"],
    "اِشْتاقَ": ["مشتاق شد", "اشتیاق پیدا کرد", "مشتاق شدن"],
    "تَعَبَّدَ": ["عبادت کرد", "پرستش کرد", "عبادت کردن"],
    "اَلتِّلْفاز": ["تلویزیون"],
    "اَلْخِيام": ["چادرها", "چادر ها", "خیمه‌ها", "خیمه ها"],
    "اَلْخَيْمَة": ["چادر", "خیمه"],
    "اَلرِّجْل": ["پا"],
    "اَأْلَرْجُل": ["پاها", "پا ها"],
    "رَمْيُ الْجَمَراتِ": ["پرتاب ریگ ها", "پرتاب ریگ‌ها", "انداختن سنگریزه ها", "رمی جمرات"],
    "زارَ": ["دیدار کرد", "زیارت کرد", "ملاقات کرد", "دیدن کرد"],
    "اَلسَّعْي": ["دویدن", "تلاش", "کوشش", "دویدن و تلاش"],
    "اَلْقِمَّة": ["قله", "نوک کوه"],
    "اَلْقِمَم": ["قله ها", "قله‌ها"],
    "لَجَأَ إلیٰ": ["پناه برد", "پناه برد به", "پناه آورد"],
    "مَرَّ": ["گذر کرد", "عبور کرد", "گذشت"],
    "اَلْمَشْهَد": ["صحنه", "نمایش", "محل شهادت"],
    "أَضافَ": ["افزود", "اضافه کرد", "افزودن"],
    "أَغْنى": ["بی نیاز گردانید", "بی نیاز کرد", "توانگر ساخت"],
    "اَأْلَمْتَع": ["لذت بخش ترین", "لذت‌بخش‌ترین", "لذت بخش تر", "لذت‌بخش‌تر"],
    "اَلتَّحْديد": ["محدود کردن", "معین کردن", "تعیین مرز"],
    "تَصَفَّحَ": ["ورق زد", "سریع مطالعه کرد", "ورق زدن"],
    "اَلثّانَوِيَّة": ["دبیرستان"],
    "اَلْجَدير": ["شایسته", "سزاوار", "لایق"],
    "اَلصَّحَفِيّ": ["روزنامه نگار", "روزنامه‌نگار", "خبرنگار"],
    "اَلظُّروف": ["شرایط", "اوضاع", "وضعیت ها", "موقعیت ها"],
    "اَلظَّرْف": ["شرط", "موقعیت", "اوضاع", "ظرف"],
    "اَلْقاسي": ["سخت", "دشوار", "سخت و دشوار", "سنگدل"],
    "اَلْكُتّاب": ["نویسندگان", "نویسنده ها", "نویسنده‌ها"],
    "اَلْكاتِب": ["نویسنده"],
    "اَلْمُفَكِّر": ["اندیشمند", "متفکر"],
    "نَشَأَ": ["پرورش یافت", "رشد کرد", "بزرگ شد", "رویید"],
    "اَلْواثِق": ["مطمئن", "اطمینان دارنده", "با اطمینان"],
    "هُناكَ": ["وجود دارد", "آنجا", "موجود است"],
    "يُقالُ": ["گفته می شود", "گفته می‌شود"],
    "إِذْ جاءَ": ["ناگهان آمد", "وقتی آمد"],
    "اِسْتَلَمَ الْحَجَرَ": ["سنگ را مسح کرد", "سنگ را لمس کرد"],
    "أَنْكَرَ": ["ناشناخته شمرد", "انکار کرد"],
    "اَلْبَطْحاء": ["دشت مکه", "سرزمین مکه"],
    "بَيْنَما": ["در حالی که", "در این میان"],
    "اَلتَّقِيّ": ["پرهیزگار", "با تقوا", "پرهیزکار"],
    "جَهَرَ بِـ": ["آشکار کرد", "آشکار ساخت", "بلند گفت"],
    "اَلْحِلّ": ["بیرون احرام", "حلال"],
    "رَحَلَ": ["کوچ کرد", "سفر کرد"],
    "رَغِبَ فيهِ": ["علاقمند شد", "علاقه مند شد", "مایل شد"],
    "اَلضّائِر": ["زیان رساننده", "زیان رسان", "زیان آور"],
    "طافَ": ["طواف کرد", "چرخید", "گردیدن", "دور زد"],
    "اَلْعُرْب": ["عرب"],
    "اَلْعَلَم": ["بزرگتر قوم", "بزرگ تر قوم", "پرچم", "نشانه"],
    "اَلْكِبار": ["بزرگان", "بزرگ ترها", "بزرگ‌ترها"],
    "اَلصِّغار": ["خردسالان", "کودکان", "کوچکان", "بچه‌ها"],
    "مَدَحَ": ["ستود", "مدح کرد", "تعریف کرد"],
    "نَصَبَ": ["برپا کرد", "نصب کرد", "افراشت"],
    "اَلنَّقِيّ": ["پاک و خالص", "پاک", "خالص"],
    "اَلْوَطْأَة": ["جای پا", "گام", "قدم"],
}

def clean_persian_token(token: str) -> str:
    """Cleans punctuation, quotes, brackets from a Persian token."""
    t = re.sub(r'[«»\(\)\[\]\{\}\.:،,؛;!\?\'"ـ\-_]', '', token)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def generate_keywords(word: str, meaning: str) -> List[str]:
    """
    Generates high-precision trigger keywords for an Arabic word based on its Persian meaning.
    Strictly excludes stop words and overly broad phrases.
    """
    word_norm = clean_arabic_text(word)
    # Check if curated synonyms exist
    if word_norm in CURATED_SYNONYMS:
        return list(CURATED_SYNONYMS[word_norm])
    for k, v in CURATED_SYNONYMS.items():
        if strip_diacritics(k) == strip_diacritics(word_norm):
            return list(v)

    # Clean description from parenthetical notes
    raw = clean_arabic_text(meaning)
    raw = re.sub(r'[«\(\[].*?[»\)\]]', '', raw)
    raw = re.sub(r'[\u2700-\u27BF\uE000-\uF8FF\uf03f\uf070\uf071\u2713\u2717\u2714\u2718\uF050\uF04F]+', '', raw)

    keywords: List[str] = []

    # Split by commas, semicolons, slashes
    parts = re.split(r'[:،,؛;/\n\t]|(?:\s+یا\s+)', raw)
    for p in parts:
        cleaned = clean_persian_token(p)
        if not cleaned:
            continue

        # If it's a stop word, skip
        if cleaned in STOP_WORDS:
            continue

        # Add the cleaned phrase
        if len(cleaned) >= 2 and cleaned not in STOP_WORDS:
            keywords.append(cleaned)

        # Handle compound verbs
        for aux, inf in [
            (" کرد", " کردن"),
            (" نمود", " نمودن"),
            (" ساخت", " ساختن"),
            (" شد", " شدن"),
            (" گردید", " گردیدن"),
            (" گشت", " گشتن"),
            (" داد", " دادن"),
            (" یافت", " یافتن"),
            (" داشت", " داشتن"),
        ]:
            if cleaned.endswith(aux):
                base = cleaned[:-len(aux)].strip()
                # add infinitive
                keywords.append(base + inf)
                # add alternative auxiliary if applicable
                if aux in [" کرد", " نمود", " ساخت"]:
                    keywords.append(base + " کرد")
                    keywords.append(base + " ساخت")
                elif aux in [" شد", " گردید", " گشت"]:
                    keywords.append(base + " شد")
                    keywords.append(base + " گردید")

        # Handle simple verbs e.g. "آورد" -> "آوردن", "آویخت" -> "آویختن", "شکست" -> "شکستن"
        if cleaned.endswith("ت") or cleaned.endswith("د"):
            # Potential past stem -> add infinitive
            inf = cleaned + "ن"
            if len(inf) >= 4 and inf not in STOP_WORDS:
                keywords.append(inf)

        # Handle ZWNJ / space variants
        if "\u200c" in p:
            with_space = p.replace("\u200c", " ")
            without = p.replace("\u200c", "")
            for v in [with_space, without]:
                cv = clean_persian_token(v)
                if cv and cv not in STOP_WORDS and len(cv) >= 2:
                    keywords.append(cv)
        elif " " in cleaned:
            with_zwnj = cleaned.replace(" ", "\u200c")
            keywords.append(with_zwnj)

    # Post-filtering: strict deduplication and removal of any stop words
    filtered: List[str] = []
    seen = set()
    for kw in keywords:
        kw_clean = kw.strip()
        if not kw_clean or kw_clean in STOP_WORDS:
            continue
        if len(kw_clean) < 2:
            continue
        # Never allow standalone generic verbs
        if kw_clean in {"کرد", "شد", "بود", "گشت", "گردید", "داد", "داشت", "یک", "از", "به", "با", "در"}:
            continue
        if kw_clean not in seen:
            seen.add(kw_clean)
            filtered.append(kw_clean)

    return filtered

def validate_keywords_against_distractors(keywords: List[str]) -> bool:
    """
    Verifies that no keyword is a stop-word or triggers false matches against unrelated distractor sentences.
    """
    for kw in keywords:
        if kw in STOP_WORDS:
            return False
        if len(kw) < 2:
            return False
        # Ensure it doesn't match standard distractors unless the distractor actually contains that word
        for distractor in DISTRACTOR_TEXTS:
            if kw in distractor:
                # If a keyword like "رفتم" or "درس" was accidentally generated
                if kw in {"امروز", "هوا", "سرد", "من", "مدرسه", "رفت", "رفتم", "کار", "کتاب", "میز", "گفت", "سلام", "درس", "خواند"}:
                    return False
    return True

