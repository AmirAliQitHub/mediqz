from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_user_db
from app.core.security import hash_password, verify_password, generate_salt, generate_session_token
from app.models.schemas import UserRegisterReq, UserLoginReq, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Dict if False else dict)
def register(req: UserRegisterReq):
    username = req.username.strip()
    if not username or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="نام کاربری و رمز عبور حداقل ۴ کاراکتر الزامی است.")

    with get_user_db() as conn:
        exists = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="این نام کاربری قبلاً ثبت شده است.")

        salt = generate_salt()
        pwd_hash = hash_password(req.password, salt)
        disp_name = req.display_name.strip() if req.display_name else username
        now = datetime.now().isoformat()

        cur = conn.execute(
            "INSERT INTO users (username, password_hash, salt, display_name, avatar_url, access_level, created_at) "
            "VALUES (?, ?, ?, ?, '', 'S2', ?)",
            (username, pwd_hash, salt, disp_name, now)
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
                "access_level": "S2"
            }
        }

@router.post("/login")
def login(req: UserLoginReq):
    username = req.username.strip()
    with get_user_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user or not verify_password(req.password, user["salt"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="نام کاربری یا رمز عبور اشتباه است.")

        token = generate_session_token()
        now = datetime.now().isoformat()
        exp = (datetime.now() + timedelta(days=30)).isoformat()
        conn.execute("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                     (token, user["id"], now, exp))
        conn.commit()

        return {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "display_name": user["display_name"],
                "avatar_url": user["avatar_url"] or "",
                "access_level": user["access_level"] or "S2"
            }
        }

@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "display_name": current_user["display_name"],
        "avatar_url": current_user["avatar_url"] or "",
        "access_level": current_user["access_level"] or "S2"
    }

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    with get_user_db() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (current_user["session_token"],))
        conn.commit()
    return {"message": "با موفقیت خارج شدید."}
