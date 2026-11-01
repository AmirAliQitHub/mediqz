from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_user_db, get_or_create_telegram_user
from app.core.security import hash_password, verify_password, generate_salt, generate_session_token
from app.models.schemas import UserRegisterReq, UserLoginReq, UserResponse, TelegramAuthReq
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(req: UserRegisterReq):
    username = req.username.strip()
    if not username or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="نام کاربری و رمز عبور حداقل ۴ کاراکتر الزامی است.")

    disp_name = req.display_name.strip() if req.display_name else username
    is_su = 1 if (disp_name == "amirtaii8123" or username == "amirtaii8123") else 0
    access_lvl = "SUPERUSER" if is_su else "S2"

    with get_user_db() as conn:
        exists = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="این نام کاربری قبلاً ثبت شده است.")

        tg_user_id = None
        if username.isdigit():
            tg_user_id = int(username)
            exists_tg = conn.execute("SELECT id FROM users WHERE telegram_user_id = ?", (tg_user_id,)).fetchone()
            if exists_tg:
                raise HTTPException(status_code=400, detail="این شناسه کاربری تلگرام قبلاً ثبت شده است. لطفاً وارد شوید.")

        salt = generate_salt()
        pwd_hash = hash_password(req.password, salt)
        now = datetime.now().isoformat()

        cur = conn.execute(
            "INSERT INTO users (username, password_hash, salt, display_name, avatar_url, access_level, grade, is_onboarded, is_superuser, telegram_user_id, has_password, created_at) "
            "VALUES (?, ?, ?, ?, '', ?, '', 0, ?, ?, 1, ?)",
            (username, pwd_hash, salt, disp_name, access_lvl, is_su, tg_user_id, now)
        )
        user_id = cur.lastrowid
        token = generate_session_token()
        exp = (datetime.now() + timedelta(days=30)).isoformat()
        conn.execute("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                     (token, user_id, now, exp))
        conn.commit()

        return {
            "token": token,
            "user": {
                "id": user_id,
                "username": username,
                "display_name": disp_name,
                "avatar_url": "",
                "access_level": access_lvl,
                "grade": "",
                "is_onboarded": False,
                "is_superuser": bool(is_su),
                "telegram_user_id": tg_user_id,
                "has_password": True,
            },
            "needs_onboarding": True
        }

@router.post("/login")
def login(req: UserLoginReq):
    username = req.username.strip()
    with get_user_db() as conn:
        if username.isdigit():
            user = conn.execute(
                "SELECT * FROM users WHERE username = ? OR (telegram_user_id = ? AND telegram_user_id IS NOT NULL)",
                (username, int(username))
            ).fetchone()
        else:
            user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

        if not user or not verify_password(req.password, user["salt"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="نام کاربری یا رمز عبور اشتباه است.")

        token = generate_session_token()
        now = datetime.now().isoformat()
        exp = (datetime.now() + timedelta(days=30)).isoformat()
        conn.execute("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                     (token, user["id"], now, exp))
        conn.commit()

        is_su = bool(user["is_superuser"]) or (user["username"] == "amirtaii8123" or (user["display_name"] or "") == "amirtaii8123")
        access_lvl = "SUPERUSER" if is_su else (user["access_level"] or "S2")

        return {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "display_name": user["display_name"],
                "avatar_url": user["avatar_url"] or "",
                "access_level": access_lvl,
                "grade": user["grade"] or "",
                "is_onboarded": bool(user["is_onboarded"]),
                "is_superuser": is_su,
                "telegram_user_id": user["telegram_user_id"],
                "has_password": bool(user["has_password"]),
            },
            "needs_onboarding": not bool(user["is_onboarded"])
        }

@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    is_su = bool(current_user.get("is_superuser")) or (current_user.get("username") == "amirtaii8123" or current_user.get("display_name") == "amirtaii8123")
    access_lvl = "SUPERUSER" if is_su else (current_user.get("access_level") or "S2")
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "display_name": current_user["display_name"],
        "avatar_url": current_user["avatar_url"] or "",
        "access_level": access_lvl,
        "grade": current_user.get("grade") or "",
        "is_onboarded": bool(current_user.get("is_onboarded", 0)),
        "is_superuser": is_su,
        "telegram_user_id": current_user.get("telegram_user_id"),
        "has_password": bool(current_user.get("has_password", 0)),
    }

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    with get_user_db() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (current_user["session_token"],))
        conn.commit()
    return {"message": "با موفقیت خارج شدید."}

@router.post("/telegram")
def telegram_login(payload: dict):
    tg_id = payload.get("id") or payload.get("telegram_user_id")
    if not tg_id:
        raise HTTPException(status_code=400, detail="Telegram user ID required")
    try:
        tg_id_int = int(tg_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid Telegram user ID")

    tg_username = payload.get("username")
    first_name = payload.get("first_name", "")
    last_name = payload.get("last_name", "")
    full_name = f"{first_name or ''} {last_name or ''}".strip() or None

    with get_user_db() as conn:
        user = get_or_create_telegram_user(conn, tg_id_int, tg_username, full_name)
        user_id = user["id"]

        is_su = bool(user["is_superuser"]) or (user["username"] == "amirtaii8123" or (user["display_name"] or "") == "amirtaii8123")
        access_lvl = "SUPERUSER" if is_su else (user["access_level"] or "S2")

        token = generate_session_token()
        now = datetime.now().isoformat()
        exp = (datetime.now() + timedelta(days=60)).isoformat()
        conn.execute("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                     (token, user_id, now, exp))
        conn.commit()

        return {
            "token": token,
            "user": {
                "id": user_id,
                "username": user["username"],
                "display_name": user["display_name"] or user["username"],
                "avatar_url": user["avatar_url"] or "",
                "access_level": access_lvl,
                "grade": user["grade"] or "",
                "is_onboarded": bool(user["is_onboarded"]),
                "is_superuser": bool(is_su),
                "telegram_user_id": user["telegram_user_id"],
                "has_password": bool(user["has_password"]),
            },
            "needs_onboarding": not bool(user["is_onboarded"])
        }

@router.post("/onboarding")
def complete_onboarding(payload: dict, current_user: dict = Depends(get_current_user)):
    display_name = payload.get("display_name", "").strip()
    grade = payload.get("grade", "").strip()

    if not display_name:
        raise HTTPException(status_code=400, detail="نام و نام خانوادگی الزامی است.")
    if not grade:
        raise HTTPException(status_code=400, detail="انتخاب پایه تحصیلی الزامی است.")

    is_su = 1 if (display_name == "amirtaii8123" or current_user.get("username", "") == "amirtaii8123" or current_user.get("is_superuser", 0)) else 0
    access_lvl = "SUPERUSER" if is_su else "S2"

    with get_user_db() as conn:
        conn.execute("""
            UPDATE users 
            SET display_name = ?, grade = ?, is_onboarded = 1, is_superuser = ?, access_level = ?
            WHERE id = ?
        """, (display_name, grade, is_su, access_lvl, current_user["id"]))
        conn.commit()

    return {
        "success": True,
        "user": {
            "id": current_user["id"],
            "username": current_user["username"],
            "display_name": display_name,
            "avatar_url": current_user.get("avatar_url", ""),
            "access_level": access_lvl,
            "grade": grade,
            "is_onboarded": True,
            "is_superuser": bool(is_su),
            "telegram_user_id": current_user.get("telegram_user_id"),
            "has_password": bool(current_user.get("has_password", 0)),
        }
    }

@router.post("/set-password")
def set_password(payload: dict, current_user: dict = Depends(get_current_user)):
    new_pwd = payload.get("password", "").strip()
    if not new_pwd or len(new_pwd) < 4:
        raise HTTPException(status_code=400, detail="رمز عبور حداقل ۴ کاراکتر الزامی است.")

    salt = generate_salt()
    pwd_hash = hash_password(new_pwd, salt)
    with get_user_db() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ?, salt = ?, has_password = 1 WHERE id = ?",
            (pwd_hash, salt, current_user["id"])
        )
        conn.commit()
    return {"message": "رمز عبور نسخه وب با موفقیت تنظیم شد.", "has_password": True}


