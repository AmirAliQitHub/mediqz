from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.core.database import get_user_db
from app.api.deps import require_superuser

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def get_all_users(admin_user: dict = Depends(require_superuser)) -> Dict[str, Any]:
    with get_user_db() as conn:
        rows = conn.execute("""
            SELECT id, username, display_name, grade, is_onboarded, is_superuser, access_level, created_at
            FROM users
            ORDER BY id DESC
        """).fetchall()

        users_list = []
        for r in rows:
            users_list.append({
                "id": r["id"],
                "username": r["username"],
                "display_name": r["display_name"] or r["username"],
                "grade": r["grade"] or "مشخص نشده",
                "is_onboarded": bool(r["is_onboarded"]),
                "is_superuser": bool(r["is_superuser"]),
                "access_level": r["access_level"] or "S2",
                "created_at": r["created_at"],
            })
        return {
            "users": users_list,
            "total": len(users_list)
        }


@router.get("/stats")
def get_admin_stats(admin_user: dict = Depends(require_superuser)) -> Dict[str, Any]:
    with get_user_db() as conn:
        total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        onboarded_users = conn.execute("SELECT COUNT(*) FROM users WHERE is_onboarded = 1").fetchone()[0]
        total_reviews = conn.execute("SELECT COUNT(*) FROM part_reviews").fetchone()[0]

        grade_distribution = {}
        for g in ["10", "11", "12", "konkur"]:
            c = conn.execute("SELECT COUNT(*) FROM users WHERE grade = ?", (g,)).fetchone()[0]
            grade_distribution[g] = c

        return {
            "total_users": total_users,
            "onboarded_users": onboarded_users,
            "total_reviews": total_reviews,
            "grade_distribution": grade_distribution,
        }
