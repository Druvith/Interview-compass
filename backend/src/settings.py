from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    google_api_key: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    data_dir: str = "backend/data"
    file_ready_timeout_seconds: int = 180
    file_ready_poll_interval_seconds: int = 2

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_prefix="",
        case_sensitive=False,
    )

    @property
    def effective_api_key(self) -> str:
        if self.gemini_api_key:
            return self.gemini_api_key
        if self.google_api_key:
            return self.google_api_key
        raise ValueError("Missing GEMINI_API_KEY or GOOGLE_API_KEY")


settings = Settings()
