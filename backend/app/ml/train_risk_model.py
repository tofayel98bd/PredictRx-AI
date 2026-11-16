"""Training script for PredictRx Clinical Risk Predictive Model (XGBoost + SHAP).

Trains a clinical risk regression model predicting Acute Kidney Injury (AKI)
and Adverse Drug Event (ADE) complication risks based on clinical biomarkers,
comorbidities, and pharmacotherapy drug collisions.
"""

import json
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

FEATURE_NAMES = [
    "age",
    "egfr",
    "serum_creatinine",
    "systolic_bp",
    "diastolic_bp",
    "hba1c",
    "has_ckd",
    "has_diabetes",
    "has_hypertension",
    "medication_count",
    "nsaid_prescribed",
    "nsaid_duration_days",
    "nsaid_ceiling_breach",
    "arb_acei_prescribed",
    "diuretic_prescribed",
    "nephrotoxic_interaction",
    "triple_whammy",
]


def generate_synthetic_clinical_cohort(n_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    """Generate clinically representative patient cohort reflecting Bangladesh demographics and clinical guidelines."""
    rng = np.random.default_rng(random_seed)

    age = rng.integers(18, 88, size=n_samples)
    has_diabetes = (rng.random(n_samples) < (0.20 + 0.003 * (age - 18))).astype(int)
    has_hypertension = (rng.random(n_samples) < (0.25 + 0.005 * (age - 18))).astype(int)
    has_ckd = (rng.random(n_samples) < (0.05 + 0.004 * (age - 18) + 0.15 * has_diabetes + 0.10 * has_hypertension)).astype(int)

    # eGFR distribution
    egfr = np.where(
        has_ckd == 1,
        rng.uniform(15.0, 48.0, size=n_samples),
        rng.uniform(60.0, 115.0, size=n_samples),
    )
    # Serum creatinine inversely correlated with eGFR
    serum_creatinine = np.clip(140.0 / (egfr + 5.0) + rng.normal(0, 0.15, size=n_samples), 0.6, 5.5)

    systolic_bp = np.where(has_hypertension == 1, rng.integers(135, 185, size=n_samples), rng.integers(105, 130, size=n_samples))
    diastolic_bp = np.where(has_hypertension == 1, rng.integers(85, 105, size=n_samples), rng.integers(68, 82, size=n_samples))
    hba1c = np.where(has_diabetes == 1, rng.uniform(7.2, 11.5, size=n_samples), rng.uniform(4.8, 5.8, size=n_samples))

    medication_count = rng.integers(1, 8, size=n_samples) + has_diabetes * 2 + has_hypertension * 2

    # Medication exposure
    arb_acei_prescribed = np.where(has_hypertension == 1, (rng.random(n_samples) < 0.70).astype(int), 0)
    diuretic_prescribed = np.where(has_hypertension == 1, (rng.random(n_samples) < 0.35).astype(int), 0)
    nsaid_prescribed = (rng.random(n_samples) < 0.40).astype(int)
    nsaid_duration_days = np.where(nsaid_prescribed == 1, rng.choice([3, 5, 7, 10, 14, 21, 30], size=n_samples, p=[0.25, 0.30, 0.15, 0.10, 0.12, 0.05, 0.03]), 0)
    nsaid_ceiling_breach = (nsaid_duration_days > 5).astype(int)

    nephrotoxic_interaction = ((nsaid_prescribed == 1) & (arb_acei_prescribed == 1)).astype(int)
    triple_whammy = ((nsaid_prescribed == 1) & (arb_acei_prescribed == 1) & (diuretic_prescribed == 1)).astype(int)

    # -------------------------------------------------------------
    # Clinical Risk Formula (KDIGO 2024, CMAJ Triple Whammy)
    # -------------------------------------------------------------
    base_risk = 12.0

    risk = (
        base_risk
        + (age >= 65) * 12.0
        + (egfr < 30) * 32.0
        + ((egfr >= 30) & (egfr < 60)) * 20.0
        + (serum_creatinine > 1.8) * 15.0
        + (systolic_bp >= 160) * 8.0
        + (hba1c > 8.5) * 6.0
        + (medication_count >= 5) * 8.0
        + (nsaid_prescribed == 1) * 8.0
        + (nsaid_ceiling_breach == 1) * 22.0
        + (nephrotoxic_interaction == 1) * 18.0
        + (triple_whammy == 1) * 25.0
        # Synergistic acute nephrotoxic collapse (CKD + ARB + Prolonged NSAID)
        + ((egfr < 45) & (nephrotoxic_interaction == 1) & (nsaid_ceiling_breach == 1)) * 14.0
        + rng.normal(0, 2.5, size=n_samples)
    )

    aki_risk = np.clip(risk, 5.0, 95.0)

    df = pd.DataFrame({
        "age": age,
        "egfr": egfr,
        "serum_creatinine": serum_creatinine,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "hba1c": hba1c,
        "has_ckd": has_ckd,
        "has_diabetes": has_diabetes,
        "has_hypertension": has_hypertension,
        "medication_count": medication_count,
        "nsaid_prescribed": nsaid_prescribed,
        "nsaid_duration_days": nsaid_duration_days,
        "nsaid_ceiling_breach": nsaid_ceiling_breach,
        "arb_acei_prescribed": arb_acei_prescribed,
        "diuretic_prescribed": diuretic_prescribed,
        "nephrotoxic_interaction": nephrotoxic_interaction,
        "triple_whammy": triple_whammy,
        "aki_risk_percentage": aki_risk,
    })

    return df


def train_and_export_model():
    """Train XGBoost regressor, calculate metrics, and save artifacts."""
    output_dir = Path(__file__).resolve().parent / "models"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("Generating synthetic clinical trial cohort (5,000 patients)...")
    df = generate_synthetic_clinical_cohort(n_samples=5000)

    X = df[FEATURE_NAMES]
    y = df["aki_risk_percentage"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    print("Training XGBoost Clinical Risk Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:squarederror",
        random_state=42,
    )
    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, preds)
    print(f"Model Performance: RMSE = {rmse:.2f}%, R^2 Score = {r2:.4f}")

    # Export artifacts
    model_json_path = output_dir / "clinical_risk_model.json"
    model.save_model(str(model_json_path))
    print(f"Saved XGBoost model to JSON: {model_json_path}")

    model_joblib_path = output_dir / "clinical_risk_model.joblib"
    joblib.dump(model, str(model_joblib_path))
    print(f"Saved XGBoost model to Joblib: {model_joblib_path}")

    metadata = {
        "model_type": "XGBRegressor",
        "version": "1.0.0",
        "trained_date": "2026-11-16",
        "n_samples": len(df),
        "features": FEATURE_NAMES,
        "metrics": {
            "rmse": round(float(rmse), 2),
            "r2_score": round(float(r2), 4),
        },
        "target": "aki_risk_percentage",
        "clinical_guidelines": ["KDIGO 2024 CKD Guidelines", "CMAJ 2013 Triple Whammy Study", "Beers Criteria 2023"],
    }
    metadata_path = output_dir / "feature_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved feature metadata to: {metadata_path}")


if __name__ == "__main__":
    train_and_export_model()
