import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.core.database import get_user_db
from app.models.schemas import ReviewSessionSubmitReq
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
