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
print(df.describe())
print(df.drop('type', axis=1).median())

# import math

# # Assuming 'df' is your DataFrame
# numerical_cols = df.select_dtypes(include=['float64', 'int64']).columns

# # Calculate the number of rows and columns required for the plots
# num_cols = 3  # Number of columns in the grid
# num_rows = math.ceil(len(numerical_cols) / num_cols)  # Calculate rows based on the number of numerical columns

# # Create subplots dynamically based on the number of numerical columns
# plt.figure(figsize=(14, num_rows * 5))  # Adjust the figure size to fit the number of rows
# for i, col in enumerate(numerical_cols, 1):
#     plt.subplot(num_rows, num_cols, i)  # Adjusting the number of rows and columns
#     sns.histplot(df[col], kde=True, bins=20)
#     plt.title(f'Distribution of {col}')
#     plt.tight_layout()

# plt.show()

# # Handle categorical data before correlation analysis
# print(f"\nDataset has categorical column 'type' with values: {df['type'].unique()}")
# print(f"Type distribution: {df['type'].value_counts().to_dict()}")

# # Create a copy for correlation analysis with encoded categorical data
# df_for_corr = df.copy()
# if 'type' in df_for_corr.columns:
#     # Label encode the 'type' column for correlation analysis
#     from sklearn.preprocessing import LabelEncoder
#     le = LabelEncoder()
#     df_for_corr['type_encoded'] = le.fit_transform(df_for_corr['type'])
#     df_for_corr = df_for_corr.drop('type', axis=1)

# # Calculate correlation matrix (only numeric columns)
# correlation_matrix = df_for_corr.corr()

# plt.figure(figsize=(12, 8))
# sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f', linewidths=0.5)
# plt.title('Correlation Heatmap (with Type Encoded)')
# plt.show()

# # Data preprocessing
# print("\n" + "="*80)
# print("DATA PREPROCESSING")
# print("="*80)

# # Handle missing values (if any)
# df_clean = df.copy()
# numeric_columns = df_clean.select_dtypes(include=[np.number]).columns
# for col in numeric_columns:
#     if df_clean[col].isnull().sum() > 0:
#         median_val = df_clean[col].median()
#         df_clean[col].fillna(median_val, inplace=True)
#         print(f"Filled {df[col].isnull().sum()} missing values in '{col}' with median: {median_val:.2f}")

# # Handle categorical columns
# categorical_columns = df_clean.select_dtypes(exclude=[np.number]).columns
# print(f"Categorical columns found: {list(categorical_columns)}")

# label_encoders = {}

# for col in categorical_columns:
#     if col != 'quality':  # Don't encode target variable
#         le = LabelEncoder()
#         df_clean[col] = le.fit_transform(df_clean[col])
#         label_encoders[col] = le
#         print(f"Encoded column '{col}': {le.classes_}")

# # Prepare features and target
# X = df_clean.drop('quality', axis=1)
# y = df_clean['quality']  # Keep original quality values (3-9)

# print(f"Dataset shape: {X.shape}")
# print(f"Target range: {y.min()} to {y.max()}")
# print(f"Target distribution:")
# print(y.value_counts().sort_index())