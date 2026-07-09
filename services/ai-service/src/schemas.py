from pydantic import BaseModel, Field

class WineInput(BaseModel):
    type: str = Field(..., description="Type of wine (e.g., 'white', 'red')")
    fixed_acidity: float = Field(..., alias="fixed acidity")
    volatile_acidity: float = Field(..., alias="volatile acidity")
    citric_acid: float = Field(..., alias="citric acid")
    residual_sugar: float = Field(..., alias="residual sugar")
    chlorides: float
    free_sulfur_dioxide: float = Field(..., alias="free sulfur dioxide")
    total_sulfur_dioxide: float = Field(..., alias="total sulfur dioxide")
    density: float
    pH: float
    sulphates: float
    alcohol: float

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "type": "white",
                "fixed acidity": 7.0,
                "volatile acidity": 0.27,
                "citric acid": 0.36,
                "residual sugar": 20.7,
                "chlorides": 0.045,
                "free sulfur dioxide": 45.0,
                "total sulfur dioxide": 170.0,
                "density": 1.001,
                "pH": 3.0,
                "sulphates": 0.45,
                "alcohol": 8.8
            }
        }

class PredictionOutput(BaseModel):
    quality_score: float
    quality_class: int
