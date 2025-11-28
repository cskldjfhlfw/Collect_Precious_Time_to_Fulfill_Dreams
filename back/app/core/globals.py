"""Global variables and runtime configuration for the Research Achievement Management System.

This module contains:
1. Application-wide global variables
2. Runtime configuration settings
3. Feature flags and toggles
4. System-wide constants that may change during runtime

Note: For static constants, use app.core.constants instead.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import os

# =============================================================================
# Application Runtime Settings
# =============================================================================

# Application metadata
APP_VERSION: str = "1.0.0"
APP_BUILD_DATE: str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
APP_AUTHOR: str = "Research Team"
APP_DESCRIPTION: str = "科研成果管理系统 - Research Achievement Management System"

# =============================================================================
# Feature Flags
# =============================================================================

class FeatureFlags:
    """Feature toggles for enabling/disabling functionality."""
    
    # API Features
    ENABLE_API_RATE_LIMITING: bool = True
    ENABLE_API_CACHING: bool = True
    ENABLE_API_DOCUMENTATION: bool = True
    
    # Database Features
    ENABLE_DATABASE_LOGGING: bool = False
    ENABLE_QUERY_OPTIMIZATION: bool = True
    ENABLE_CONNECTION_POOLING: bool = True
    
    # Search and Analytics
    ENABLE_FULL_TEXT_SEARCH: bool = True
    ENABLE_ANALYTICS_TRACKING: bool = True
    ENABLE_EXPORT_FUNCTIONALITY: bool = True
    
    # Knowledge Graph
    ENABLE_KNOWLEDGE_GRAPH: bool = True
    ENABLE_GRAPH_VISUALIZATION: bool = True
    ENABLE_RELATIONSHIP_ANALYSIS: bool = True
    
    # File Management
    ENABLE_FILE_UPLOAD: bool = True
    ENABLE_FILE_PREVIEW: bool = True
    ENABLE_FILE_COMPRESSION: bool = True
    
    # Security Features
    ENABLE_JWT_AUTHENTICATION: bool = True
    ENABLE_ROLE_BASED_ACCESS: bool = True
    ENABLE_AUDIT_LOGGING: bool = True


# =============================================================================
# System Configuration
# =============================================================================

class SystemConfig:
    """System-wide configuration settings."""
    
    # File Upload Settings
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_FILE_EXTENSIONS: tuple = (
        '.pdf', '.doc', '.docx', '.txt', '.md',
        '.jpg', '.jpeg', '.png', '.gif',
        '.xls', '.xlsx', '.csv',
        '.zip', '.rar', '.7z'
    )
    
    # Pagination Settings
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Cache Settings
    CACHE_TTL_SECONDS: int = 3600  # 1 hour
    CACHE_MAX_ENTRIES: int = 10000
    
    # Search Settings
    SEARCH_RESULTS_LIMIT: int = 1000
    SEARCH_TIMEOUT_SECONDS: int = 30
    
    # Export Settings
    EXPORT_BATCH_SIZE: int = 1000
    EXPORT_TIMEOUT_MINUTES: int = 30


# =============================================================================
# Database Configuration
# =============================================================================

class DatabaseConfig:
    """Database-specific configuration settings."""
    
    # Connection Pool Settings
    POSTGRES_POOL_SIZE: int = 10
    POSTGRES_MAX_OVERFLOW: int = 20
    POSTGRES_POOL_TIMEOUT: int = 30
    
    # MongoDB Settings
    MONGO_MAX_POOL_SIZE: int = 100
    MONGO_MIN_POOL_SIZE: int = 10
    MONGO_SERVER_SELECTION_TIMEOUT_MS: int = 5000
    
    # Redis Settings
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_SOCKET_TIMEOUT: int = 5
    REDIS_SOCKET_CONNECT_TIMEOUT: int = 5
    
    # Neo4j Settings
    NEO4J_MAX_CONNECTION_LIFETIME: int = 3600
    NEO4J_MAX_CONNECTION_POOL_SIZE: int = 100
    NEO4J_CONNECTION_ACQUISITION_TIMEOUT: int = 60


# =============================================================================
# API Configuration
# =============================================================================

class APIConfig:
    """API-specific configuration settings."""
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_BURST: int = 200
    
    # Request/Response Settings
    MAX_REQUEST_SIZE_MB: int = 10
    REQUEST_TIMEOUT_SECONDS: int = 30
    
    # CORS Settings (runtime overrides)
    ADDITIONAL_CORS_ORIGINS: list = []
    
    # API Versioning
    API_VERSION: str = "v1"
    SUPPORTED_API_VERSIONS: list = ["v1"]


# =============================================================================
# Logging Configuration
# =============================================================================

class LoggingConfig:
    """Logging configuration settings."""
    
    # Log Levels
    DEFAULT_LOG_LEVEL: str = "INFO"
    DATABASE_LOG_LEVEL: str = "WARNING"
    API_LOG_LEVEL: str = "INFO"
    
    # Log Rotation
    LOG_FILE_MAX_SIZE_MB: int = 100
    LOG_FILE_BACKUP_COUNT: int = 5
    
    # Log Formats
    CONSOLE_LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    FILE_LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"


# =============================================================================
# Security Configuration
# =============================================================================

class SecurityConfig:
    """Security-related configuration settings."""
    
    # JWT Settings
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password Settings
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_NUMBERS: bool = True
    PASSWORD_REQUIRE_SPECIAL_CHARS: bool = True
    
    # Session Settings
    SESSION_TIMEOUT_MINUTES: int = 60
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15


# =============================================================================
# Runtime State
# =============================================================================

class RuntimeState:
    """Runtime state and statistics."""
    
    def __init__(self):
        self.startup_time: datetime = datetime.now()
        self.request_count: int = 0
        self.error_count: int = 0
        self.active_connections: Dict[str, int] = {
            "postgres": 0,
            "mongodb": 0,
            "redis": 0,
            "neo4j": 0
        }
        self.cache_stats: Dict[str, Any] = {
            "hits": 0,
            "misses": 0,
            "size": 0
        }
    
    @property
    def uptime(self) -> timedelta:
        """Get application uptime."""
        return datetime.now() - self.startup_time
    
    def increment_request_count(self) -> None:
        """Increment the request counter."""
        self.request_count += 1
    
    def increment_error_count(self) -> None:
        """Increment the error counter."""
        self.error_count += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get runtime statistics."""
        return {
            "startup_time": self.startup_time.isoformat(),
            "uptime_seconds": self.uptime.total_seconds(),
            "request_count": self.request_count,
            "error_count": self.error_count,
            "active_connections": self.active_connections.copy(),
            "cache_stats": self.cache_stats.copy()
        }


# =============================================================================
# Global Instances
# =============================================================================

# Create global instances
feature_flags = FeatureFlags()
system_config = SystemConfig()
database_config = DatabaseConfig()
api_config = APIConfig()
logging_config = LoggingConfig()
security_config = SecurityConfig()
runtime_state = RuntimeState()


# =============================================================================
# Utility Functions
# =============================================================================

def get_environment_info() -> Dict[str, Any]:
    """Get environment information."""
    return {
        "python_version": os.sys.version,
        "platform": os.sys.platform,
        "cwd": os.getcwd(),
        "pid": os.getpid(),
        "environment_variables": {
            key: value for key, value in os.environ.items()
            if key.startswith(('APP_', 'PYTHON_', 'PATH'))
        }
    }


def update_feature_flag(flag_name: str, value: bool) -> bool:
    """Update a feature flag value."""
    if hasattr(feature_flags, flag_name):
        setattr(feature_flags, flag_name, value)
        return True
    return False


def get_all_config() -> Dict[str, Any]:
    """Get all configuration as a dictionary."""
    return {
        "app_info": {
            "version": APP_VERSION,
            "build_date": APP_BUILD_DATE,
            "author": APP_AUTHOR,
            "description": APP_DESCRIPTION
        },
        "feature_flags": {
            attr: getattr(feature_flags, attr)
            for attr in dir(feature_flags)
            if not attr.startswith('_') and isinstance(getattr(feature_flags, attr), bool)
        },
        "system_config": {
            attr: getattr(system_config, attr)
            for attr in dir(system_config)
            if not attr.startswith('_') and not callable(getattr(system_config, attr))
        },
        "database_config": {
            attr: getattr(database_config, attr)
            for attr in dir(database_config)
            if not attr.startswith('_') and not callable(getattr(database_config, attr))
        },
        "api_config": {
            attr: getattr(api_config, attr)
            for attr in dir(api_config)
            if not attr.startswith('_') and not callable(getattr(api_config, attr))
        },
        "runtime_stats": runtime_state.get_stats(),
        "environment": get_environment_info()
    }
