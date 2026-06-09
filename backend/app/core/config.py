"""App configuration — pure Python, no pydantic dependency."""

import os


class Settings:
    APP_NAME: str = "WellnessApp"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///D:/deepclaw/projects/wellness_app/backend/data/wellness.db"
    SECRET_KEY: str = "wellness-app-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL", self.DATABASE_URL)
        self.SECRET_KEY = os.getenv("SECRET_KEY", self.SECRET_KEY)
        self.DEBUG = os.getenv("DEBUG", "true").lower() == "true"


settings = Settings()
