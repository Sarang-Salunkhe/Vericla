from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "Vericla API"
    environment: Literal["development", "test", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    max_upload_size_bytes: int = Field(default=10 * 1024 * 1024, gt=0)
    document_chunk_size: int = Field(default=1500, ge=200, le=10_000)
    document_chunk_overlap: int = Field(default=200, ge=0)
    document_session_ttl_seconds: int = Field(default=3600, gt=0)
    max_pdf_pages: int = Field(default=500, gt=0)
    max_extracted_text_chars: int = Field(default=2_000_000, gt=0)
    ai_provider: Literal["openai", "fake"] = "openai"
    ai_api_key: SecretStr | None = None
    ai_base_url: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o-mini"
    ai_timeout_seconds: float = Field(default=30, gt=0, le=120)

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        env_prefix="VERICLA_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
