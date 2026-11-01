import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.core.database import get_user_db, get_or_create_telegram_user

FIBONACCI_INTERVALS = {
    1: 1,
    2: 2,
    3: 3,
    4: 5,
    5: 8,
    6: 13,
    7: 21
}


def get_or_create_internal_user(
    conn: sqlite3.Connection,
    tg_id: int,
    first_name: Optional[str] = None,
    username: Optional[str] = None
) -> int:
    user = get_or_create_telegram_user(conn, tg_id, first_name=first_name, tg_username=username)
    return user["id"]


def register_user(user_id: int, first_name: str, username: Optional[str] = None):
    with get_user_db() as conn:
        get_or_create_internal_user(conn, user_id, first_name, username)


def add_to_leitner(user_id: int, word: str, meaning: str, grade: int, chapter_title: str) -> bool:
    word_clean = word.strip()
    now = datetime.now()
    next_review = (now + timedelta(days=1)).isoformat()
    now_str = now.isoformat()

    with get_user_db() as conn:
        try:
            internal_id = get_or_create_internal_user(conn, user_id)
            conn.execute("""
                INSERT INTO leitner_cards 
                (user_id, telegram_user_id, word, meaning, grade, chapter_title, step, streak, next_review_at, created_at, last_reviewed_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
                ON CONFLICT(user_id, word) DO NOTHING
            """, (internal_id, user_id, word_clean, meaning, str(grade), chapter_title, next_review, now_str, now_str))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error adding card to Leitner: {e}")
            return False


def get_due_leitner_cards(user_id: int) -> List[Dict[str, Any]]:
    now_str = datetime.now().isoformat()
    with get_user_db() as conn:
        internal_id = get_or_create_internal_user(conn, user_id)
        rows = conn.execute("""
            SELECT * FROM leitner_cards
            WHERE user_id = ? AND next_review_at <= ?
            ORDER BY next_review_at ASC
        """, (internal_id, now_str)).fetchall()
        return [dict(r) for r in rows]


def get_all_user_cards(user_id: int) -> List[Dict[str, Any]]:
    with get_user_db() as conn:
        internal_id = get_or_create_internal_user(conn, user_id)
        rows = conn.execute("""
            SELECT * FROM leitner_cards
            WHERE user_id = ?
            ORDER BY step DESC, id DESC
        """, (internal_id,)).fetchall()
        return [dict(r) for r in rows]


def record_leitner_review(card_id: int, user_id: int, is_correct: bool) -> Dict[str, Any]:
    now = datetime.now()
    now_str = now.isoformat()

    with get_user_db() as conn:
        internal_id = get_or_create_internal_user(conn, user_id)
        card = conn.execute("SELECT * FROM leitner_cards WHERE id = ? AND user_id = ?", (card_id, internal_id)).fetchone()
        if not card:
            return {}

        current_step = card["step"]
        if is_correct:
            new_step = min(7, current_step + 1)
            streak = card["streak"] + 1
            days = FIBONACCI_INTERVALS.get(new_step, 21)
            next_review = (now + timedelta(days=days)).isoformat()
        else:
            new_step = 1
            streak = 0
            next_review = (now + timedelta(days=1)).isoformat()

        conn.execute("""
            UPDATE leitner_cards
            SET step = ?, streak = ?, next_review_at = ?, last_reviewed_at = ?
            WHERE id = ?
        """, (new_step, streak, next_review, now_str, card_id))

        conn.execute("""
            INSERT INTO review_logs (user_id, card_id, is_correct, reviewed_at)
            VALUES (?, ?, ?, ?)
        """, (internal_id, card_id, 1 if is_correct else 0, now_str))

        conn.commit()
        return {
            "card_id": card_id,
            "word": card["word"],
            "old_step": current_step,
            "new_step": new_step,
            "is_correct": is_correct,
            "next_review_at": next_review,
        }


def get_user_stats(user_id: int) -> Dict[str, Any]:
    now_str = datetime.now().isoformat()
    with get_user_db() as conn:
        internal_id = get_or_create_internal_user(conn, user_id)

        total = conn.execute("SELECT COUNT(*) FROM leitner_cards WHERE user_id = ?", (internal_id,)).fetchone()[0]
        due = conn.execute("SELECT COUNT(*) FROM leitner_cards WHERE user_id = ? AND next_review_at <= ?", (internal_id, now_str)).fetchone()[0]
        mastered = conn.execute("SELECT COUNT(*) FROM leitner_cards WHERE user_id = ? AND step >= 6", (internal_id,)).fetchone()[0]

        step_counts = {}
        for s in range(1, 8):
            cnt = conn.execute("SELECT COUNT(*) FROM leitner_cards WHERE user_id = ? AND step = ?", (internal_id, s)).fetchone()[0]
            step_counts[s] = cnt

        reviews_today = conn.execute("""
            SELECT COUNT(*) FROM review_logs
            WHERE user_id = ? AND date(reviewed_at) = date('now')
        """, (internal_id,)).fetchone()[0]

        return {
            "total_cards": total,
            "due_today": due,
            "mastered": mastered,
            "step_counts": step_counts,
            "reviews_today": reviews_today,
        }
