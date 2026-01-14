import pandas as pd
import numpy as np
import optuna
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os
import warnings

warnings.filterwarnings('ignore')

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "../../winequalityN - Copy.csv")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "../artifacts")

def load_data(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}")
    return pd.read_csv(path)

def preprocess_data(df):
    print("Preprocessing data...")
    df_clean = df.copy()
    
    # 1. Handle Missing Values (Median Imputation)
    numeric_columns = df_clean.select_dtypes(include=[np.number]).columns
    imputation_values = {}
    for col in numeric_columns:
        if df_clean[col].isnull().sum() > 0:
            median_val = df_clean[col].median()
            df_clean[col].fillna(median_val, inplace=True)
            imputation_values[col] = median_val
    
    # 2. Handle Categorical Columns (Label Encoding)
    categorical_columns = df_clean.select_dtypes(exclude=[np.number]).columns
    label_encoders = {}
    
    for col in categorical_columns:
        if col != 'quality':
            le = LabelEncoder()
            df_clean[col] = le.fit_transform(df_clean[col])
            label_encoders[col] = le
            print(f"Encoded {col}: {le.classes_}")

    # 3. Split Features and Target
    X = df_clean.drop('quality', axis=1)
    y = df_clean['quality']
    
    # 4. Scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Return processed data and artifacts needed for inference
    return X_scaled, y, scaler, label_encoders, imputation_values, X.columns

def optimize_xgboost(X, y, n_trials=20):
    print(f"Starting XGBoost optimization with {n_trials} trials...")
    
    def objective(trial):
        params = {
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
            'n_estimators': trial.suggest_int('n_estimators', 50, 200),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'gamma': trial.suggest_float('gamma', 0, 1),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 1),
            'reg_lambda': trial.suggest_float('reg_lambda', 0.1, 1),
            'n_jobs': -1,
            'random_state': 42
        }
        
        model = XGBRegressor(**params)
        score = cross_val_score(model, X, y, cv=5, scoring='r2')
        return score.mean()

    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials)
    
    print(f"Best params: {study.best_params}")
    print(f"Best R2: {study.best_value}")
    return study.best_params

def train_and_save():
    # Ensure artifacts directory exists
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    # Load
    df = load_data(DATA_PATH)
    
    # Preprocess
    X_scaled, y, scaler, label_encoders, imputation_values, feature_names = preprocess_data(df)
    
    # Split for final evaluation
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    
    # Optimize
    best_params = optimize_xgboost(X_train, y_train, n_trials=20)
    
    # Train Final Model
    print("Training final model...")
    final_model = XGBRegressor(**best_params, random_state=42)
    final_model.fit(X_train, y_train)
    
    # Evaluate
    preds = final_model.predict(X_test)
    r2 = r2_score(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    print(f"Final Model Performance - R2: {r2:.4f}, RMSE: {rmse:.4f}")
    
    # Save Artifacts
    print("Saving artifacts...")
    joblib.dump(final_model, os.path.join(ARTIFACTS_DIR, 'xgb_model.joblib'))
    joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, 'scaler.joblib'))
    joblib.dump(label_encoders, os.path.join(ARTIFACTS_DIR, 'label_encoders.joblib'))
    joblib.dump(imputation_values, os.path.join(ARTIFACTS_DIR, 'imputation_values.joblib'))
    joblib.dump(feature_names, os.path.join(ARTIFACTS_DIR, 'feature_names.joblib'))
    print(f"Artifacts saved to {ARTIFACTS_DIR}")

if __name__ == "__main__":
    train_and_save()
