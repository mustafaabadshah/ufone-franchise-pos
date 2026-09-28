import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ufone Franchise POS & Operations System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-telecom-franchise-jwt-key-9988776655")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./franchise_pos.db")
    
    DEFAULT_FRANCHISE_NAME: str = "Ufone Franchise - Dargai Office"
    DEFAULT_BRANCH: str = "Dargai Office"
    DEFAULT_CURRENCY: str = "PKR"
    DEFAULT_PHONE: str = "+92 333 9123456"
    
    class Config:
        case_sensitive = True

settings = Settings()
