import pandas as pd
import numpy as np
import joblib
import os
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from .schemas import WineInput, PredictionOutput

# Global variables to hold artifacts
model = None
scaler = None
label_encoders = None
imputation_values = None
feature_names = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load artifacts on startup
    global model, scaler, label_encoders, imputation_values, feature_names
    try:
        abs_artifacts_dir = os.path.abspath(ARTIFACTS_DIR)
        print(f"Loading AI models and artifacts from: {abs_artifacts_dir}")
        
        if not os.path.exists(abs_artifacts_dir):
             print(f"ERROR: Artifacts directory not found at {abs_artifacts_dir}")
             
        model = joblib.load(os.path.join(abs_artifacts_dir, 'xgb_model.joblib'))
        scaler = joblib.load(os.path.join(abs_artifacts_dir, 'scaler.joblib'))
        label_encoders = joblib.load(os.path.join(abs_artifacts_dir, 'label_encoders.joblib'))
        imputation_values = joblib.load(os.path.join(abs_artifacts_dir, 'imputation_values.joblib'))
        feature_names = joblib.load(os.path.join(abs_artifacts_dir, 'feature_names.joblib'))
        print("Artifacts loaded successfully.")
    except Exception as e:
        print(f"Error loading artifacts: {e}")
        print("Ensure you have run the training script first!")
    
    yield
    
    # Clean up on shutdown
    model = None

app = FastAPI(title="Wine Quality Prediction Service", lifespan=lifespan)

@app.get("/")
def health_check():
    return {"status": "running", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionOutput)
def predict_quality(wine: WineInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # 1. Convert input to DataFrame
        # by_alias=True ensures we get keys like "fixed acidity" matching the schema aliases
        input_data = wine.model_dump(by_alias=True)
        df = pd.DataFrame([input_data])

        # 2. Preprocessing (Must match training logic exactly)
        
        # Handle Categorical (Type)
        if 'type' in df.columns and 'type' in label_encoders:
            le = label_encoders['type']
            # Handle unseen labels safely
            try:
                df['type'] = le.transform(df['type'])
            except ValueError:
                # Fallback for unseen label, e.g., map to most common or 0
                df['type'] = 0 

        # Ensure column order matches training
        # Reorder columns to match feature_names
        df = df[feature_names]

        # Scale features
        X_scaled = scaler.transform(df)

        # 3. Predict
        prediction = model.predict(X_scaled)
        quality_score = float(prediction[0])

        return {
            "quality_score": quality_score,
            "quality_class": int(round(quality_score))
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
