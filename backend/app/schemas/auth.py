"""Authentication and user management schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserLogin(BaseModel):
    """Payload for clinician login."""

    email: EmailStr
    password: str = Field(..., min_length=6)


class UserCreate(BaseModel):
    """Payload for clinician registration."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field("doctor", description="doctor, clinical_pharmacist, reviewer, admin")
    bmdc_number: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)


class UserResponse(BaseModel):
    """Public user identity response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    role: str
    bmdc_number: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    """JWT bearer token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenPayload(BaseModel):
    """Decoded JWT payload."""

    sub: str
    exp: int
    role: Optional[str] = None
