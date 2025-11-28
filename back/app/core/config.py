from functools import lru_cache
from typing import Any, List, Optional, Union

from pydantic import Field, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import API_PREFIX, APP_NAME, DEFAULT_CORS_ORIGINS, DEFAULT_ENVIRONMENT


class Settings(BaseSettings):
    app_name: str = APP_NAME
    environment: str = Field(default=DEFAULT_ENVIRONMENT, description="Application environment name")
    api_prefix: str = API_PREFIX
    cors_origins: List[str] = Field(
        default_factory=lambda: list(DEFAULT_CORS_ORIGINS),
        description="Allowed CORS origins for the frontend",
    )

    postgres_enabled: bool = Field(default=False, description="Toggle PostgreSQL connection")
    postgres_dsn: Optional[PostgresDsn] = Field(
        default=None,
        description="Async SQLAlchemy DSN for PostgreSQL, e.g. postgresql+asyncpg://user:pass@host:5432/db",
    )
    postgres_echo: bool = Field(default=False, description="Enable SQLAlchemy engine echo")

    neo4j_enabled: bool = Field(default=False, description="Toggle Neo4j connection")
    neo4j_uri: Optional[str] = Field(default=None, description="Bolt URI for Neo4j, e.g. bolt://localhost:7687")
    neo4j_user: Optional[str] = Field(default=None, description="Neo4j username")
    neo4j_password: Optional[str] = Field(default=None, description="Neo4j password")
    neo4j_database: Optional[str] = Field(default=None, description="Neo4j database name")

    mongo_enabled: bool = Field(default=False, description="Toggle MongoDB connection")
    mongo_dsn: Optional[str] = Field(default=None, description="MongoDB DSN, e.g. mongodb://user:pass@host:27017")
    mongo_database: Optional[str] = Field(default=None, description="Default MongoDB database name")

    redis_enabled: bool = Field(default=False, description="Toggle Redis connection")
    redis_dsn: Optional[RedisDsn] = Field(default=None, description="Redis DSN, e.g. redis://localhost:6379/0")
    redis_ssl: bool = Field(default=False, description="Whether to enforce SSL for Redis connections")

    # JWT 密钥配置
    jwt_secret_key: str = Field(description="JWT secret key for token signing and verification")

    # AI模型配置
    zhipu_api_key: Optional[str] = Field(default=None, description="Zhipu AI API Key")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API Key")

    # 项目启动配置
    project_startup_duration_hours: int = Field(default=1, description="项目启动默认时长（小时）")

    @property
    def cors_origins_as_list(self) -> list[str]:
        # 如果已经是列表，直接返回
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        # 如果是字符串，分割处理
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="APP_",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]


settings: Settings = get_settings()

