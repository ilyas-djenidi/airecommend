import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Recycle Routing Engine Pro"
    VERSION: str = "2.0.0"
    
    # Validation & Defaults
    AVG_SPEED_KMH: float = 25.0
    SERVICE_TIME_MIN: int = 5
    USE_ORTOOLS: bool = False
    
    # OSRM
    OSRM_BASE_URL: Optional[str] = None  # e.g., "http://localhost:5000"
    OSRM_TIMEOUT_SEC: float = 2.0
    
    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
