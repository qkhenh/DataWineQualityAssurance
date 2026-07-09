from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class QualityScore(BaseModel):
    model_config = {"frozen": True}
    score: float = Field(..., ge=0, le=10)
    confidence: float = Field(..., ge=0.0, le=1.0)
    
class WineMeasurement(BaseModel):
    model_config = {"populate_by_name": True}
    product_id: str
    warehouse_id: int
    line_id: int
    batch_id: int
    wine_type: str = Field(default="unknown", alias="type")
    fixed_acidity: float = Field(..., ge=0, alias="fixed acidity")
    volatile_acidity: float = Field(..., ge=0, alias="volatile acidity")
    citric_acid: float = Field(..., ge=0, alias="citric acid")
    residual_sugar: float = Field(..., ge=0, alias="residual sugar")
    chlorides: float = Field(..., ge=0)
    free_sulfur_dioxide: float = Field(..., ge=0, alias="free sulfur dioxide")
    total_sulfur_dioxide: float = Field(..., ge=0, alias="total sulfur dioxide")
    density: float = Field(..., ge=0)
    pH: float = Field(..., ge=0, le=14)
    sulphates: float = Field(..., ge=0)
    alcohol: float = Field(..., ge=0)
    quality: Optional[QualityScore] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("alcohol")
    @classmethod
    def validate_alcohol(cls, v: float) -> float:
        if v > 20: raise ValueError("Alcohol percentage cannot exceed 20%")
        return v

    def assign_quality(self, score: float, confidence: float) -> None:
        self.quality = QualityScore(score=score, confidence=confidence)