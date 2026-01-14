import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import PolynomialFeatures
from sklearn.ensemble import VotingRegressor, BaggingRegressor
import lightgbm as lgb
from xgboost import XGBRegressor
import optuna
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, r2_score, mean_squared_error, mean_absolute_error
from sklearn.linear_model import Ridge
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
import warnings 
warnings.filterwarnings('ignore')
import time

# Check GPU availability
import torch
import tensorflow as tf
print(f"GPU Available: PyTorch = {torch.cuda.is_available()}, TensorFlow = {len(tf.config.list_physical_devices('GPU')) > 0}")

# GPU-enabled imports
import xgboost as xgb
import lightgbm as lgb
from sklearn.neural_network import MLPRegressor
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# ...existing preprocessing code...
url = "./winequalityN - Copy.csv"
df = pd.read_csv(url)

print("Dataset info:")
df.info()
print("Each class has: (instances)")
df['quality'].value_counts()
df.describe()

# Handle missing values (if any)
df_clean = df.copy()
numeric_columns = df_clean.select_dtypes(include=[np.number]).columns
for col in numeric_columns:
    if df_clean[col].isnull().sum() > 0:
        median_val = df_clean[col].median()
        df_clean[col].fillna(median_val, inplace=True)
        print(f"Filled {df[col].isnull().sum()} missing values in '{col}' with median: {median_val:.2f}")

# Handle categorical columns
from sklearn.preprocessing import LabelEncoder
categorical_columns = df_clean.select_dtypes(exclude=[np.number]).columns
print(f"Categorical columns found: {list(categorical_columns)}")

label_encoders = {}

for col in categorical_columns:
    if col != 'quality':  # Don't encode target variable
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col])
        label_encoders[col] = le
        print(f"Encoded column '{col}': {le.classes_}")

# Prepare features and target
X = df_clean.drop('quality', axis=1)
y = df_clean['quality']  # Keep original quality values (3-9)

print(f"Dataset shape: {X.shape}")
print(f"Target range: {y.min()} to {y.max()}")
print(f"Target distribution:")
print(y.value_counts().sort_index())

# Split data into training and test sets (80-20 split)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"\nTraining set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")

# Scale features for ANN and Ridge
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("\n" + "="*80)
print("GPU-ACCELERATED MACHINE LEARNING MODELS")
print("="*80)

# Define comprehensive evaluation function
def evaluate_model_comprehensive(y_true, y_pred, model_name, training_time=None):
    """Calculate comprehensive evaluation metrics"""
    r2 = r2_score(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    
    # Classification-style accuracy
    exact_match = np.mean(np.round(y_pred) == y_true) * 100
    within_05 = np.mean(np.abs(y_true - y_pred) <= 0.5) * 100
    within_10 = np.mean(np.abs(y_true - y_pred) <= 1.0) * 100
    within_15 = np.mean(np.abs(y_true - y_pred) <= 1.5) * 100
    
    # Additional metrics
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    explained_variance = 1 - np.var(y_true - y_pred) / np.var(y_true)
    
    print(f"\n📊 {model_name.upper()} PERFORMANCE METRICS:")
    print("-" * 60)
    print(f"R² Score:           {r2:.4f} ({r2*100:.1f}% variance explained)")
    print(f"RMSE:               {rmse:.4f}")
    print(f"MAE:                {mae:.4f}")
    print(f"MAPE:               {mape:.2f}%")
    print(f"Explained Variance: {explained_variance:.4f}")
    print(f"Exact Match:        {exact_match:.1f}%")
    print(f"Within ±0.5:        {within_05:.1f}%")
    print(f"Within ±1.0:        {within_10:.1f}%")
    print(f"Within ±1.5:        {within_15:.1f}%")
    if training_time:
        print(f"Training Time:      {training_time:.2f} seconds")
    
    return {
        'model': model_name,
        'r2': r2,
        'rmse': rmse,
        'mae': mae,
        'mape': mape,
        'explained_variance': explained_variance,
        'exact_match': exact_match,
        'within_05': within_05,
        'within_10': within_10,
        'within_15': within_15,
        'training_time': training_time or 0
    }

# Dictionary to store results
gpu_results = {}
# =============================================================================
# GPU-OPTIMIZED MODELS
# =============================================================================

# =============================================================================
# 1. XGBoost với GPU Acceleration
# =============================================================================
print("\n🚀 1. XGBoost GPU-Accelerated Training")
print("-" * 50)

def xgb_gpu_objective(trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 100, 500),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'reg_alpha': trial.suggest_float('reg_alpha', 0, 1),
        'reg_lambda': trial.suggest_float('reg_lambda', 0, 1)
    }
    
    # Try GPU first, fallback to CPU
    try:
        params['tree_method'] = 'gpu_hist'
        params['gpu_id'] = 0
        model = xgb.XGBRegressor(random_state=42, **params)
    except Exception as e:
        print(f"GPU not available for XGBoost, using CPU: {e}")
        params.pop('tree_method', None)
        params.pop('gpu_id', None)
        model = xgb.XGBRegressor(random_state=42, **params)
    
    score = cross_val_score(model, X_train, y_train, cv=3, scoring='r2')
    return score.mean()

print("Optimizing XGBoost with GPU acceleration...")
start_time = time.time()
xgb_gpu_study = optuna.create_study(direction='maximize')
xgb_gpu_study.optimize(xgb_gpu_objective, n_trials=50)
xgb_gpu_time = time.time() - start_time

# Train best XGBoost model
xgb_gpu_params = xgb_gpu_study.best_params
try:
    xgb_gpu_params['tree_method'] = 'gpu_hist'
    xgb_gpu_params['gpu_id'] = 0
    xgb_gpu_model = xgb.XGBRegressor(random_state=42, **xgb_gpu_params)
    print("✅ Using GPU acceleration for XGBoost")
except:
    xgb_gpu_params.pop('tree_method', None)
    xgb_gpu_params.pop('gpu_id', None)
    xgb_gpu_model = xgb.XGBRegressor(random_state=42, **xgb_gpu_params)
    print("⚠️ Using CPU for XGBoost (GPU not available)")

xgb_gpu_model.fit(X_train, y_train)
xgb_gpu_pred = xgb_gpu_model.predict(X_test)
gpu_results['XGBoost_GPU'] = evaluate_model_comprehensive(y_test, xgb_gpu_pred, 'XGBoost GPU', xgb_gpu_time)
    }
    
    model = xgb.XGBRegressor(random_state=42, **params)
    score = cross_val_score(model, X_train, y_train, cv=3, scoring='r2')
    return score.mean()

# 2. LightGBM với GPU  
def lgb_gpu_objective(trial):
    params = {
        'num_leaves': trial.suggest_int('num_leaves', 31, 100),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 100, 500),
        'device': 'gpu',  # GPU acceleration
        'gpu_platform_id': 0,
        'gpu_device_id': 0
    }
    
    model = lgb.LGBMRegressor(random_state=42, **params)
    score = cross_val_score(model, X_train, y_train, cv=3, scoring='r2')
    return score.mean()

# 3. TensorFlow/Keras Deep Neural Network
def create_deep_model(trial):
    with tf.device('/GPU:0'):  # Force GPU usage
        model = Sequential()
        
        # Input layer
        model.add(Dense(trial.suggest_int('units_1', 64, 512), 
                       activation='relu', input_shape=(X_train_scaled.shape[1],)))
        model.add(BatchNormalization())
        model.add(Dropout(trial.suggest_float('dropout_1', 0.1, 0.5)))
        
        # Hidden layers
        n_layers = trial.suggest_int('n_layers', 1, 4)
        for i in range(n_layers):
            model.add(Dense(trial.suggest_int(f'units_{i+2}', 32, 256), activation='relu'))
            model.add(BatchNormalization())
            model.add(Dropout(trial.suggest_float(f'dropout_{i+2}', 0.1, 0.5)))
        
        # Output layer
        model.add(Dense(1, activation='linear'))
        
        # Compile with GPU-optimized settings
        model.compile(
            optimizer=Adam(learning_rate=trial.suggest_float('lr', 1e-5, 1e-2, log=True)),
            loss='mse',
            metrics=['mae']
        )
        
        return model

def keras_gpu_objective(trial):
    model = create_deep_model(trial)
    
    # Callbacks
    early_stopping = EarlyStopping(patience=20, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(patience=10, factor=0.5)
    
    # Train on GPU
    with tf.device('/GPU:0'):
        history = model.fit(
            X_train_scaled, y_train,
            validation_split=0.2,
            epochs=100,
            batch_size=trial.suggest_categorical('batch_size', [32, 64, 128]),
            callbacks=[early_stopping, reduce_lr],
            verbose=0
        )
    
    # Evaluate
    val_loss = min(history.history['val_loss'])
    return -val_loss  # Optuna maximizes, so negate loss

# 4. PyTorch Neural Network
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class PyTorchNet(nn.Module):
    def __init__(self, input_dim, hidden_dims, dropout_rate):
        super().__init__()
        layers = []
        prev_dim = input_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout_rate))
            prev_dim = hidden_dim
        
        layers.append(nn.Linear(prev_dim, 1))
        self.network = nn.Sequential(*layers)
    
    def forward(self, x):
        return self.network(x)

def pytorch_gpu_objective(trial):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Architecture
    hidden_dims = []
    n_layers = trial.suggest_int('n_layers', 2, 5)
    for i in range(n_layers):
        hidden_dims.append(trial.suggest_int(f'hidden_{i}', 64, 512))
    
    # Hyperparameters
    lr = trial.suggest_float('lr', 1e-5, 1e-2, log=True)
    dropout = trial.suggest_float('dropout', 0.1, 0.5)
    batch_size = trial.suggest_categorical('batch_size', [32, 64, 128])
    
    # Model
    model = PyTorchNet(X_train_scaled.shape[1], hidden_dims, dropout).to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()
    
    # Data loaders
    train_data = TensorDataset(torch.FloatTensor(X_train_scaled), torch.FloatTensor(y_train.values))
    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True)
    
    # Training
    model.train()
    for epoch in range(50):  # Reduced for optuna speed
        total_loss = 0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            outputs = model(batch_x).squeeze()
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
    
    # Validation
    model.eval()
    with torch.no_grad():
        val_x = torch.FloatTensor(X_test_scaled).to(device)
        val_pred = model(val_x).cpu().numpy().squeeze()
        val_score = r2_score(y_test, val_pred)
    
    return val_score