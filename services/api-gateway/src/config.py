from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    #PostgreSQL
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "qkhenh"
    POSTGRES_PASSWORD: str = "quockhanh1"
    POSTGRES_DB: str = "wine_quality_assurance"
    
    #Kafka & Service
    KAFKA_BROKER: str = "kafka:9092"
    AI_SERVICE_URL: str = "http://ai-service:8080"
    
    #Auth
    ACCESS_TOKEN_SECRET: str = ""
    CLIENT_URL: str = ""
    
    class Config:
        env_file = ".env"
        
settings = Settings()


