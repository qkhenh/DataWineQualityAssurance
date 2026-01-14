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


trials = 50
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

# =============================================================================
# ADVANCED OPTIMIZATION TECHNIQUES
# =============================================================================
print("\n" + "="*80)
print("ADVANCED OPTIMIZATION TECHNIQUES")
print("="*80)

# =============================================================================
# 1. FEATURE ENGINEERING & SELECTION
# =============================================================================
print("\n🔧 ADVANCED FEATURE ENGINEERING")
print("-"*50)

# Feature Selection using SelectKBest
selector = SelectKBest(score_func=f_regression, k=10)
X_train_selected = selector.fit_transform(X_train_scaled, y_train)
X_test_selected = selector.transform(X_test_scaled)

selected_features = X.columns[selector.get_support()]
print(f"Top 10 selected features: {list(selected_features)}")

# Polynomial Features (degree 2 for interaction terms)
poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
X_train_poly = poly.fit_transform(X_train_selected)
X_test_poly = poly.transform(X_test_selected)
print(f"Polynomial features shape: {X_train_poly.shape}")

# PCA for dimensionality reduction
pca = PCA(n_components=0.95)  # Keep 95% variance
X_train_pca = pca.fit_transform(X_train_scaled)
X_test_pca = pca.transform(X_test_scaled)
print(f"PCA components needed for 95% variance: {pca.n_components_}")

# =============================================================================
# 2. ADVANCED MODEL ARCHITECTURES
# =============================================================================
print("\n🚀 ADVANCED MODEL ARCHITECTURES")
print("-"*50)

advanced_results = {}

# 2.1 Deep Neural Network with better architecture
def deep_ann_objective(trial):
    # More sophisticated architecture
    n_layers = trial.suggest_int('n_layers', 2, 4)
    layers = []
    
    # First layer larger, then decreasing
    first_layer = trial.suggest_int('first_layer', 128, 512)
    layers.append(first_layer)
    
    for i in range(1, n_layers):
        # Each subsequent layer is smaller
        prev_layer = layers[-1]
        min_size = 32
        max_size = max(min_size, prev_layer//2)  # Ensure max_size >= min_size
        
        layer_size = trial.suggest_int(f'layer_{i}', min_size, max_size)
        layers.append(layer_size)
    
    # Advanced hyperparameters
    alpha = trial.suggest_float('alpha', 1e-6, 1e-2, log=True)
    learning_rate_init = trial.suggest_float('learning_rate_init', 1e-5, 1e-2, log=True)
    batch_size = trial.suggest_categorical('batch_size', [32, 64, 128, 256])
    beta_1 = trial.suggest_float('beta_1', 0.8, 0.99)
    beta_2 = trial.suggest_float('beta_2', 0.9, 0.999)
    
    model = MLPRegressor(
        hidden_layer_sizes=tuple(layers),
        alpha=alpha,
        learning_rate_init=learning_rate_init,
        batch_size=batch_size,
        beta_1=beta_1,
        beta_2=beta_2,
        max_iter=1000,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=20
    )
    
    # Use polynomial features for complex patterns
    score = cross_val_score(model, X_train_poly, y_train, cv=3, scoring='r2')
    return score.mean()

print("Optimizing Deep Neural Network...")
start_time = time.time()
deep_ann_study = optuna.create_study(direction='maximize')
deep_ann_study.optimize(deep_ann_objective, n_trials=trials)
deep_ann_time = time.time() - start_time

# Train best Deep ANN
deep_ann_params = deep_ann_study.best_params
n_layers = deep_ann_params['n_layers']
layers = [deep_ann_params['first_layer']]
for i in range(1, n_layers):
    layers.append(deep_ann_params[f'layer_{i}'])

deep_ann_model = MLPRegressor(
    hidden_layer_sizes=tuple(layers),
    alpha=deep_ann_params['alpha'],
    learning_rate_init=deep_ann_params['learning_rate_init'],
    batch_size=deep_ann_params['batch_size'],
    beta_1=deep_ann_params['beta_1'],
    beta_2=deep_ann_params['beta_2'],
    max_iter=1000,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.15,
    n_iter_no_change=20
)

deep_ann_model.fit(X_train_poly, y_train)
deep_ann_pred = deep_ann_model.predict(X_test_poly)
advanced_results['Deep_ANN'] = evaluate_model(y_test, deep_ann_pred, 'Deep Neural Network')

# 2.2 LightGBM (faster alternative to XGBoost)
def lgb_objective(trial):
    params = {
        'num_leaves': trial.suggest_int('num_leaves', 10, 100),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'feature_fraction': trial.suggest_float('feature_fraction', 0.4, 1.0),
        'bagging_fraction': trial.suggest_float('bagging_fraction', 0.4, 1.0),
        'bagging_freq': trial.suggest_int('bagging_freq', 1, 7),
        'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
        'reg_alpha': trial.suggest_float('reg_alpha', 0, 1),
        'reg_lambda': trial.suggest_float('reg_lambda', 0, 1),
    }
    
    model = lgb.LGBMRegressor(
        n_estimators=200,
        random_state=42,
        **params
    )
    
    score = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
    return score.mean()

print("Optimizing LightGBM...")
start_time = time.time()
lgb_study = optuna.create_study(direction='maximize')
lgb_study.optimize(lgb_objective, n_trials=trials)
lgb_time = time.time() - start_time

lgb_model = lgb.LGBMRegressor(n_estimators=200, random_state=42, **lgb_study.best_params)
lgb_model.fit(X_train, y_train)
lgb_pred = lgb_model.predict(X_test)
advanced_results['LightGBM'] = evaluate_model(y_test, lgb_pred, 'LightGBM')

# =============================================================================
# 3. ENSEMBLE METHODS
# =============================================================================
print("\n🎯 ENSEMBLE METHODS")
print("-"*50)

# 3.1 Voting Ensemble
voting_regressor = VotingRegressor([
    ('xgb', xgb_model),
    ('lgb', lgb_model),
    ('ridge', ridge_model)
])

voting_regressor.fit(X_train_scaled, y_train)
voting_pred = voting_regressor.predict(X_test_scaled)
advanced_results['Voting_Ensemble'] = evaluate_model(y_test, voting_pred, 'Voting Ensemble')

# 3.2 Bagging with best model
bagging_model = BaggingRegressor(
    estimator=xgb_model,
    n_estimators=10,
    random_state=42,
    n_jobs=-1
)
bagging_model.fit(X_train, y_train)
bagging_pred = bagging_model.predict(X_test)
advanced_results['Bagging_XGB'] = evaluate_model(y_test, bagging_pred, 'Bagging XGBoost')

# =============================================================================
# 4. PIPELINE OPTIMIZATION
# =============================================================================
print("\n⚙️ PIPELINE OPTIMIZATION")
print("-"*50)

def pipeline_objective(trial):
    # Feature selection
    k_features = trial.suggest_int('k_features', 8, len(X.columns))
    
    # Polynomial degree
    poly_degree = trial.suggest_int('poly_degree', 1, 2)
    
    # XGBoost parameters
    xgb_params = {
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
    }
    
    # Create pipeline
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('selector', SelectKBest(f_regression, k=k_features)),
        ('poly', PolynomialFeatures(degree=poly_degree, interaction_only=True, include_bias=False)),
        ('model', XGBRegressor(random_state=42, **xgb_params))
    ])
    
    score = cross_val_score(pipeline, X_train, y_train, cv=3, scoring='r2')
    return score.mean()

print("Optimizing Complete Pipeline...")
start_time = time.time()
pipeline_study = optuna.create_study(direction='maximize')
pipeline_study.optimize(pipeline_objective, n_trials=trials)
pipeline_time = time.time() - start_time

# Build best pipeline
best_pipeline_params = pipeline_study.best_params
k_features = best_pipeline_params['k_features']
poly_degree = best_pipeline_params['poly_degree']

xgb_params = {k.replace('model__', ''): v for k, v in best_pipeline_params.items() 
              if k.startswith('max_depth') or k.startswith('learning_rate') or 
              k.startswith('n_estimators') or k.startswith('subsample') or 
              k.startswith('colsample_bytree')}

best_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('selector', SelectKBest(f_regression, k=k_features)),
    ('poly', PolynomialFeatures(degree=poly_degree, interaction_only=True, include_bias=False)),
    ('model', XGBRegressor(random_state=42, **xgb_params))
])

best_pipeline.fit(X_train, y_train)
pipeline_pred = best_pipeline.predict(X_test)
advanced_results['Optimized_Pipeline'] = evaluate_model(y_test, pipeline_pred, 'Optimized Pipeline')

# =============================================================================
# ADVANCED RESULTS COMPARISON
# =============================================================================
print("\n" + "="*80)
print("ADVANCED OPTIMIZATION RESULTS")
print("="*80)

# Combine all results
all_results = {**results, **advanced_results}
all_results_df = pd.DataFrame(list(all_results.values()))

print("\n📊 COMPREHENSIVE PERFORMANCE COMPARISON:")
print("-" * 80)
print(f"{'Model':<25} {'R²':<8} {'RMSE':<8} {'MAE':<8} {'Exact%':<8} {'±0.5%':<8} {'±1.0%':<8}")
print("-" * 80)

# Sort by R² score
sorted_results = all_results_df.sort_values('r2', ascending=False)
for _, row in sorted_results.iterrows():
    print(f"{row['model']:<25} {row['r2']:<8.4f} {row['rmse']:<8.4f} {row['mae']:<8.4f} "
          f"{row['exact_match']:<8.1f} {row['within_05']:<8.1f} {row['within_10']:<8.1f}")

# Find ultimate best model
ultimate_best_idx = sorted_results.iloc[0]
print(f"\n🏆 ULTIMATE BEST MODEL: {ultimate_best_idx['model']}")
print(f"   R² Score: {ultimate_best_idx['r2']:.4f}")
print(f"   RMSE: {ultimate_best_idx['rmse']:.4f}")
print(f"   Exact Match: {ultimate_best_idx['exact_match']:.1f}%")
print(f"   Within ±1.0: {ultimate_best_idx['within_10']:.1f}%")

# Performance improvement analysis
baseline_r2 = results['XGBoost']['r2']
best_r2 = ultimate_best_idx['r2']
improvement = ((best_r2 - baseline_r2) / baseline_r2) * 100

print(f"\n📈 IMPROVEMENT ANALYSIS:")
print(f"   Baseline XGBoost R²: {baseline_r2:.4f}")
print(f"   Best Advanced Model R²: {best_r2:.4f}")
print(f"   Improvement: +{improvement:.1f}%")

# Create advanced visualization
plt.figure(figsize=(20, 12))

# 1. All models R² comparison
plt.subplot(2, 4, 1)
bars = plt.bar(range(len(sorted_results)), sorted_results['r2'], 
               color=plt.cm.viridis(np.linspace(0, 1, len(sorted_results))))
plt.title('All Models R² Score Comparison')
plt.ylabel('R² Score')
plt.xticks(range(len(sorted_results)), sorted_results['model'], rotation=45, ha='right')
for i, (bar, value) in enumerate(zip(bars, sorted_results['r2'])):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005, 
             f'{value:.3f}', ha='center', va='bottom', fontsize=8)

# 2. RMSE comparison
plt.subplot(2, 4, 2)
plt.bar(range(len(sorted_results)), sorted_results['rmse'], 
        color=plt.cm.plasma(np.linspace(0, 1, len(sorted_results))))
plt.title('RMSE Comparison (Lower Better)')
plt.ylabel('RMSE')
plt.xticks(range(len(sorted_results)), sorted_results['model'], rotation=45, ha='right')

# 3. Accuracy within tolerances
plt.subplot(2, 4, 3)
x = np.arange(len(sorted_results))
width = 0.35
plt.bar(x - width/2, sorted_results['within_05'], width, label='±0.5', alpha=0.8)
plt.bar(x + width/2, sorted_results['within_10'], width, label='±1.0', alpha=0.8)
plt.title('Accuracy Within Tolerance')
plt.ylabel('Accuracy (%)')
plt.xticks(x, sorted_results['model'], rotation=45, ha='right')
plt.legend()

# 4. Best model actual vs predicted
plt.subplot(2, 4, 4)
best_model_name = ultimate_best_idx['model']
if best_model_name == 'Deep Neural Network':
    best_pred = deep_ann_pred
elif best_model_name == 'LightGBM':
    best_pred = lgb_pred
elif best_model_name == 'Optimized Pipeline':
    best_pred = pipeline_pred
elif best_model_name == 'Voting Ensemble':
    best_pred = voting_pred
elif best_model_name == 'Bagging XGBoost':
    best_pred = bagging_pred
else:
    best_pred = xgb_pred

plt.scatter(y_test, best_pred, alpha=0.6, color='green')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', linewidth=2)
plt.xlabel('Actual Quality')
plt.ylabel('Predicted Quality')
plt.title(f'Best Model: {best_model_name}\nR² = {ultimate_best_idx["r2"]:.4f}')

# 5. Feature importance comparison (if applicable)
plt.subplot(2, 4, 5)
if hasattr(lgb_model, 'feature_importances_'):
    lgb_importance = lgb_model.feature_importances_
    feature_names = X.columns
    top_features = pd.DataFrame({
        'feature': feature_names,
        'lgb_importance': lgb_importance,
        'xgb_importance': xgb_model.feature_importances_
    }).sort_values('lgb_importance', ascending=True).tail(8)
    
    y_pos = np.arange(len(top_features))
    plt.barh(y_pos - 0.2, top_features['xgb_importance'], 0.4, label='XGBoost', alpha=0.8)
    plt.barh(y_pos + 0.2, top_features['lgb_importance'], 0.4, label='LightGBM', alpha=0.8)
    plt.yticks(y_pos, top_features['feature'])
    plt.xlabel('Feature Importance')
    plt.title('Feature Importance Comparison')
    plt.legend()

# 6. Training time comparison
plt.subplot(2, 4, 6)
times = [ridge_time, ann_time, xgb_time, deep_ann_time, lgb_time, pipeline_time]
time_labels = ['Ridge', 'ANN', 'XGBoost', 'Deep ANN', 'LightGBM', 'Pipeline']
plt.bar(time_labels, times, color='orange', alpha=0.7)
plt.title('Training Time Comparison')
plt.ylabel('Time (seconds)')
plt.xticks(rotation=45)

# 7. Performance vs Time trade-off
plt.subplot(2, 4, 7)
model_performance = [results['Ridge']['r2'], results['ANN']['r2'], results['XGBoost']['r2'],
                    advanced_results['Deep_ANN']['r2'], advanced_results['LightGBM']['r2'],
                    advanced_results['Optimized_Pipeline']['r2']]

plt.scatter(times, model_performance, s=100, alpha=0.7, c=range(len(times)), cmap='viridis')
for i, label in enumerate(time_labels):
    plt.annotate(label, (times[i], model_performance[i]), xytext=(5, 5), 
                textcoords='offset points', fontsize=8)
plt.xlabel('Training Time (seconds)')
plt.ylabel('R² Score')
plt.title('Performance vs Training Time')

# 8. Model complexity analysis
plt.subplot(2, 4, 8)
complexity_scores = [1, 3, 4, 5, 4, 6]  # Relative complexity scores
plt.scatter(complexity_scores, model_performance, s=100, alpha=0.7, c='red')
for i, label in enumerate(time_labels):
    plt.annotate(label, (complexity_scores[i], model_performance[i]), xytext=(5, 5), 
                textcoords='offset points', fontsize=8)
plt.xlabel('Model Complexity (1-6)')
plt.ylabel('R² Score')
plt.title('Performance vs Model Complexity')

plt.tight_layout()
plt.show()

print(f"\n" + "="*80)
print("ADVANCED OPTIMIZATION SUMMARY")
print("="*80)
print(f"""
🚀 ADVANCED TECHNIQUES APPLIED:
   ✅ Feature Engineering (Polynomial, Selection, PCA)
   ✅ Deep Neural Networks with optimized architecture
   ✅ LightGBM (alternative to XGBoost)
   ✅ Ensemble Methods (Voting, Bagging)
   ✅ End-to-end Pipeline Optimization
   ✅ Comprehensive Hyperparameter Tuning

⏱️ OPTIMIZATION TIMES:
   • Deep Neural Network: {deep_ann_time:.1f}s
   • LightGBM: {lgb_time:.1f}s  
   • Pipeline Optimization: {pipeline_time:.1f}s

🎯 FINAL RECOMMENDATION: 
   Use {ultimate_best_idx['model']} with {ultimate_best_idx['r2']*100:.1f}% variance explanation
   and {ultimate_best_idx['exact_match']:.1f}% exact match accuracy.
   
   Performance improvement over baseline: +{improvement:.1f}%
""")