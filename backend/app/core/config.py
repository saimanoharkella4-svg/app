import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CogniTrack Field Operations & Telemetry"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security & JWT
    SECRET_KEY: str = "fst_super_secret_production_key_extrahand_2026_x92k"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    DATABASE_URL: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "Manohar"
    DB_NAME: str = "cognitrack"
    
    @model_validator(mode="after")
    def assemble_db_connection(self) -> "Settings":
        if not self.DATABASE_URL:
            # Default to tmp SQLite on serverless if DATABASE_URL env is not set
            self.DATABASE_URL = "sqlite:////tmp/fst.db"
        return self
    
    # Redis / In-Memory PubSub
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_IN_MEMORY_REDIS_FALLBACK: bool = True
    
    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "*"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]
    
    # GPS Tracking & Battery Configuration
    TRACKING_INTERVAL_SECONDS: int = 180       # 3 minutes default (configurable 2-5 min)
    STATIONARY_INTERVAL_SECONDS: int = 600      # 10 minutes when stationary
    MIN_MOVEMENT_METERS: float = 20.0          # Minimum displacement in meters
    ACCURACY_THRESHOLD_METERS: float = 50.0    # Reject or flag points worse than 50m
    MAX_REALISTIC_SPEED_KMH: float = 140.0     # Flag speeds above 140 km/h as anomaly
    BATCH_SIZE_DEFAULT: int = 20
    
    # Retention Strategy (Months)
    DATA_RETENTION_MONTHS: int = 3
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
