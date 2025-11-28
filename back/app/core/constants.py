"""Global constants for application-level configuration defaults."""

from typing import Final, Tuple

APP_NAME: Final[str] = "Research Achievement Management API"
DEFAULT_ENVIRONMENT: Final[str] = "development"
API_PREFIX: Final[str] = "/api"
DEFAULT_CORS_ORIGINS: Final[Tuple[str, ...]] = ("http://localhost:5173",)
