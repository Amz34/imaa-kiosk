import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Imaa (إيماء) Sign Engine"
    API_V1_STR: str = "/api/v1"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-imaa-production-key-change-me")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/imaa_db")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/stgcn_imaa_v1.onnx")
    ALLOW_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
