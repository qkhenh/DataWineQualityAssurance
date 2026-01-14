import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from xgboost import XGBRegressor
import optuna
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, r2_score, mean_squared_error, mean_absolute_error
from sklearn.linear_model import Ridge
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
import warnings 
warnings.filterwarnings('ignore')
import time

url = "./winequalityN - Copy.csv"
df = pd.read_csv(url)

print("Dataset info:")
df.info()
print("Each class has: (instances)")
df['quality'].value_counts()
df.describe()

import math

# Assuming 'df' is your DataFrame
numerical_cols = df.select_dtypes(include=['float64', 'int64']).columns

# Calculate the number of rows and columns required for the plots
num_cols = 3  # Number of columns in the grid
num_rows = math.ceil(len(numerical_cols) / num_cols)  # Calculate rows based on the number of numerical columns

# Create subplots dynamically based on the number of numerical columns
plt.figure(figsize=(14, num_rows * 5))  # Adjust the figure size to fit the number of rows
for i, col in enumerate(numerical_cols, 1):
    plt.subplot(num_rows, num_cols, i)  # Adjusting the number of rows and columns
    sns.histplot(df[col], kde=True, bins=20)
    plt.title(f'Distribution of {col}')
    plt.tight_layout()

plt.show()

# Handle categorical data before correlation analysis
print(f"\nDataset has categorical column 'type' with values: {df['type'].unique()}")
print(f"Type distribution: {df['type'].value_counts().to_dict()}")

# Create a copy for correlation analysis with encoded categorical data
df_for_corr = df.copy()
if 'type' in df_for_corr.columns:
    # Label encode the 'type' column for correlation analysis
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    df_for_corr['type_encoded'] = le.fit_transform(df_for_corr['type'])
    df_for_corr = df_for_corr.drop('type', axis=1)

# Calculate correlation matrix (only numeric columns)
correlation_matrix = df_for_corr.corr()

plt.figure(figsize=(12, 8))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f', linewidths=0.5)
plt.title('Correlation Heatmap (with Type Encoded)')
plt.show()

# Data preprocessing
print("\n" + "="*80)
print("DATA PREPROCESSING")
print("="*80)

# Handle missing values (if any)
df_clean = df.copy()
numeric_columns = df_clean.select_dtypes(include=[np.number]).columns
for col in numeric_columns:
    if df_clean[col].isnull().sum() > 0:
        median_val = df_clean[col].median()
        df_clean[col].fillna(median_val, inplace=True)
        print(f"Filled {df[col].isnull().sum()} missing values in '{col}' with median: {median_val:.2f}")

# Handle categorical columns
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

# =============================================================================
# MODEL COMPARISON: XGBoost vs ANN vs Ridge Regression
# =============================================================================
print("\n" + "="*80)
print("MODEL COMPARISON: XGBoost vs ANN vs Ridge Regression")
print("="*80)

# Define evaluation function
def evaluate_model(y_true, y_pred, model_name):
    """Calculate comprehensive evaluation metrics"""
    r2 = r2_score(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    
    # Classification-style accuracy
    exact_match = np.mean(np.round(y_pred) == y_true) * 100
    within_05 = np.mean(np.abs(y_true - y_pred) <= 0.5) * 100
    within_10 = np.mean(np.abs(y_true - y_pred) <= 1.0) * 100
    
    return {
        'model': model_name,
        'r2': r2,
        'rmse': rmse,
        'mae': mae,
        'exact_match': exact_match,
        'within_05': within_05,
        'within_10': within_10
    }

# Dictionary to store results
results = {}


trials = 20
# =============================================================================
# 1. RIDGE REGRESSION
# =============================================================================
print("\n" + "-"*50)
print("1. RIDGE REGRESSION OPTIMIZATION")
print("-"*50)

def ridge_objective(trial):
    alpha = trial.suggest_float('alpha', 0.1, 100.0, log=True)
    model = Ridge(alpha=alpha, random_state=42)
    score = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2')
    return score.mean()

print("Optimizing Ridge Regression hyperparameters...")
start_time = time.time()
ridge_study = optuna.create_study(direction='maximize')
ridge_study.optimize(ridge_objective, n_trials=trials)
ridge_time = time.time() - start_time

ridge_best_params = ridge_study.best_params
print(f"Best Ridge parameters: {ridge_best_params}")
print(f"Best CV R² score: {ridge_study.best_value:.4f}")
print(f"Optimization time: {ridge_time:.2f} seconds")

# Train best Ridge model
ridge_model = Ridge(**ridge_best_params, random_state=42)
ridge_model.fit(X_train_scaled, y_train)
ridge_pred = ridge_model.predict(X_test_scaled)
results['Ridge'] = evaluate_model(y_test, ridge_pred, 'Ridge Regression')

# =============================================================================
# 2. ARTIFICIAL NEURAL NETWORK (MLP)
# =============================================================================
print("\n" + "-"*50)
print("2. ARTIFICIAL NEURAL NETWORK OPTIMIZATION")
print("-"*50)

def ann_objective(trial):
    # Network architecture
    n_layers = trial.suggest_int('n_layers', 1, 3)
    layers = []
    for i in range(n_layers):
        layers.append(trial.suggest_int(f'layer_{i}_size', 32, 256))
    
    # Other hyperparameters
    alpha = trial.suggest_float('alpha', 1e-5, 1e-1, log=True)
    learning_rate_init = trial.suggest_float('learning_rate_init', 1e-4, 1e-1, log=True)
    
    model = MLPRegressor(
        hidden_layer_sizes=tuple(layers),
        alpha=alpha,
        learning_rate_init=learning_rate_init,
        max_iter=500,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1
    )
    
    score = cross_val_score(model, X_train_scaled, y_train, cv=3, scoring='r2')  # Reduced CV for speed
    return score.mean()

print("Optimizing ANN hyperparameters...")
start_time = time.time()
ann_study = optuna.create_study(direction='maximize')
ann_study.optimize(ann_objective, n_trials=trials)  # Reduced trials for speed
ann_time = time.time() - start_time

ann_best_params = ann_study.best_params
print(f"Best ANN parameters: {ann_best_params}")
print(f"Best CV R² score: {ann_study.best_value:.4f}")
print(f"Optimization time: {ann_time:.2f} seconds")

# Train best ANN model
# Reconstruct layer sizes
n_layers = ann_best_params['n_layers']
layers = [ann_best_params[f'layer_{i}_size'] for i in range(n_layers)]

ann_model = MLPRegressor(
    hidden_layer_sizes=tuple(layers),
    alpha=ann_best_params['alpha'],
    learning_rate_init=ann_best_params['learning_rate_init'],
    max_iter=500,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.1
)
ann_model.fit(X_train_scaled, y_train)
ann_pred = ann_model.predict(X_test_scaled)
results['ANN'] = evaluate_model(y_test, ann_pred, 'Artificial Neural Network')

# =============================================================================
# 3. XGBOOST REGRESSION
# =============================================================================
print("\n" + "-"*50)
print("3. XGBOOST REGRESSION OPTIMIZATION")
print("-"*50)

def xgb_objective(trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 50, 200),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'gamma': trial.suggest_float('gamma', 0, 1),
        'reg_alpha': trial.suggest_float('reg_alpha', 0, 1),
        'reg_lambda': trial.suggest_float('reg_lambda', 0.1, 1)
    }
    
    model = XGBRegressor(random_state=42, **params)
    score = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
    return score.mean()

print("Optimizing XGBoost hyperparameters...")
start_time = time.time()
xgb_study = optuna.create_study(direction='maximize')
xgb_study.optimize(xgb_objective, n_trials=trials)
xgb_time = time.time() - start_time

xgb_best_params = xgb_study.best_params
print(f"Best XGBoost parameters: {xgb_best_params}")
print(f"Best CV R² score: {xgb_study.best_value:.4f}")
print(f"Optimization time: {xgb_time:.2f} seconds")

# Train best XGBoost model
xgb_model = XGBRegressor(random_state=42, **xgb_best_params)
xgb_model.fit(X_train, y_train)
xgb_pred = xgb_model.predict(X_test)
results['XGBoost'] = evaluate_model(y_test, xgb_pred, 'XGBoost Regression')

# =============================================================================
# RESULTS COMPARISON
# =============================================================================
print("\n" + "="*80)
print("COMPREHENSIVE MODEL COMPARISON RESULTS")
print("="*80)

# Create results DataFrame
results_df = pd.DataFrame([
    results['Ridge'],
    results['ANN'], 
    results['XGBoost']
])

print("\n📊 PERFORMANCE METRICS COMPARISON:")
print("-" * 70)
print(f"{'Model':<25} {'R²':<8} {'RMSE':<8} {'MAE':<8} {'Exact%':<8} {'±0.5%':<8} {'±1.0%':<8}")
print("-" * 70)

for _, row in results_df.iterrows():
    print(f"{row['model']:<25} {row['r2']:<8.4f} {row['rmse']:<8.4f} {row['mae']:<8.4f} "
          f"{row['exact_match']:<8.1f} {row['within_05']:<8.1f} {row['within_10']:<8.1f}")

# Find best model
best_model_idx = results_df['r2'].idxmax()
best_model_name = results_df.loc[best_model_idx, 'model']
best_r2 = results_df.loc[best_model_idx, 'r2']

print(f"\n🏆 BEST MODEL: {best_model_name}")
print(f"   R² Score: {best_r2:.4f} ({best_r2*100:.1f}% variance explained)")
print(f"   Exact Match Accuracy: {results_df.loc[best_model_idx, 'exact_match']:.1f}%")

# Performance ranking
print(f"\n📈 PERFORMANCE RANKING (by R² Score):")
ranking = results_df.sort_values('r2', ascending=False)
for i, (_, row) in enumerate(ranking.iterrows(), 1):
    print(f"   {i}. {row['model']}: R² = {row['r2']:.4f}")

# Create visualization
plt.figure(figsize=(15, 10))

# 1. R² Score comparison
plt.subplot(2, 3, 1)
bars = plt.bar(results_df['model'], results_df['r2'], color=['lightblue', 'lightgreen', 'lightcoral'])
plt.title('R² Score Comparison')
plt.ylabel('R² Score')
plt.xticks(rotation=45)
for bar, value in zip(bars, results_df['r2']):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01, 
             f'{value:.3f}', ha='center', va='bottom')

# 2. RMSE comparison
plt.subplot(2, 3, 2)
bars = plt.bar(results_df['model'], results_df['rmse'], color=['lightblue', 'lightgreen', 'lightcoral'])
plt.title('RMSE Comparison (Lower is Better)')
plt.ylabel('RMSE')
plt.xticks(rotation=45)
for bar, value in zip(bars, results_df['rmse']):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01, 
             f'{value:.3f}', ha='center', va='bottom')

# 3. Exact Match Accuracy
plt.subplot(2, 3, 3)
bars = plt.bar(results_df['model'], results_df['exact_match'], color=['lightblue', 'lightgreen', 'lightcoral'])
plt.title('Exact Match Accuracy (%)')
plt.ylabel('Accuracy (%)')
plt.xticks(rotation=45)
for bar, value in zip(bars, results_df['exact_match']):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, 
             f'{value:.1f}%', ha='center', va='bottom')

# 4. Actual vs Predicted for best model
plt.subplot(2, 3, 4)
if best_model_name == 'Ridge Regression':
    best_pred = ridge_pred
elif best_model_name == 'Artificial Neural Network':
    best_pred = ann_pred
else:
    best_pred = xgb_pred

plt.scatter(y_test, best_pred, alpha=0.6, color='purple')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', linewidth=2)
plt.xlabel('Actual Quality')
plt.ylabel('Predicted Quality')
plt.title(f'Best Model: {best_model_name}\nR² = {best_r2:.4f}')

# 5. Within tolerance comparison
plt.subplot(2, 3, 5)
tolerance_data = results_df[['within_05', 'within_10']].T
tolerance_data.columns = results_df['model']
tolerance_data.plot(kind='bar', ax=plt.gca())
plt.title('Prediction Accuracy Within Tolerance')
plt.ylabel('Accuracy (%)')
plt.xlabel('Tolerance Level')
plt.xticks([0, 1], ['±0.5 points', '±1.0 points'], rotation=0)
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')

# 6. Feature importance for XGBoost
plt.subplot(2, 3, 6)
if 'XGBoost' in results:
    feature_importance = xgb_model.feature_importances_
    feature_names = X.columns
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': feature_importance
    }).sort_values('importance', ascending=True).tail(8)
    
    plt.barh(importance_df['feature'], importance_df['importance'])
    plt.title('XGBoost - Top 8 Feature Importance')
    plt.xlabel('Importance')

plt.tight_layout()
plt.show()

print(f"\n" + "="*80)
print("MODEL OPTIMIZATION SUMMARY")
print("="*80)
print(f"""
🔧 OPTIMIZATION TIMES:
   • Ridge Regression: {ridge_time:.1f} seconds
   • Neural Network: {ann_time:.1f} seconds  
   • XGBoost: {xgb_time:.1f} seconds

🎯 BEST PARAMETERS:
   • Ridge: α = {ridge_best_params['alpha']:.4f}
   • ANN: {ann_best_params}
   • XGBoost: {xgb_best_params}

💡 RECOMMENDATION: Use {best_model_name} for wine quality prediction
   with {best_r2*100:.1f}% variance explanation capability.
""")