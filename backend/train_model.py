import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

# Load dataset
df = pd.read_csv("aqi_data.csv")

# Features
X = df[["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]]
y = df["AQI"]

# Train model
model = LinearRegression()
model.fit(X, y)

# Save model
joblib.dump(model, "aqi_model.pkl")

print("Model trained and saved successfully!")