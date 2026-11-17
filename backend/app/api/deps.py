"""API dependencies for database sessions and authentication."""

from typing import Generator, Optional
from uuid import UUID
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthenticationError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.i18n.translator import translator
from app.models.user import User
from app.repositories.user_repo import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    db: Session = Depends(get_db),
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> User:
    """Validate JWT token and return authenticated User."""
    if not auth_header or not auth_header.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_header.credentials
    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise AuthenticationError("Invalid token subject")
        user_id = UUID(user_id_str)
    except (jwt.PyJWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or has been disabled",
        )
    return user


def get_optional_user(
    db: Session = Depends(get_db),
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[User]:
    """Return user if valid token present, otherwise None."""
    if not auth_header or not auth_header.credentials:
        return None
    try:
        payload = decode_access_token(auth_header.credentials)
        user_id = UUID(payload.get("sub"))
        user_repo = UserRepository(db)
        return user_repo.get_by_id(user_id)
    except Exception:
        return None


def get_language(
    request: Request,
    user: Optional[User] = Depends(get_optional_user),
) -> str:
    """
    Resolve requested language ('en' or 'bn') using the four-tier strategy:
    1. Explicit supported request parameter / X-Language header
    2. Accept-Language header
    3. User's saved preference
    4. English default ('en')
    """
    return translator.resolve_language(request, user)
