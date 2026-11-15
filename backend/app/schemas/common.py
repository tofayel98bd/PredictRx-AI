"""Common standardized response envelopes and pagination schemas."""

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict
from app.core.constants import MEDICAL_SAFETY_DISCLAIMER

T = TypeVar("T")


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully."
    data: Optional[T] = None
    meta: Optional[dict[str, Any]] = None
    disclaimer: str = MEDICAL_SAFETY_DISCLAIMER


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Records retrieved successfully."
    data: List[T]
    meta: PaginationMeta
    disclaimer: str = MEDICAL_SAFETY_DISCLAIMER
