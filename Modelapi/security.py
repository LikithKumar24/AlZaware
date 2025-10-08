# security.py (Simplified Version - NO HASHING)

from datetime import datetime, timedelta, timezone
from jose import jwt

# --- Hashing is REMOVED for simplicity ---
# WARNING: This is not secure for production. Passwords are stored in plain text.

def hash_password(password: str):
    # We are not hashing, just returning the password as-is.
    return password

def verify_password(plain_password: str, stored_password: str):
    # Simple string comparison.
    return plain_password == stored_password

# --- JWT Token Creation (Stays the same) ---
SECRET_KEY = "a_very_secret_key_change_this_later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt