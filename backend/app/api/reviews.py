import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.core.database import get_user_db
from app.models.schemas import (
    ReviewSessionSubmitReq, EULogBatchReq, EULogItem,
    UserRoutinesSyncReq, UserRoutineItem
)
from app.services.review_service import (
    record_part_review, get_user_reviews_list, get_urgent_reviews,
    normalize_status_history, append_status, mark_review_today
)

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("/user-parts")
async def get_user_parts(user: dict = Depends(get_current_user)) -> List[Dict[str, Any]]:
    return get_user_reviews_list(user["id"])

@router.get("/urgent-notifications")
async def get_urgent(user: dict = Depends(get_current_user)) -> List[Dict[str, Any]]:
    return get_urgent_reviews(user["id"])

@router.post("/review-today")
async def review_today(payload: Dict[str, str], user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    course_id = payload.get("course_id", "")
    part_id = payload.get("part_id", "")
    if not course_id or not part_id:
        raise HTTPException(status_code=400, detail="شناسه دوره و پارت الزامی است.")
    return mark_review_today(user["id"], course_id, part_id)

@router.get("/part-details")
async def get_part_details(course_id: str, part_id: str, user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    from app.api.courses import resolve_course_payload
    try:
        course_data = resolve_course_payload(course_id, user_id=user["id"])
    except HTTPException:
        raise HTTPException(status_code=404, detail="دوره مورد نظر یافت نشد.")

    parts = course_data.get("parts", [])
    found_part = next((p for p in parts if str(p.get("part_id")) == str(part_id)), None)
    if not found_part and parts:
        found_part = parts[0]

    if not found_part:
        raise HTTPException(status_code=404, detail="پارت مورد نظر در دوره یافت نشد.")

    with get_user_db() as conn:
        rev_row = conn.execute("""
            SELECT * FROM part_reviews
            WHERE user_id = ? AND course_id = ? AND part_id = ?
            ORDER BY id DESC LIMIT 1
        """, (user["id"], course_id, part_id)).fetchone()

    return {
        "part": found_part,
        "course": course_data,
        "review_record": dict(rev_row) if rev_row else None
    }

@router.post("/submit-review-session")
async def submit_review_session(req: ReviewSessionSubmitReq, user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    # Record completion & advance Fibonacci review interval
    result = record_part_review(
        user_id=user["id"],
        course_id=req.course_id,
        part_id=req.part_id,
        title=req.summary.get("title", req.part_id),
        topic_code=req.summary.get("topic_code", "---")
    )
    return {"success": True, "review": result}

@router.post("/log-eu")
async def log_eu_activity(
    req: EULogBatchReq,
    user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Centralized first-pass EU activity logging.
    Records 'correct', 'incorrect', or 'null' outcome for each EU attempt.
    """
    now_iso = datetime.now().isoformat()
    valid_statuses = {"correct", "incorrect", "null"}
    
    with get_user_db() as conn:
        for item in req.items:
            status = item.status.lower().strip()
            if status not in valid_statuses:
                raise HTTPException(status_code=400, detail=f"Invalid status '{item.status}'. Must be correct, incorrect, or null.")
            
            conn.execute("""
                INSERT INTO eu_activity_logs (
                    user_id, course_id, part_id, eu_id, status, user_answer, shamsi_date, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user["id"],
                item.course_id,
                item.part_id,
                item.eu_id,
                status,
                item.user_answer or "",
                item.shamsi_date,
                now_iso
            ))
        conn.commit()

    return {"success": True, "logged_count": len(req.items)}


@router.get("/course-mistakes")
async def get_course_mistakes(
    course_id: str,
    shamsi_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Retrieves distinct incorrect and null (View Answer) EUs for a course and optional Shamsi date.
    Differentiates between conceptual errors ('incorrect') and skipped/view-answer ('null').
    """
    with get_user_db() as conn:
        query = """
            SELECT course_id, part_id, eu_id, status, user_answer, shamsi_date, created_at
            FROM eu_activity_logs
            WHERE user_id = ? AND course_id = ? AND status IN ('incorrect', 'null')
        """
        params = [user["id"], course_id]
        if shamsi_date:
            query += " AND shamsi_date = ?"
            params.append(shamsi_date)
        
        query += " ORDER BY id DESC"
        rows = conn.execute(query, params).fetchall()

    # Deduplicate keeping the latest attempt per EU
    seen_eus = set()
    mistakes = []
    incorrect_count = 0
    null_count = 0

    for r in rows:
        eu_key = f"{r['part_id']}::{r['eu_id']}"
        if eu_key not in seen_eus:
            seen_eus.add(eu_key)
            rec = {
                "course_id": r["course_id"],
                "part_id": r["part_id"],
                "eu_id": r["eu_id"],
                "status": r["status"],
                "user_answer": r["user_answer"],
                "shamsi_date": r["shamsi_date"],
                "created_at": r["created_at"]
            }
            mistakes.append(rec)
            if r["status"] == "incorrect":
                incorrect_count += 1
            else:
                null_count += 1

    return {
        "course_id": course_id,
        "shamsi_date": shamsi_date,
        "mistakes": mistakes,
        "incorrect_count": incorrect_count,
        "null_count": null_count,
        "total_count": len(mistakes)
    }


@router.get("/routines")
async def get_user_routines(
    shamsi_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Returns cloud-synchronized routine schedule items for user.
    """
    with get_user_db() as conn:
        if shamsi_date:
            rows = conn.execute("""
                SELECT * FROM user_routines
                WHERE user_id = ? AND shamsi_date = ?
                ORDER BY order_idx ASC, id ASC
            """, (user["id"], shamsi_date)).fetchall()
        else:
            rows = conn.execute("""
                SELECT * FROM user_routines
                WHERE user_id = ?
                ORDER BY shamsi_date ASC, order_idx ASC, id ASC
            """, (user["id"],)).fetchall()

    return [dict(r) for r in rows]


@router.post("/routines")
async def sync_user_routines(
    req: UserRoutinesSyncReq,
    user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Bulk synchronize routine schedule items for specified Shamsi dates.
    """
    now_iso = datetime.now().isoformat()
    with get_user_db() as conn:
        # Group by dates touched in req routines or explicitly cleared
        dates_to_delete = {item.shamsi_date for item in req.routines} | set(req.cleared_dates or [])
        for s_date in dates_to_delete:
            conn.execute("DELETE FROM user_routines WHERE user_id = ? AND shamsi_date = ?", (user["id"], s_date))
        
        for idx, item in enumerate(req.routines):
            conn.execute("""
                INSERT INTO user_routines (
                    user_id, shamsi_date, course_id, course_title, part_id, part_title,
                    slide_count, completed, completed_at, order_idx, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user["id"],
                item.shamsi_date,
                item.course_id,
                item.course_title,
                item.part_id,
                item.part_title,
                item.slide_count,
                1 if item.completed else 0,
                now_iso if item.completed else None,
                item.order_idx or idx,
                now_iso
            ))
        conn.commit()

    return {"success": True, "count": len(req.routines)}
