"""Authentication endpoints: login, register, and current user profile."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ResourceConflictError
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse

router = APIRouter()


@router.post("/login", response_model=Token, summary="Clinician Login")
def login(login_data: UserLogin, db: Session = Depends(get_db)) -> Token:
    """Authenticate clinician via email and password, returning JWT bearer token."""
    repo = UserRepository(db)
    user = repo.get_by_email(login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact hospital administrator.",
        )

    token = create_access_token(
        subject=str(user.id),
        claims={"role": user.role, "email": user.email, "name": user.full_name},
    )

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Register Clinician")
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> UserResponse:
    """Register a new doctor, clinical pharmacist, or reviewer."""
    repo = UserRepository(db)
    existing = repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{user_in.email}' is already registered.",
        )

    new_user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role=user_in.role,
        bmdc_number=user_in.bmdc_number,
        department=user_in.department,
        is_active=True,
    )
    created = repo.create(new_user)
    return UserResponse.model_validate(created)


@router.get("/me", response_model=UserResponse, summary="Get Current Clinician Profile")
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Retrieve authenticated user's profile and credentials."""
    return UserResponse.model_validate(current_user)
