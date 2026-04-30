"""Authentication routes and dependencies."""

from datetime import datetime, timedelta

import bcrypt as bcrypt_lib
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


class LoginRequest(BaseModel):
    """Login request with password."""

    password: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate with shared password and receive JWT."""
    if not settings.password_hash:
        raise HTTPException(
            status_code=500,
            detail="Authentication not configured. Set PASSWORD_HASH environment variable.",
        )

    if not bcrypt_lib.checkpw(
        request.password.encode(), settings.password_hash.encode()
    ):
        raise HTTPException(status_code=401, detail="Invalid password")

    expires = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode(
        {"exp": expires, "iat": datetime.utcnow()},
        settings.jwt_secret,
        algorithm="HS256",
    )
    return TokenResponse(access_token=token)


@router.get("/verify")
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Verify a JWT token is valid."""
    if not credentials:
        raise HTTPException(status_code=401, detail="No token provided")

    try:
        jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        return {"valid": True}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> bool:
    """Dependency to require valid JWT on protected routes."""
    # Skip auth in development if disabled
    if settings.auth_disabled:
        return True

    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        return True
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
