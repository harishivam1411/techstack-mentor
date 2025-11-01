from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API Keys
    openai_api_key: str
    anthropic_api_key: str = ""

    # Database
    database_url: str

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_db: int = 0

    # App Settings
    session_ttl: int = 1800  # 30 minutes
    max_questions_per_interview: int = 8
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
