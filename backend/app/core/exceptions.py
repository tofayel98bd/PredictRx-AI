"""Standardized application exceptions and error response models."""

from typing import Any, List, Optional
from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.core.logging import logger


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: dict[str, Any]


class PredictRxException(Exception):
    """Base exception for PredictRx-AI domain errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[List[dict[str, Any]]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or []


class EntityNotFoundException(PredictRxException):
    def __init__(self, entity_name: str, entity_id: Any):
        super().__init__(
            message=f"{entity_name} with identifier '{entity_id}' not found.",
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ResourceNotFoundError(EntityNotFoundException):
    def __init__(self, message: str = "Requested resource not found."):
        super(EntityNotFoundException, self).__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ResourceConflictError(PredictRxException):
    def __init__(self, message: str = "Resource conflict detected."):
        super().__init__(
            message=message,
            code="RESOURCE_CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
        )


class AuthenticationError(PredictRxException):
    def __init__(self, message: str = "Authentication failed or token invalid."):
        super().__init__(
            message=message,
            code="AUTHENTICATION_FAILED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class PermissionDeniedError(PredictRxException):
    def __init__(self, message: str = "Insufficient permissions to perform this action."):
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ValidationError(PredictRxException):
    def __init__(self, message: str, details: Optional[List[dict[str, Any]]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class FileValidationError(PredictRxException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            code="INVALID_FILE",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


async def predict_rx_exception_handler(request: Request, exc: PredictRxException) -> JSONResponse:
    logger.warning(f"Domain exception on {request.method} {request.url.path}: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error": {
                "code": exc.code,
                "details": exc.details,
            },
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        details.append({
            "code": err.get("type", "value_error"),
            "field": loc,
            "message": err.get("msg", "Invalid value"),
        })
    logger.warning(f"Request validation failure on {request.method} {request.url.path}: {details}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Request validation failed. Please check your parameters.",
            "error": {
                "code": "REQUEST_VALIDATION_ERROR",
                "details": details,
            },
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal error occurred while processing the clinical request.",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "details": [],
            },
        },
    )
