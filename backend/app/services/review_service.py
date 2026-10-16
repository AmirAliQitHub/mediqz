import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from app.core.database import get_user_db

FIBONACCI_INTERVALS = {
    1: 1,
    2: 2,
    3: 3,
    4: 5,
    5: 8,
    6: 13,
    7: 21
}

STATUS_VALUES = {"correct", "incorrect", "null", "absent"}

def is_review_course_payload(payload: dict, db_title: str = "", db_topic_code: str = "") -> bool:
    if payload.get("is_review"):
        return True
    title = str(db_title or payload.get("title", ""))
    topic = str(db_topic_code or payload.get("topic_code", ""))
    if topic.upper().startswith("REV-"):
        return True
    if title.strip().startswith("مرور "):
        return True
    if str(payload.get("source_part_id", "")).startswith("rev-"):
        return True
    for part in payload.get("parts", []):
        part_id = str(part.get("part_id", ""))
        if part_id.startswith("rev-") or part_id.startswith("p-rev-"):
            return True
    return False

def normalize_status_history(status, anchor: Optional[str] = None) -> Dict[str, str]:
    if isinstance(status, dict):
        cleaned = {}
        for key, value in status.items():
            cleaned[str(key)] = value if value in STATUS_VALUES else "null"
        return dict(sorted(cleaned.items(), key=lambda item: item[0]))

    if isinstance(status, list):
        if not status:
            return {}
        anchor_dt = None
        if anchor:
            try:
                anchor_dt = datetime.fromisoformat(anchor)
            except Exception:
                anchor_dt = None
        if anchor_dt is None:
            anchor_dt = datetime.now()

        start_dt = anchor_dt - timedelta(seconds=max(0, len(status) - 1))
        migrated = {}
        for idx, value in enumerate(status):
            stamp = (start_dt + timedelta(seconds=idx)).isoformat(timespec="seconds")
            while stamp in migrated:
                stamp = (datetime.fromisoformat(stamp) + timedelta(seconds=1)).isoformat(timespec="seconds")
            migrated[stamp] = value if value in STATUS_VALUES else "null"
        return migrated

    if status in STATUS_VALUES:
        stamp = anchor or datetime.now().isoformat(timespec="seconds")
        return {stamp: status}
    return {}

def latest_status_entry(status, anchor: Optional[str] = None):
    history = normalize_status_history(status, anchor)
    if not history:
        return None, None
    stamp = next(reversed(history))
    return history[stamp], stamp

def is_review_due(row: dict, now: Optional[datetime] = None) -> bool:
    current = now or datetime.now()
    next_due = row.get("next_due_at")
    if next_due:
        try:
            if datetime.fromisoformat(str(next_due).replace("Z", "+00:00")).replace(tzinfo=None) <= current:
                return True
        except Exception:
            pass
    manual_date = str(row.get("manual_review_date") or "")
    if manual_date:
        try:
            return datetime.fromisoformat(manual_date).date() <= current.date()
        except Exception:
            pass
    return False

def append_status(history, status: str, when: Optional[datetime] = None) -> Dict[str, str]:
    result = normalize_status_history(history)
    event_time = when or datetime.now()
    stamp = event_time.isoformat(timespec="seconds")
    if stamp in result:
        stamp = event_time.isoformat(timespec="microseconds")
    result[stamp] = status if status in STATUS_VALUES else "null"
    return dict(sorted(result.items(), key=lambda item: item[0]))

def record_part_review(
    user_id: int,
    course_id: str,
    part_id: str,
    title: str,
    topic_code: str = "---"
) -> Dict:
    now = datetime.now()
    with get_user_db() as conn:
        existing = conn.execute("""
            SELECT * FROM part_reviews
            WHERE user_id = ? AND course_id = ? AND part_id = ?
        """, (user_id, course_id, part_id)).fetchone()

        if not existing:
            step = 1
            interval_days = 1
            is_delayed = 0
            next_due = (now + timedelta(days=interval_days)).isoformat()

            conn.execute("""
                INSERT INTO part_reviews (
                    user_id, course_id, part_id, title, topic_code,
                    review_step, last_reviewed_at, next_due_at,
                    is_delayed, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, course_id, part_id, title, topic_code,
                step, now.isoformat(), next_due,
                is_delayed, now.isoformat()
            ))
        else:
            prev_step = existing["review_step"] or 1
            prev_due = existing["next_due_at"]

            was_delayed = False
            hours_late = 0
            if prev_due:
                try:
                    due_dt = datetime.fromisoformat(prev_due)
                    if now > (due_dt + timedelta(hours=18)):
                        was_delayed = True
                        hours_late = (now - due_dt).total_seconds() / 3600
                except Exception:
                    pass

            if was_delayed:
                if hours_late > 96:
                    step = 1
                elif hours_late > 48:
                    step = max(1, prev_step - 2)
                else:
                    step = max(1, prev_step - 1)
                interval_days = FIBONACCI_INTERVALS.get(step, 1)
                is_delayed = 1
            else:
                step = min(prev_step + 1, 7)
                interval_days = FIBONACCI_INTERVALS.get(step, 21)
                is_delayed = 0

            next_due = (now + timedelta(days=interval_days)).isoformat()

            conn.execute("""
                UPDATE part_reviews
                SET title = ?, topic_code = ?, review_step = ?,
                    last_reviewed_at = ?, next_due_at = ?, is_delayed = ?, manual_review_date = NULL
                WHERE id = ?
            """, (
                title, topic_code, step,
                now.isoformat(), next_due, is_delayed, existing["id"]
            ))

        conn.commit()

    return {
        "course_id": course_id,
        "part_id": part_id,
        "title": title,
        "review_step": step,
        "interval_days": interval_days,
        "next_due_at": next_due,
        "is_delayed": is_delayed
    }

def mark_review_today(user_id: int, course_id: str, part_id: str) -> Dict:
    today = datetime.now().date().isoformat()
    now = datetime.now()
    with get_user_db() as conn:
        row = conn.execute("""
            SELECT id FROM part_reviews
            WHERE user_id = ? AND course_id = ? AND part_id = ?
        """, (user_id, course_id, part_id)).fetchone()
        if not row:
            conn.execute("""
                INSERT INTO part_reviews (
                    user_id, course_id, part_id, title, topic_code,
                    review_step, last_reviewed_at, next_due_at,
                    manual_review_date, is_delayed, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, course_id, part_id, part_id, "---",
                1, None, today, today, 0, now.isoformat()
            ))
        else:
            conn.execute("UPDATE part_reviews SET manual_review_date = ? WHERE id = ?", (today, row["id"]))
        conn.commit()
    return {"course_id": course_id, "part_id": part_id, "manual_review_date": today}

def get_user_reviews_list(user_id: int) -> List[Dict]:
    with get_user_db() as conn:
        rows = conn.execute("""
            SELECT id, course_id, part_id, title, topic_code, review_step,
                   last_reviewed_at, next_due_at, is_delayed, manual_review_date, created_at
            FROM part_reviews
            WHERE user_id = ?
            ORDER BY next_due_at ASC
        """, (user_id,)).fetchall()

        result = []
        for row in rows:
            item = dict(row)
            item["is_due"] = is_review_due(item)
            item["course_title"] = item.get("course_id", "")
            item["part_title"] = item.get("title", "")
            result.append(item)
        return result

def get_urgent_reviews(user_id: int) -> List[Dict]:
    all_reviews = get_user_reviews_list(user_id)
    return [r for r in all_reviews if r.get("is_due")]
