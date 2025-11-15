from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


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
    max_questions_per_interview: int = 5
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"

    # Audio Settings
    audio_recordings_dir: str = "audio_files/recordings"
    audio_responses_dir: str = "audio_files/responses"
    max_audio_file_size_mb: int = 10  # 10 MB
    supported_audio_formats: list = [".mp3", ".wav", ".webm", ".m4a", ".ogg"]
    openai_tts_model: str = "tts-1"  # options: tts-1, tts-1-hd
    openai_tts_voice: str = "alloy"  # options: alloy, echo, fable, onyx, nova, shimmer
    openai_whisper_model: str = "whisper-1"

    @property
    def audio_recordings_path(self) -> Path:
        return Path(self.audio_recordings_dir)

    @property
    def audio_responses_path(self) -> Path:
        return Path(self.audio_responses_dir)

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
