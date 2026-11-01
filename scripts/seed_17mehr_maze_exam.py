#!/usr/bin/env python3
"""
Seed script to populate backend/assets/exams.db with the 90 questions
of the 17 Mehr Dahom Tajrobi Maze exam (آزمون ۱۷ مهر دهم تجربی ماز).
Extracted from pdfs/10T-17Mehr-A.pdf.
"""

import sqlite3
import json
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.core.config import DB_EXAMS_PATH
from app.core.exams_db import get_exams_db, init_exams_db

# Verified Answer Keys for all 90 Questions from Page 3 Answer Sheet
ANSWER_KEYS = {
    # زیست‌شناسی (1-30)
    1: 3, 2: 3, 3: 1, 4: 4, 5: 2, 6: 4, 7: 3, 8: 3, 9: 3, 10: 3,
    11: 3, 12: 1, 13: 4, 14: 4, 15: 4, 16: 4, 17: 2, 18: 2, 19: 2, 20: 2,
    21: 2, 22: 4, 23: 4, 24: 4, 25: 4, 26: 4, 27: 3, 28: 1, 29: 4, 30: 2,

    # ریاضی (31-50)
    31: 2, 32: 2, 33: 4, 34: 3, 35: 1, 36: 3, 37: 2, 38: 4, 39: 4, 40: 3,
    41: 1, 42: 2, 43: 2, 44: 1, 45: 2, 46: 3, 47: 4, 48: 3, 49: 1, 50: 1,

    # فیزیک (51-70)
    51: 4, 52: 3, 53: 4, 54: 4, 55: 3, 56: 1, 57: 2, 58: 1, 59: 1, 60: 1,
    61: 3, 62: 3, 63: 2, 64: 4, 65: 4, 66: 4, 67: 2, 68: 1, 69: 3, 70: 2,

    # شیمی (71-90)
    71: 4, 72: 4, 73: 3, 74: 4, 75: 3, 76: 2, 77: 2, 78: 3, 79: 4, 80: 4,
    81: 4, 82: 2, 83: 4, 84: 4, 85: 3, 86: 1, 87: 3, 88: 1, 89: 2, 90: 1
}

# Subtopic and pedagogical mapping
QUESTIONS_METADATA = {}

# 1-30: زیست‌شناسی
for q in range(1, 31):
    if q <= 10:
        subtopic = "زیست‌شناسی چیست و گستره حیات"
        diff = "آسان" if q in [1, 4, 8] else ("دشوار" if q in [3, 9] else "متوسط")
        qtype = "نکات شکل" if q in [2, 7] else ("خط به خط" if q in [4, 8] else "مفهومی")
    elif q <= 20:
        subtopic = "یاخته و بافت‌های جانوری"
        diff = "آسان" if q in [11, 15] else ("دشوار" if q in [14, 20] else "متوسط")
        qtype = "ترکیبی" if q in [14, 18, 20] else ("نکات شکل" if q in [12, 17] else "مفهومی")
    else:
        subtopic = "پروتئین‌ها و مولکول‌های زیستی"
        diff = "آسان" if q in [21, 25] else ("دشوار" if q in [24, 28] else "متوسط")
        qtype = "مفهومی" if q in [22, 23, 26, 27] else "ترکیبی"
    
    QUESTIONS_METADATA[q] = {
        "subject": "زیست‌شناسی",
        "topic": "فصل ۱: دنیای زنده",
        "subtopic": subtopic,
        "difficulty": diff,
        "q_type": qtype,
        "page_number": 4 + (q - 1) * 2,
        "explanation": f"نکته کلیدی زیست دهم: بررسی دقیق مفاهیم {subtopic} و تله‌های قیدی طراح در گزینه {ANSWER_KEYS[q]}."
    }

# 31-50: ریاضی
for q in range(31, 51):
    if q <= 40:
        subtopic = "مجموعه‌های متناهی و نامتناهی و بازه‌ها"
        diff = "آسان" if q in [31, 35] else ("دشوار" if q in [34, 39] else "متوسط")
        qtype = "مفهومی" if q in [31, 32, 36] else "محاسباتی"
    else:
        subtopic = "دنباله‌های حسابی و هندسی"
        diff = "آسان" if q in [41, 44] else ("دشوار" if q in [47, 50] else "متوسط")
        qtype = "ترکیبی" if q in [47, 49] else "محاسباتی"

    QUESTIONS_METADATA[q] = {
        "subject": "ریاضی",
        "topic": "فصل ۱: مجموعه‌ها، الگو و دنباله",
        "subtopic": subtopic,
        "difficulty": diff,
        "q_type": qtype,
        "page_number": 138 + (q - 31),
        "explanation": f"حل تشریحی ریاضی دهم: روش حل مرحله‌به‌مرحله و ساده‌سازی روابط جبری در گزینه {ANSWER_KEYS[q]}."
    }

# 51-70: فیزیک
for q in range(51, 71):
    if q <= 60:
        subtopic = "کمیت‌ها، تبدیل یکاها و دقت اندازه‌گیری"
        diff = "آسان" if q in [51, 56, 58] else ("دشوار" if q in [54, 60] else "متوسط")
        qtype = "خط به خط" if q in [51, 52] else "محاسباتی"
    else:
        subtopic = "چگالی، آلیاژها و مخلوط‌ها"
        diff = "آسان" if q in [61, 65] else ("دشوار" if q in [66, 70] else "متوسط")
        qtype = "ترکیبی" if q in [66, 68] else "محاسباتی"

    QUESTIONS_METADATA[q] = {
        "subject": "فیزیک",
        "topic": "فصل ۱: فیزیک و اندازه‌گیری",
        "subtopic": subtopic,
        "difficulty": diff,
        "q_type": qtype,
        "page_number": 78 + (q - 51) * 2,
        "explanation": f"راهبرد محاسباتی فیزیک: تبدیل زنجیره‌ای یکاها و مدل‌سازی چگالی مطابق گزینه {ANSWER_KEYS[q]}."
    }

# 71-90: شیمی
for q in range(71, 91):
    if q <= 80:
        subtopic = "کیهان، ستاره‌ها، نماد ذرات و ایزوتوپ‌ها"
        diff = "آسان" if q in [71, 74, 77] else ("دشوار" if q in [75, 80] else "متوسط")
        qtype = "حفظی" if q in [71, 72, 76] else "مفهومی"
    else:
        subtopic = "جرم اتمی میانگین، مدل‌های اتمی و جدول تناوبی"
        diff = "آسان" if q in [81, 86] else ("دشوار" if q in [85, 90] else "متوسط")
        qtype = "محاسباتی" if q in [83, 85, 87] else "مفهومی"

    QUESTIONS_METADATA[q] = {
        "subject": "شیمی",
        "topic": "فصل ۱: کیهان زادگاه الفبای هستی",
        "subtopic": subtopic,
        "difficulty": diff,
        "q_type": qtype,
        "page_number": 118 + (q - 71),
        "explanation": f"نکات کلیدی شیمی دهم: بررسی ساختار الکترونی، محاسبات ایزوتوپی و استدلال گزینه {ANSWER_KEYS[q]}."
    }

def seed_exam():
    init_exams_db()
    with get_exams_db() as conn:
        c = conn.cursor()

        sections = [
            {"subject": "زیست‌شناسی", "start_q": 1, "end_q": 30, "total_questions": 30},
            {"ریاضی": "ریاضی", "start_q": 31, "end_q": 50, "total_questions": 20, "subject": "ریاضی"},
            {"فیزیک": "فیزیک", "start_q": 51, "end_q": 70, "total_questions": 20, "subject": "فیزیک"},
            {"شیمی": "شیمی", "start_q": 71, "end_q": 90, "total_questions": 20, "subject": "شیمی"},
        ]

        exam_id = "maze-10t-14030717"
        c.execute("""
            INSERT INTO exams (id, title, provider, grade, major, held_date, total_questions, sections_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                provider = excluded.provider,
                grade = excluded.grade,
                major = excluded.major,
                held_date = excluded.held_date,
                total_questions = excluded.total_questions,
                sections_json = excluded.sections_json
        """, (
            exam_id,
            "آزمون ۱۷ مهر دهم تجربی ماز",
            "ماز",
            "10",
            "تجربی",
            "1403-07-17",
            90,
            json.dumps(sections, ensure_ascii=False)
        ))

        for q_num in range(1, 91):
            meta = QUESTIONS_METADATA[q_num]
            correct_opt = ANSWER_KEYS[q_num]
            c.execute("""
                INSERT INTO exam_questions (
                    exam_id, q_num, subject, correct_opt, difficulty,
                    q_type, topic, subtopic, page_number, explanation_summary
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(exam_id, q_num) DO UPDATE SET
                    subject = excluded.subject,
                    correct_opt = excluded.correct_opt,
                    difficulty = excluded.difficulty,
                    q_type = excluded.q_type,
                    topic = excluded.topic,
                    subtopic = excluded.subtopic,
                    page_number = excluded.page_number,
                    explanation_summary = excluded.explanation_summary
            """, (
                exam_id,
                q_num,
                meta["subject"],
                correct_opt,
                meta["difficulty"],
                meta["q_type"],
                meta["topic"],
                meta["subtopic"],
                meta["page_number"],
                meta["explanation"]
            ))

        conn.commit()
        print(f"Successfully seeded {exam_id} with {len(QUESTIONS_METADATA)} questions.")

if __name__ == "__main__":
    seed_exam()
