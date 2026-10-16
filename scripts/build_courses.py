"""
Master Course Builder for Iranian High School Arabic Textbooks (Grades 10, 11, 12).
Builds complete, verified CourseBox courses with all المعجم words, footnotes (پاورقی),
and sub-defined terms.
"""

import json
from pathlib import Path
import sys

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.extract_arabic_vocab import (
    clean_arabic_text,
    generate_keywords,
    validate_keywords_against_distractors,
    STOP_WORDS
)
from scripts.courses_data import (
    GRADE_10_PARTS,
    GRADE_11_PARTS,
    GRADE_12_PARTS
)

COURSES_DIR = Path("backend/assets/courses")

def make_eu(cid_prefix: str, part_num: int, order: int, topic_tag: str, word: str, meaning: str, sentence: str, extra_kws: list = None) -> dict:
    word_clean = clean_arabic_text(word)
    meaning_clean = clean_arabic_text(meaning)
    sentence_clean = clean_arabic_text(sentence)

    kws = generate_keywords(word_clean, meaning_clean)
    if extra_kws:
        for ek in extra_kws:
            ek_clean = ek.strip()
            if ek_clean and ek_clean not in kws:
                kws.append(ek_clean)

    # Validate
    assert len(kws) > 0, f"Empty keywords for {word_clean}"
    allowed_literal_stopword_words = [
        "ذاكَ", "ذا", "هُناكَ", "ذٰلِكَ", "هٰذا",
        "أَصْبَحَ", "صارَ", "كانَ", "لَيْسَ", "لا"
    ]
    for kw in kws:
        if kw in STOP_WORDS:
            assert word_clean in allowed_literal_stopword_words, f"Stopword '{kw}' found in {word_clean}"

    return {
        "id": f"{cid_prefix}-P{part_num}-FITB-{order}",
        "type": "fill_in_the_blank",
        "order": order,
        "topic_tag": topic_tag,
        "payload": {
            "word": word_clean,
            "sentence": sentence_clean,
            "prompt": f"معنی یا معادل واژه «{word_clean}» را بنویسید:",
            "full_meaning": meaning_clean,
            "target_word": word_clean,
            "keywords": kws
        }
    }

def build_course(cid: str, title: str, topic_code: str, grade: str, desc: str, raw_parts: list) -> dict:
    parts = []
    total_eus = 0
    for p_idx, p_data in enumerate(raw_parts):
        part_num = p_idx + 1
        part_id = f"p{part_num}"
        part_title = p_data["title"]
        topic_tag = p_data.get("topic_tag", f"الدرس {part_num}")
        eus = []
        for eu_idx, item in enumerate(p_data["items"]):
            word, meaning, sentence = item[0], item[1], item[2]
            extra_kws = item[3] if len(item) > 3 else None
            eu = make_eu(
                cid_prefix=topic_code,
                part_num=part_num,
                order=eu_idx + 1,
                topic_tag=topic_tag,
                word=word,
                meaning=meaning,
                sentence=sentence,
                extra_kws=extra_kws
            )
            eus.append(eu)
        parts.append({
            "part_id": part_id,
            "title": part_title,
            "description": f"واژگان المعجم، پاورقی‌ها و اصطلاحات کلیدی {topic_tag}",
            "order": part_num,
            "eus": eus
        })
        total_eus += len(eus)

    print(f"Generated {cid}: {len(parts)} parts, {total_eus} EUs.")
    return {
        "course_id": cid,
        "title": title,
        "topic_code": topic_code,
        "subject": "عربی",
        "grade": grade,
        "version": "2.0",
        "description": desc,
        "parts": parts
    }

def main():
    COURSES_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Grade 10 Course
    g10 = build_course(
        cid="arabic10_vocab",
        title="لغت‌نامه هوشمند عربی زبان قرآن (۱) دهم",
        topic_code="AR10",
        grade="10",
        desc="فلش‌کارت‌ها و کوئیزهای جای‌خالی هوشمند واژگان و پاورقی‌های کتاب درسی عربی پایه دهم به تفکیک درس‌ها همراه با تطبیق کلیدواژه",
        raw_parts=GRADE_10_PARTS
    )
    with open(COURSES_DIR / "arabic10_vocab.json", "w", encoding="utf-8") as f:
        json.dump(g10, f, ensure_ascii=False, indent=2)

    # 2. Grade 11 Course
    g11 = build_course(
        cid="arabic11_vocab",
        title="لغت‌نامه هوشمند عربی زبان قرآن (۲) یازدهم",
        topic_code="AR11",
        grade="11",
        desc="فلش‌کارت‌ها و کوئیزهای جای‌خالی هوشمند واژگان و پاورقی‌های کتاب درسی عربی پایه یازدهم به تفکیک درس‌ها همراه با تطبیق کلیدواژه",
        raw_parts=GRADE_11_PARTS
    )
    with open(COURSES_DIR / "arabic11_vocab.json", "w", encoding="utf-8") as f:
        json.dump(g11, f, ensure_ascii=False, indent=2)

    # 3. Grade 12 Course
    g12 = build_course(
        cid="arabic12_vocab",
        title="لغت‌نامه هوشمند عربی زبان قرآن (۳) دوازدهم",
        topic_code="AR12",
        grade="12",
        desc="فلش‌کارت‌ها و کوئیزهای جای‌خالی هوشمند واژگان و پاورقی‌های کتاب درسی عربی پایه دوازدهم به تفکیک درس‌ها همراه با تطبیق کلیدواژه",
        raw_parts=GRADE_12_PARTS
    )
    with open(COURSES_DIR / "arabic12_vocab.json", "w", encoding="utf-8") as f:
        json.dump(g12, f, ensure_ascii=False, indent=2)

    print("All courses generated successfully in", COURSES_DIR)

if __name__ == "__main__":
    main()
