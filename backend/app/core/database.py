import sqlite3
from pathlib import Path
from datetime import datetime
from app.core.config import DB_USER_PATH
from app.core.security import hash_password, generate_salt

def get_user_db() -> sqlite3.Connection:
    DB_USER_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_USER_PATH), timeout=15.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    conn.row_factory = sqlite3.Row
    return conn

def init_databases() -> None:
    with get_user_db() as conn:
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                display_name TEXT,
                avatar_url TEXT,
                access_level TEXT DEFAULT 'S0',
                created_at TEXT
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT,
                expires_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS imported_courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT,
                topic_code TEXT,
                course_json TEXT,
                created_at TEXT
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS completed_courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id TEXT NOT NULL,
                part_id TEXT,
                title TEXT NOT NULL,
                topic_code TEXT,
                total_slides INTEGER,
                correct_count INTEGER DEFAULT 0,
                wrong_count INTEGER DEFAULT 0,
                score_percentage REAL DEFAULT 0,
                details_payload TEXT,
                completed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS part_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id TEXT NOT NULL,
                part_id TEXT NOT NULL,
                title TEXT NOT NULL,
                topic_code TEXT,
                review_step INTEGER DEFAULT 1,
                last_reviewed_at TEXT,
                next_due_at TEXT,
                is_delayed INTEGER DEFAULT 0,
                manual_review_date TEXT,
                created_at TEXT,
                UNIQUE(user_id, course_id, part_id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Seed default test user if not exists
        row = c.execute("SELECT id FROM users WHERE username = 'demo'").fetchone()
        if not row:
            salt = generate_salt()
            pwd_hash = hash_password("demo123", salt)
            c.execute(
                "INSERT INTO users (username, password_hash, salt, display_name, avatar_url, access_level, created_at) "
                "VALUES ('demo', ?, ?, 'دانش‌آموز آلکالیت', '', 'S2', ?)",
                (pwd_hash, salt, datetime.now().isoformat())
            )
        conn.commit()
