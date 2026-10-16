import hashlib
import secrets

def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    computed = hash_password(password, salt)
    return secrets.compare_digest(computed, password_hash)

def generate_salt() -> str:
    return secrets.token_hex(16)

def generate_session_token() -> str:
    return secrets.token_hex(32)
