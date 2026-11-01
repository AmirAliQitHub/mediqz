import sqlite3
import json
import shutil
from contextlib import contextmanager
from app.core.config import DB_EXAMS_PATH, ASSETS_DIR

@contextmanager
def get_exams_db():
    DB_EXAMS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DB_EXAMS_PATH.exists() and (ASSETS_DIR / "exams.db").exists() and DB_EXAMS_PATH.resolve() != (ASSETS_DIR / "exams.db").resolve():
        shutil.copy2(str(ASSETS_DIR / "exams.db"), str(DB_EXAMS_PATH))
    conn = sqlite3.connect(str(DB_EXAMS_PATH), timeout=15.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_exams_db() -> None:
    with get_exams_db() as conn:
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

        # Migration columns if table existed with older schema
        cols = [r[1] for r in c.execute("PRAGMA table_info(exam_questions)").fetchall()]
        if "utid" not in cols:
            c.execute("ALTER TABLE exam_questions ADD COLUMN utid TEXT DEFAULT ''")
        if "topic_id" not in cols:
            c.execute("ALTER TABLE exam_questions ADD COLUMN topic_id TEXT DEFAULT ''")
        if "time_taking_profile" not in cols:
            c.execute("ALTER TABLE exam_questions ADD COLUMN time_taking_profile TEXT DEFAULT 'Standard'")
        if "question_type" not in cols:
            c.execute("ALTER TABLE exam_questions ADD COLUMN question_type TEXT DEFAULT 'Mafhoomi'")
        if "question_text" not in cols:
            c.execute("ALTER TABLE exam_questions ADD COLUMN question_text TEXT DEFAULT ''")
        if "options_json" not in cols:
            c.execute("ALTER TABLE exam_questions ADD COLUMN options_json TEXT DEFAULT '[]'")

        conn.commit()
