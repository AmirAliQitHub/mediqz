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
