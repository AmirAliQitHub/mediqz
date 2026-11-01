import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user, get_optional_user
from app.core.config import COURSES_DIR
from app.core.database import get_user_db
from app.models.schemas import CourseCompleteReq, CourseSummary, CourseImportReq
from app.services.review_service import record_part_review, normalize_status_history, is_review_course_payload

router = APIRouter(prefix="/courses", tags=["courses"])

ALIAS_MAP = {
    "sample": "sample",
    "biology10": "sample",
    "persian10": "persian10_vocab",
    "persian10_vocab": "persian10_vocab",
    "persian10_elam": "persian10_elam",
    "persian11": "persian11_vocab",
    "persian11_vocab": "persian11_vocab",
    "persian11_elam": "persian11_elam",
    "persian12": "persian12_vocab",
    "persian12_vocab": "persian12_vocab",
    "persian12_elam": "persian12_elam",
    "arabic10": "arabic10_vocab",
    "arabic10_vocab": "arabic10_vocab",
    "arabic11": "arabic11_vocab",
    "arabic11_vocab": "arabic11_vocab",
    "arabic12": "arabic12_vocab",
    "arabic12_vocab": "arabic12_vocab",
    "dini12": "dini12_ayat",
    "dini12_ayat": "dini12_ayat",
    "di12_ayat": "dini12_ayat",
    "health12": "health12",
    "he12": "health12",
    "biology_ghayd": "biology_ghayd",
    "bi_ghayd": "biology_ghayd",
    "chemistry_elements": "chemistry_elements",
    "ch_pt": "chemistry_elements",
    "persian10_emla": "persian10_emla",
    "fa10_emla": "persian10_emla",
    "persian11_emla": "persian11_emla",
    "fa11_emla": "persian11_emla",
    "persian12_emla": "persian12_emla",
    "fa12_emla": "persian12_emla",
    "persian_emla": "persian12_emla",
    "fa_emla": "persian12_emla",
    "persian_araye": "persian_araye",
    "fa_araye": "persian_araye",
    "chemistry_catalysts_colors": "chemistry_catalysts_colors",
    "ch_catalysts": "chemistry_catalysts_colors",
    "physics_units_si": "physics_units_si",
    "ph_units": "physics_units_si",
    "arabic_translation_rules": "arabic_translation_rules",
    "ar_rules": "arabic_translation_rules",
    "chemistry_functional_groups": "chemistry_functional_groups",
    "ch_groups": "chemistry_functional_groups"
}

def resolve_course_payload(raw_course_id: str, user_id: Optional[int] = None) -> Dict[str, Any]:
    cid = raw_course_id.strip()
    clean_id = cid
    if clean_id.startswith("builtin-"):
        clean_id = clean_id[len("builtin-"):]
    elif clean_id.startswith("custom-"):
        clean_id = clean_id[len("custom-"):]
    if clean_id.endswith(".json"):
        clean_id = clean_id[:-5]

    clean_id = ALIAS_MAP.get(clean_id, clean_id)

    # 1. Search in filesystem builtin courses
    possible_files = [
        COURSES_DIR / f"{clean_id}.json",
        COURSES_DIR / f"{raw_course_id}.json"
    ]
    for p in possible_files:
        if p and p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    data["course_id"] = clean_id
                    if "parts" not in data or not data["parts"]:
                        data["parts"] = [{
                            "part_id": "p1",
                            "title": data.get("title", "بخش اصلی"),
                            "description": "واحدهای یادگیری",
                            "order": 1,
                            "eus": data.get("eus", [])
                        }]
                    return data
            except Exception:
                continue

    # 2. Search in user's imported courses if custom
    if user_id:
        with get_user_db() as conn:
            if clean_id.isdigit():
                row = conn.execute(
                    "SELECT id, title, topic_code, course_json FROM imported_courses WHERE user_id = ? AND id = ?",
                    (user_id, int(clean_id))
                ).fetchone()
                if row:
                    try:
                        c_json = json.loads(row["course_json"])
                        c_json["course_id"] = f"custom-{row['id']}"
                        if "parts" not in c_json or not c_json["parts"]:
                            c_json["parts"] = [{
                                "part_id": "p1",
                                "title": row["title"],
                                "description": "واحدهای یادگیری",
                                "order": 1,
                                "eus": c_json.get("eus", [])
                            }]
                        return c_json
                    except Exception:
                        pass

    raise HTTPException(status_code=404, detail="دوره آموزشی یافت نشد.")

STABLE_COURSE_IDS = {
    "persian10_vocab", "persian11_vocab", "persian12_vocab",
    "persian10_emla", "persian11_emla", "persian12_emla",
    "persian10_elam", "persian11_elam", "persian12_elam",
    "arabic10_vocab", "arabic11_vocab", "arabic12_vocab"
}

STABLE_TOPIC_CODES = {
    "FA10", "FA11", "FA12",
    "fa10_emla", "fa11_emla", "fa12_emla",
    "FA10E", "FA11E", "FA12E",
    "AR10", "AR11", "AR12"
}

@router.get("", response_model=List[CourseSummary])
def list_courses(user: Optional[Dict[str, Any]] = Depends(get_optional_user), include_dev: bool = False):
    if isinstance(user, dict):
        is_su = bool(user.get("is_superuser") or user.get("access_level") == "SUPERUSER" or user.get("username") == "amirtaii8123")
    else:
        is_su = False
    allow_dev = is_su or include_dev
    result: List[CourseSummary] = []

    # 1. Builtin courses from assets/courses
    if COURSES_DIR.exists():
        for p in sorted(COURSES_DIR.glob("*.json")):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    cid = p.stem
                    topic_code = data.get("topic_code", cid)
                    is_stable = (cid in STABLE_COURSE_IDS) or (topic_code in STABLE_TOPIC_CODES)

                    # Only stable courses visible for standard users
                    if not is_stable and not allow_dev:
                        continue

                    parts = data.get("parts", [])
                    slides_count = sum(len(part.get("eus", [])) for part in parts) if parts else len(data.get("eus", []))
                    parts_count = len(parts) if parts else 1

                    subject = data.get("subject", "")
                    raw_grade = str(data.get("grade", "")).strip()
                    grade_map = {
                        "10": "پایه دهم",
                        "11": "پایه یازدهم",
                        "12": "پایه دوازدهم"
                    }
                    grade = grade_map.get(raw_grade, raw_grade)
                    if not subject:
                        if "persian" in cid or "fa" in cid:
                            subject = "فارسی و ادبیات"
                        elif "arabic" in cid:
                            subject = "عربی"
                        elif "bio" in cid or "sample" in cid:
                            subject = "زیست‌شناسی"
                    if not grade:
                        if "10" in cid:
                            grade = "پایه دهم"
                        elif "11" in cid:
                            grade = "پایه یازدهم"
                        elif "12" in cid:
                            grade = "پایه دوازدهم"

                    result.append(CourseSummary(
                        id=f"builtin-{cid}",
                        title=data.get("title", cid),
                        topic_code=topic_code,
                        subject=subject,
                        grade=grade,
                        description=data.get("description", "محتوای آموزشی تعاملی و تمرین شناختی"),
                        parts_count=parts_count,
                        slides_count=slides_count,
                        type="builtin",
                        is_review=False,
                        is_development=not is_stable
                    ))
            except Exception:
                continue

    # 2. User's imported custom courses
    if user and isinstance(user, dict) and "id" in user:
        with get_user_db() as conn:
            rows = conn.execute(
                "SELECT id, title, topic_code, course_json FROM imported_courses WHERE user_id = ? ORDER BY id DESC",
                (user["id"],)
            ).fetchall()
            for r in rows:
                try:
                    c_json = json.loads(r["course_json"])
                    parts = c_json.get("parts", [])
                    slides_count = sum(len(part.get("eus", [])) for part in parts) if parts else len(c_json.get("eus", []))
                    parts_count = len(parts) if parts else 1
                    result.append(CourseSummary(
                        id=f"custom-{r['id']}",
                        title=r["title"] or "دوره سفارشی",
                        topic_code=r["topic_code"] or "CUSTOM",
                        subject=c_json.get("subject", "محتوای سفارشی"),
                        grade=c_json.get("grade", "همه پایه‌ها"),
                        description=c_json.get("description", "دوره آموزشی وارد شده توسط کاربر"),
                        parts_count=parts_count,
                        slides_count=slides_count,
                        type="custom",
                        is_review=c_json.get("is_review", False)
                    ))
                except Exception:
                    continue

    return result

@router.get("/{course_id}")
def get_course_detail(course_id: str, user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = user["id"] if user else None
    return resolve_course_payload(course_id, user_id=user_id)

@router.post("/complete")
def complete_course_part(req: CourseCompleteReq, user: Dict[str, Any] = Depends(get_current_user)):
    now = datetime.now().isoformat()
    with get_user_db() as conn:
        conn.execute("""
            INSERT INTO completed_courses (
                user_id, course_id, part_id, title, topic_code,
                total_slides, correct_count, wrong_count, score_percentage,
                details_payload, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user["id"], req.course_id, req.part_id, req.title, req.topic_code or "---",
            req.total_slides, req.correct_count, req.wrong_count, req.score_percentage,
            req.details_payload or "", now
        ))
        conn.commit()

    # Automatically register into Spaced Repetition reviews (Fibonacci spaced repetition)
    review_info = record_part_review(
        user_id=user["id"],
        course_id=req.course_id,
        part_id=req.part_id,
        title=req.title,
        topic_code=req.topic_code or "---"
    )

    return {"success": True, "review": review_info}

@router.post("/import")
def import_custom_course(req: CourseImportReq, user: Dict[str, Any] = Depends(get_current_user)):
    now = datetime.now().isoformat()
    course_data = req.model_dump()
    with get_user_db() as conn:
        cur = conn.execute(
            "INSERT INTO imported_courses (user_id, title, topic_code, course_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (user["id"], req.title, req.topic_code, json.dumps(course_data, ensure_ascii=False), now)
        )
        conn.commit()
        return {"success": True, "course_id": f"custom-{cur.lastrowid}"}
