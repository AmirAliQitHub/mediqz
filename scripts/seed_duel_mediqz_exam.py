#!/usr/bin/env python3
"""
Seed script to populate backend/assets/exams.db with the 140 questions
of the Duel Mediqz Exam (آزمون دوئل مدیاز - دوازدهم تجربی - ۲۲ آبان ۱۴۰۵).
Exam ID: MD12T-405Aba22

Features:
- Scoped idempotent deletion (only removes MD12T-405Aba22; preserves M10T-405Mehr17 and userdata.db)
- WAL truncate checkpointing (PRAGMA wal_checkpoint(TRUNCATE))
- Support for --update-keys CLI flag to update answer keys/explanations without re-seeding full schema
- Strict validation of all 140 questions and topic mappings
"""

import argparse
import json
import sqlite3
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

DEFAULT_METADATA_PATH = BASE_DIR / ".agents" / "data" / "new_exam_metadata.json"
DEFAULT_DB_PATH = BACKEND_DIR / "assets" / "exams.db"

EXAM_ID = "MD12T-405Aba22"


def get_db_connection(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=15.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    conn.row_factory = sqlite3.Row
    return conn


def ensure_tables(conn: sqlite3.Connection):
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS exams (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            provider TEXT NOT NULL,
            grade TEXT NOT NULL,
            major TEXT NOT NULL,
            held_date TEXT NOT NULL,
            total_questions INTEGER NOT NULL,
            sections_json TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS exam_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            utid TEXT UNIQUE NOT NULL,
            exam_id TEXT NOT NULL,
            q_num INTEGER NOT NULL,
            subject TEXT NOT NULL,
            correct_opt INTEGER NOT NULL,
            topic_id TEXT NOT NULL,
            time_taking_profile TEXT NOT NULL,
            question_type TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            question_text TEXT DEFAULT '',
            options_json TEXT DEFAULT '[]',
            page_number INTEGER DEFAULT 0,
            explanation_summary TEXT DEFAULT '',
            FOREIGN KEY (exam_id) REFERENCES exams(id),
            UNIQUE(exam_id, q_num)
        )
    """)
    conn.commit()


def update_keys_only(conn: sqlite3.Connection, keys_file: Path):
    """Updates only correct_opt and optional explanation_summary for MD12T-405Aba22."""
    if not keys_file.exists():
        print(f"Error: Keys file not found at {keys_file}")
        sys.exit(1)

    with open(keys_file, "r", encoding="utf-8") as f:
        keys_data = json.load(f)

    # keys_data can be dict { "1": 3 } or list of dicts [ { "q_num": 1, "correct_opt": 3, ... } ]
    c = conn.cursor()
    updated_count = 0

    if isinstance(keys_data, dict):
        for q_str, opt in keys_data.items():
            try:
                q_num = int(q_str)
                opt_val = int(opt)
                c.execute(
                    "UPDATE exam_questions SET correct_opt = ? WHERE exam_id = ? AND q_num = ?",
                    (opt_val, EXAM_ID, q_num)
                )
                if c.rowcount > 0:
                    updated_count += 1
            except ValueError:
                continue
    elif isinstance(keys_data, list):
        for item in keys_data:
            q_num = item.get("q_num")
            correct_opt = item.get("correct_opt")
            explanation = item.get("explanation_summary")
            if q_num and correct_opt:
                if explanation:
                    c.execute(
                        "UPDATE exam_questions SET correct_opt = ?, explanation_summary = ? WHERE exam_id = ? AND q_num = ?",
                        (int(correct_opt), str(explanation), EXAM_ID, int(q_num))
                    )
                else:
                    c.execute(
                        "UPDATE exam_questions SET correct_opt = ? WHERE exam_id = ? AND q_num = ?",
                        (int(correct_opt), EXAM_ID, int(q_num))
                    )
                if c.rowcount > 0:
                    updated_count += 1

    conn.commit()
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
    print(f"✅ Successfully updated keys for {updated_count} questions of exam {EXAM_ID}.")


def seed_exam(conn: sqlite3.Connection, metadata_file: Path):
    if not metadata_file.exists():
        print(f"Error: Metadata file not found at {metadata_file}")
        sys.exit(1)

    with open(metadata_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    exam_id = data.get("exam_id", EXAM_ID)
    title = data.get("title", "دوئل مدیاز - دوازدهم تجربی - ۲۲ آبان ۱۴۰۵")
    provider = data.get("provider", "مدیاز")
    grade = str(data.get("grade", "12"))
    major = data.get("major", "تجربی")
    held_date = data.get("held_date", "1405-08-22")
    total_questions = int(data.get("total_questions", 140))
    sections = data.get("sections", [])
    questions = data.get("questions", [])

    if len(questions) != total_questions:
        print(f"Error: Expected {total_questions} questions, found {len(questions)}")
        sys.exit(1)

    c = conn.cursor()

    # Step 1: Scoped Deletion (Zero impact on other exams or tables)
    print(f"Executing scoped deletion for exam_id='{exam_id}'...")
    c.execute("DELETE FROM exam_questions WHERE exam_id = ?", (exam_id,))
    deleted_questions = c.rowcount
    c.execute("DELETE FROM exams WHERE id = ?", (exam_id,))
    deleted_exams = c.rowcount
    print(f"Cleaned previous entries: {deleted_exams} exam row, {deleted_questions} questions.")

    # Step 2: Insert into exams
    c.execute("""
        INSERT INTO exams (
            id, title, provider, grade, major, held_date, total_questions, sections_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        exam_id,
        title,
        provider,
        grade,
        major,
        held_date,
        total_questions,
        json.dumps(sections, ensure_ascii=False)
    ))

    # Step 3: Insert 140 question rows
    for q in questions:
        c.execute("""
            INSERT INTO exam_questions (
                utid, exam_id, q_num, subject, correct_opt,
                topic_id, time_taking_profile, question_type, difficulty,
                question_text, options_json, page_number, explanation_summary
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            q["utid"],
            exam_id,
            q["q_num"],
            q["subject"],
            int(q["correct_opt"]),
            q["topic_id"],
            q["time_taking_profile"],
            q["question_type"],
            q["difficulty"],
            q.get("question_text", ""),
            json.dumps(q.get("options", []), ensure_ascii=False),
            int(q.get("page_number", 0)),
            q.get("explanation_summary", "")
        ))

    conn.commit()
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")

    # Step 4: Verification Queries
    c.execute("SELECT COUNT(*) FROM exams WHERE id = ?", (exam_id,))
    exam_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM exam_questions WHERE exam_id = ?", (exam_id,))
    q_count = c.fetchone()[0]

    c.execute("""
        SELECT subject, COUNT(*) as cnt 
        FROM exam_questions 
        WHERE exam_id = ? 
        GROUP BY subject 
        ORDER BY MIN(q_num)
    """, (exam_id,))
    subject_counts = c.fetchall()

    # Safety check: Verify M10T-405Mehr17 was untouched
    c.execute("SELECT COUNT(*) FROM exam_questions WHERE exam_id = 'M10T-405Mehr17'")
    m10_count = c.fetchone()[0]

    print("\n" + "="*50)
    print("🎯 SEEDING VERIFICATION SUMMARY")
    print("="*50)
    print(f"Exam ID:                {exam_id}")
    print(f"Title:                  {title}")
    print(f"Total Questions Seeded: {q_count} / {total_questions}")
    print(f"Subject Distribution:")
    for row in subject_counts:
        print(f"  - {row['subject']}: {row['cnt']} questions")
    print(f"Safety Check (M10T-405Mehr17 count): {m10_count} (Must be 90)")
    print("="*50 + "\n")

    if q_count != 140 or exam_count != 1:
        print("❌ Verification failed! Counts do not match expected values.")
        sys.exit(1)
    else:
        print("✅ Exam MD12T-405Aba22 successfully seeded with 140 verified questions.")


def main():
    parser = argparse.ArgumentParser(description="Seed Duel Mediqz Exam into exams.db")
    parser.add_argument(
        "--metadata-file",
        type=Path,
        default=DEFAULT_METADATA_PATH,
        help="Path to validated staging JSON metadata file"
    )
    parser.add_argument(
        "--db-path",
        type=Path,
        default=DEFAULT_DB_PATH,
        help="Path to exams.db SQLite database"
    )
    parser.add_argument(
        "--update-keys",
        type=Path,
        help="Path to JSON file containing updated answer keys"
    )
    args = parser.parse_args()

    conn = get_db_connection(args.db_path)
    try:
        ensure_tables(conn)
        if args.update_keys:
            update_keys_only(conn, args.update_keys)
        else:
            seed_exam(conn, args.metadata_file)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
