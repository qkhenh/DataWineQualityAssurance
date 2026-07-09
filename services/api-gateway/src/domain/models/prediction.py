from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Prediction(BaseModel):
    product_id: str 
    quality_score: float
    confidence: str
    quality_category: str
    model_id: int = 1
    time_predict: datetime = Field(default_factory=datetime.utcnow)