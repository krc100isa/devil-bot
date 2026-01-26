from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="CGOP_")

    app_name: str = "Casino Growth & Operations Platform"
    environment: str = "development"

    database_url: str = Field(
        default="postgresql+asyncpg://cgop:cgop@postgres:5432/cgop"
    )
    redis_url: str = Field(default="redis://redis:6379/0")
    secret_key: str = Field(default="change-me")


settings = Settings()
