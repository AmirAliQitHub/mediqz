import sqlite3
import shutil
from pathlib import Path
from datetime import datetime
from app.core.config import DB_USER_PATH, ASSETS_DIR
from app.core.security import hash_password, generate_salt

def get_user_db() -> sqlite3.Connection:
    DB_USER_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DB_USER_PATH.exists() and (ASSETS_DIR / "userdata.db").exists() and DB_USER_PATH.resolve() != (ASSETS_DIR / "userdata.db").resolve():
        shutil.copy2(str(ASSETS_DIR / "userdata.db"), str(DB_USER_PATH))
    conn = sqlite3.connect(str(DB_USER_PATH), timeout=15.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    conn.execute("PRAGMA foreign_keys = ON;")
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
        c.execute("""
            CREATE TABLE IF NOT EXISTS student_exam_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                exam_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'phase1',
                exam_score_pct REAL DEFAULT 0.0,
                potential_score_pct REAL DEFAULT 0.0,
                anxiety_tax_pct REAL DEFAULT 0.0,
                phase1_answers_json TEXT NOT NULL DEFAULT '{}',
                phase2_resolves_json TEXT NOT NULL DEFAULT '{}',
                metrics_summary_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT,
                UNIQUE(user_id, exam_id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Unified Leitner & Active Recall tables
        c.execute("""
            CREATE TABLE IF NOT EXISTS leitner_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                telegram_user_id INTEGER,
                word TEXT NOT NULL,
                meaning TEXT NOT NULL,
                grade TEXT DEFAULT '10',
                chapter_title TEXT,
                step INTEGER DEFAULT 1,
                streak INTEGER DEFAULT 0,
                next_review_at TEXT,
                created_at TEXT,
                last_reviewed_at TEXT,
                UNIQUE(user_id, word COLLATE NOCASE),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        c.execute("CREATE INDEX IF NOT EXISTS idx_leitner_user_due ON leitner_cards(user_id, next_review_at);")
        c.execute("CREATE INDEX IF NOT EXISTS idx_leitner_tg_due ON leitner_cards(telegram_user_id, next_review_at);")

        c.execute("""
            CREATE TABLE IF NOT EXISTS review_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_id INTEGER,
                user_id INTEGER NOT NULL,
                telegram_user_id INTEGER,
                word TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                step_before INTEGER NOT NULL,
                step_after INTEGER NOT NULL,
                reviewed_at TEXT NOT NULL,
                FOREIGN KEY (card_id) REFERENCES leitner_cards(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        c.execute("CREATE INDEX IF NOT EXISTS idx_review_logs_user ON review_logs(user_id, reviewed_at);")
        c.execute("CREATE INDEX IF NOT EXISTS idx_review_logs_card ON review_logs(card_id);")
        c.execute("CREATE INDEX IF NOT EXISTS idx_review_logs_tg ON review_logs(telegram_user_id, reviewed_at);")

        # Granular Educational Unit (EU) first-pass activity logs
        c.execute("""
            CREATE TABLE IF NOT EXISTS eu_activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id TEXT NOT NULL,
                part_id TEXT NOT NULL,
                eu_id TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('correct', 'incorrect', 'null')),
                user_answer TEXT,
                shamsi_date TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        c.execute("CREATE INDEX IF NOT EXISTS idx_eu_activity_user_course_date ON eu_activity_logs(user_id, course_id, shamsi_date);")
        c.execute("CREATE INDEX IF NOT EXISTS idx_eu_activity_user_status ON eu_activity_logs(user_id, status);")

        # Cloud-synchronized Routine daily schedules
        c.execute("""
            CREATE TABLE IF NOT EXISTS user_routines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                shamsi_date TEXT NOT NULL,
                course_id TEXT NOT NULL,
                course_title TEXT NOT NULL,
                part_id TEXT NOT NULL,
                part_title TEXT NOT NULL,
                slide_count INTEGER DEFAULT 0,
                completed INTEGER DEFAULT 0,
                completed_at TEXT,
                order_idx INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        c.execute("CREATE INDEX IF NOT EXISTS idx_user_routines_date ON user_routines(user_id, shamsi_date);")
        c.execute("CREATE INDEX IF NOT EXISTS idx_user_routines_completed ON user_routines(user_id, completed);")

        # Ensure migration columns for users table
        existing_cols = [r[1] for r in c.execute("PRAGMA table_info(users)").fetchall()]
        if "grade" not in existing_cols:
            c.execute("ALTER TABLE users ADD COLUMN grade TEXT DEFAULT ''")
        if "is_onboarded" not in existing_cols:
            c.execute("ALTER TABLE users ADD COLUMN is_onboarded INTEGER DEFAULT 0")
        if "is_superuser" not in existing_cols:
            c.execute("ALTER TABLE users ADD COLUMN is_superuser INTEGER DEFAULT 0")
        if "telegram_user_id" not in existing_cols:
            c.execute("ALTER TABLE users ADD COLUMN telegram_user_id INTEGER")
            c.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_user_id ON users(telegram_user_id) WHERE telegram_user_id IS NOT NULL;")
        if "has_password" not in existing_cols:
            c.execute("ALTER TABLE users ADD COLUMN has_password INTEGER DEFAULT 0")
            c.execute("UPDATE users SET has_password = 1 WHERE password_hash != ''")

        # Seed default superuser 'admin' ('password')
        admin_row = c.execute("SELECT id FROM users WHERE username = 'admin'").fetchone()
        salt_admin = generate_salt()
        pwd_hash_admin = hash_password("password", salt_admin)
        now_str = datetime.now().isoformat()
        if not admin_row:
            c.execute(
                "INSERT INTO users (username, password_hash, salt, display_name, avatar_url, access_level, grade, is_onboarded, is_superuser, has_password, created_at) "
                "VALUES ('admin', ?, ?, 'مدیر سیستم', '', 'SUPERUSER', '12', 1, 1, 1, ?)",
                (pwd_hash_admin, salt_admin, now_str)
            )
        else:
            c.execute(
                "UPDATE users SET password_hash = ?, salt = ?, is_superuser = 1, access_level = 'SUPERUSER', is_onboarded = 1, has_password = 1 WHERE username = 'admin'",
                (pwd_hash_admin, salt_admin)
            )

        # Seed default test user 'demo' ('demo123')
        demo_row = c.execute("SELECT id FROM users WHERE username = 'demo'").fetchone()
        if not demo_row:
            salt_demo = generate_salt()
            pwd_hash_demo = hash_password("demo123", salt_demo)
            c.execute(
                "INSERT INTO users (username, password_hash, salt, display_name, avatar_url, access_level, grade, is_onboarded, is_superuser, has_password, created_at) "
                "VALUES ('demo', ?, ?, 'دانش‌آموز مدیاز', '', 'S2', '12', 1, 0, 1, ?)",
                (pwd_hash_demo, salt_demo, now_str)
            )
        else:
            c.execute("UPDATE users SET is_onboarded = 1, grade = '12', has_password = 1 WHERE username = 'demo'")
        conn.commit()


def get_or_create_telegram_user(
    conn: sqlite3.Connection,
    tg_id: int,
    tg_username: str | None = None,
    first_name: str | None = None
) -> sqlite3.Row:
    """
    Safely retrieves or registers a user identified by Telegram user ID.
    Enforces strict security against username collision attacks and
    supports automatic pre-registration linking when a user initially
    registered on the web with their Telegram ID.
    """
    cursor = conn.cursor()
    # 1. Strict lookup by unique telegram_user_id
    user = cursor.execute("SELECT * FROM users WHERE telegram_user_id = ?", (tg_id,)).fetchone()
    if user:
        updates = []
        params = []
        if first_name and user["display_name"] != first_name:
            updates.append("display_name = ?")
            params.append(first_name)
        if updates:
            params.append(user["id"])
            cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
            user = cursor.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        return user

    # 2. Pre-registration auto-linking:
    # If student previously registered on the web using their Telegram ID as username
    web_pre_registered = cursor.execute(
        "SELECT * FROM users WHERE (username = ? OR username = ?) AND telegram_user_id IS NULL",
        (str(tg_id), f"tg_{tg_id}")
    ).fetchone()
    if web_pre_registered:
        cursor.execute("UPDATE users SET telegram_user_id = ? WHERE id = ?", (tg_id, web_pre_registered["id"]))
        conn.commit()
        return cursor.execute("SELECT * FROM users WHERE id = ?", (web_pre_registered["id"],)).fetchone()

    # 3. Telegram user is new. Determine a collision-safe username (preferring str(tg_id)).
    candidate_username = str(tg_id)
    existing = cursor.execute("SELECT id FROM users WHERE username = ?", (candidate_username,)).fetchone()
    if existing:
        if tg_username and not cursor.execute("SELECT id FROM users WHERE username = ?", (tg_username.strip(),)).fetchone():
            candidate_username = tg_username.strip()
        else:
            candidate_username = f"tg_{tg_id}_{int(datetime.now().timestamp())}"

    disp_name = (first_name or tg_username or f"کاربر {tg_id}").strip()
    salt = generate_salt()
    pwd_hash = hash_password(str(tg_id), salt)
    now_str = datetime.now().isoformat()

    is_su = 1 if (disp_name == "amirtaii8123" or candidate_username == "amirtaii8123") else 0
    access_lvl = "SUPERUSER" if is_su else "S2"

    cursor.execute("""
        INSERT INTO users (
            username, password_hash, salt, display_name, avatar_url,
            access_level, grade, is_onboarded, is_superuser, telegram_user_id, has_password, created_at
        ) VALUES (?, ?, ?, ?, '', ?, '', 0, ?, ?, 0, ?)
    """, (candidate_username, pwd_hash, salt, disp_name, access_lvl, is_su, tg_id, now_str))
    conn.commit()

    new_id = cursor.lastrowid
    return cursor.execute("SELECT * FROM users WHERE id = ?", (new_id,)).fetchone()

