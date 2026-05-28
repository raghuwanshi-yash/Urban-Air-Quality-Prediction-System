# =============================================================================
# AQI Prediction — Flask REST API
# =============================================================================
# Author  : Backend Engineer
# Model   : aqi_model.pkl  (trained LinearRegression via joblib)
# Routes  : GET /          → health check
#           POST /predict  → returns predicted AQI + risk level
# =============================================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

# =============================================================================
# APP SETUP
# =============================================================================

app = Flask(__name__)

# CORS (Cross-Origin Resource Sharing) lets browsers on other domains
# call this API — useful when a frontend app is served from a different port.
CORS(app)

# =============================================================================
# LOAD MODEL
# =============================================================================
# joblib.load() deserialises the saved model file back into a Python object.
# We load it once at startup so every request reuses the same in-memory model
# instead of reading from disk every time (much faster).

MODEL_PATH = os.path.join(os.path.dirname(__file__), "aqi_model.pkl")


try:
    model = joblib.load(MODEL_PATH)
    print(f"[INFO] Model loaded successfully from '{MODEL_PATH}'")
except FileNotFoundError:
    model = None
    print(f"[WARNING] '{MODEL_PATH}' not found. /predict will return an error.")

# =============================================================================
# HELPER — Risk level from predicted AQI
# =============================================================================

def get_risk_level(aqi: float) -> str:
    """
    Map a numeric AQI value to a human-readable risk category.

    Range        │ Risk Level
    ─────────────┼──────────────
    0  – 50      │ Low
    51 – 100     │ Moderate
    101 – 200    │ Unhealthy
    201 – 300    │ Very Unhealthy
    301+         │ Severe
    """
    if aqi <= 50:
        return "Low"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Severe"

# =============================================================================
# ROUTE 1 — Health Check
# =============================================================================

@app.route("/", methods=["GET"])
def home():
    """
    Simple health-check endpoint.
    Useful to confirm the server is up before sending prediction requests.
    """
    return jsonify({"status": "ok", "message": "AQI Prediction API is running ✅"}), 200

# =============================================================================
# ROUTE 2 — AQI Prediction
# =============================================================================

@app.route("/predict", methods=["POST"])
def predict():
    """
    Accept pollutant readings as JSON, return predicted AQI + risk level.

    Expected request body
    ---------------------
    {
        "pm25": 85,
        "pm10": 150,
        "no2":  60,
        "so2":  20,
        "co":   1.5,
        "o3":   90
    }

    Success response (200)
    ----------------------
    {
        "predicted_aqi": 112.47,
        "risk_level": "Unhealthy"
    }
    """

    # --- Guard: model must be loaded ---
    if model is None:
        return jsonify({
            "error": "Model not loaded. Make sure 'aqi_model.pkl' exists."
        }), 500

    # --- Parse incoming JSON body ---
    data = request.get_json(silent=True)   # silent=True avoids raising on bad JSON

    if not data:
        return jsonify({
            "error": "Request body is missing or not valid JSON."
        }), 400

    # --- Validate that all required fields are present ---
    required_fields = ["pm25", "pm10", "no2", "so2", "co", "o3"]
    missing = [field for field in required_fields if field not in data]

    if missing:
        return jsonify({
            "error": f"Missing required fields: {missing}"
        }), 400

    # --- Extract and validate field types ---
    try:
        pm25 = float(data["pm25"])
        pm10 = float(data["pm10"])
        no2  = float(data["no2"])
        so2  = float(data["so2"])
        co   = float(data["co"])
        o3   = float(data["o3"])
    except (ValueError, TypeError) as e:
        return jsonify({
            "error": f"All fields must be numeric. Details: {str(e)}"
        }), 400

    # --- Validate value ranges (basic sanity check) ---
    if any(v < 0 for v in [pm25, pm10, no2, so2, co, o3]):
        return jsonify({
            "error": "Pollutant values cannot be negative."
        }), 400

    # --- Build feature array and run prediction ---
    # The order MUST match the column order used during model training:
    # [PM2_5, PM10, NO2, SO2, CO, O3]
    features = np.array([[pm25, pm10, no2, so2, co, o3]])

    try:
        predicted_aqi = float(model.predict(features)[0])
        predicted_aqi = round(predicted_aqi, 2)
    except Exception as e:
        return jsonify({
            "error": f"Prediction failed: {str(e)}"
        }), 500

    # --- Map AQI to risk level ---
    risk = get_risk_level(predicted_aqi)

    # --- Return result ---
    return jsonify({
        "predicted_aqi": predicted_aqi,
        "risk_level":    risk
    }), 200

# =============================================================================
# GLOBAL ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found. Use GET / or POST /predict"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed on this route."}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error.", "details": str(e)}), 500

# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    # debug=True → auto-reloads on code change + shows detailed error pages.
    # Set debug=False in production.
    app.run(debug=True, host="0.0.0.0", port=5000)