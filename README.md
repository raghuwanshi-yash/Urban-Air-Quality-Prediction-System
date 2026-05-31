# 🌍 Urban Air Quality Prediction and Health Risk Analytics System

## Overview

The Urban Air Quality Prediction and Health Risk Analytics System is an AI-powered web application that analyzes historical air pollution data, forecasts Air Quality Index (AQI) levels, identifies pollution hotspots, and provides health risk assessments based on predicted environmental conditions.

The system combines Machine Learning, Data Analytics, Environmental Intelligence, and Interactive Visualization to transform raw air quality data into actionable insights for citizens, researchers, and policymakers.

---

## Problem Statement

Air pollution remains one of the leading environmental and public health challenges worldwide. Most existing AQI platforms provide only real-time pollution information, limiting the ability of users to anticipate future air quality conditions.

This project addresses that limitation by introducing predictive analytics capabilities that enable:

* AQI forecasting
* Pollution trend analysis
* Health risk categorization
* Environmental hotspot identification
* Data-driven environmental awareness

---

## Key Features

### AQI Prediction

* Forecasts Air Quality Index using Machine Learning models.
* Predicts future pollution severity based on pollutant concentrations.

### Health Risk Analytics

* Categorizes AQI into risk levels:

  * Low Risk
  * Moderate Risk
  * High Risk
  * Severe Risk
* Generates preventive health recommendations.

### Pollution Trend Analysis

* Visualizes historical pollution patterns.
* Supports environmental trend interpretation.

### Hotspot Detection

* Uses K-Means Clustering to identify regions with similar pollution intensity.

### Interactive Dashboard

* Dynamic charts and visualizations.
* User-friendly interface for AQI insights.

---

## Technology Stack

### Frontend

* React.js
* HTML5
* CSS3
* JavaScript

### Backend

* Python
* Flask

### Machine Learning & Analytics

* Scikit-Learn
* Pandas
* NumPy

### Data Visualization

* Interactive Charts
* Trend Analysis Graphs
* Risk Indicators

---

## System Architecture

```text
User Interface (React.js)
          │
          ▼
Flask Backend API
          │
          ▼
Data Processing Layer
(Pandas + NumPy)
          │
          ▼
Machine Learning Model
(Linear Regression)
          │
          ▼
AQI Prediction & Risk Analysis
          │
          ▼
Visualization Dashboard
```

## Dataset Attributes

The model uses the following environmental parameters:

* PM2.5
* PM10
* NO₂
* SO₂
* CO
* O₃

These pollutant indicators are analyzed to generate AQI predictions and health risk assessments.

---

## Machine Learning Workflow

1. Data Collection
2. Data Cleaning & Preprocessing
3. Feature Engineering
4. Exploratory Data Analysis (EDA)
5. Model Training
6. AQI Prediction
7. Health Risk Classification
8. Dashboard Visualization

---

## Project Objectives

* Predict short-term AQI values.
* Identify pollution patterns and trends.
* Categorize environmental health risks.
* Provide data-driven environmental insights.
* Demonstrate practical applications of Artificial Intelligence in environmental monitoring.

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/Urban-Air-Quality-Prediction-System.git
```

### Backend Setup

```bash
cd backend

pip install -r requirements.txt

python app.py
```

### Frontend Setup

```bash
cd frontend

npm install

npm start
```

---

## Future Enhancements

* Real-time AQI data integration
* Advanced Time-Series Forecasting (LSTM, Prophet)
* Weather parameter integration
* Geospatial visualization using maps
* Mobile application support
* Smart city environmental monitoring integration

---

## Academic Significance

This project demonstrates the integration of:

* Machine Learning
* Data Analytics
* Environmental Informatics
* Health Risk Assessment
* Full Stack Web Development

to solve a real-world environmental challenge.

---

## Contributors

* Backend Development
* Machine Learning & Data Analytics
* Frontend Development
* Testing & Validation
* Documentation

(Add team member names here)

---

## License

This project was developed for academic and educational purposes.
It's for the Major Project Submitted in Group which I led.