from datetime import datetime
from typing import Dict, Optional
from fastapi import Header, HTTPException, status
from app.core.database import get_user_db

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توکن نشست ارسال نشده است یا نامعتبر است."
        )
    token = authorization.split(" ")[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توکن نشست نامعتبر است."
        )

    with get_user_db() as conn:
        session = conn.execute(
            "SELECT user_id, expires_at FROM sessions WHERE token = ?", (token,)
        ).fetchone()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="نشست شما منقضی شده است یا معتبر نیست."
            )

        if session["expires_at"]:
            try:
                exp_dt = datetime.fromisoformat(str(session["expires_at"]))
                if datetime.now() > exp_dt:
                    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
                    conn.commit()
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="نشست شما منقضی شده است. لطفاً مجدداً وارد شوید."
                    )
            except (ValueError, TypeError):
                pass

        user = conn.execute(
            "SELECT id, username, display_name, avatar_url, access_level, grade, is_onboarded, is_superuser, telegram_user_id, telegram_username, has_password FROM users WHERE id = ?",
            (session["user_id"],)
        ).fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="کاربر یافت نشد."
            )

        user_dict = dict(user)
        user_dict["session_token"] = token
        return user_dict

async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None

async def require_superuser(authorization: Optional[str] = Header(None)) -> Dict:
    user = await get_current_user(authorization)
    if not user.get("is_superuser") and user.get("access_level") != "SUPERUSER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی به این بخش نیازمند سطح مدیر ارشد (Superuser) است."
        )
    return user

