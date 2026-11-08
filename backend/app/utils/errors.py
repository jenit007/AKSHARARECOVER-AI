"""Custom exception classes and FastAPI exception handlers."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from typing import Any
import logging
import traceback

logger = logging.getLogger("akshararecover.errors")


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        message: str = "An internal error occurred",
        details: Any = None,
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details
        super().__init__(message)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", details: Any = None):
        super().__init__(422, "VALIDATION_ERROR", message, details)


class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication required", details: Any = None):
        super().__init__(401, "UNAUTHORIZED", message, details)


class AuthorizationError(AppException):
    def __init__(self, message: str = "You do not have permission to access this resource", details: Any = None):
        super().__init__(403, "FORBIDDEN", message, details)


class RateLimitError(AppException):
    def __init__(self, message: str = "Too many requests. Please wait before trying again.", details: Any = None):
        super().__init__(429, "RATE_LIMIT_EXCEEDED", message, details)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", details: Any = None):
        super().__init__(404, "NOT_FOUND", message, details)


class FileTypeError(AppException):
    def __init__(self, message: str = "Unsupported file type"):
        super().__init__(415, "UNSUPPORTED_MEDIA_TYPE", message)


class FileTooLargeError(AppException):
    def __init__(self, message: str = "File too large"):
        super().__init__(413, "FILE_TOO_LARGE", message)


class ProcessingError(AppException):
    def __init__(self, message: str = "Processing failed", details: Any = None):
        super().__init__(500, "PROCESSING_ERROR", message, details)


class ServiceUnavailableError(AppException):
    def __init__(self, message: str = "Service unavailable", details: Any = None):
        super().__init__(503, "SERVICE_UNAVAILABLE", message, details)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflict", details: Any = None):
        super().__init__(409, "CONFLICT", message, details)


def make_error_response(
    status_code: int, message: str, error_code: str, details: Any = None
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": None,
            "error": {"code": error_code, "details": details if details else []},
        },
    )


def register_exception_handlers(app: FastAPI):
    """Attach exception handlers to the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.warning("AppException: %s - %s", exc.error_code, exc.message)
        return make_error_response(
            exc.status_code, exc.message, exc.error_code, exc.details
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(
            "Unhandled exception: %s: %s\n%s",
            type(exc).__name__,
            exc,
            traceback.format_exc(),
        )
        return make_error_response(500, "An internal error occurred", "INTERNAL_ERROR")

    from fastapi.exceptions import RequestValidationError

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        details = []
        for err in exc.errors():
            details.append(
                {
                    "field": ".".join(str(loc) for loc in err.get("loc", [])),
                    "message": err.get("msg", ""),
                    "type": err.get("type", ""),
                }
            )
        return make_error_response(422, "Validation failed", "VALIDATION_ERROR", details)
