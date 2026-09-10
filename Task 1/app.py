"""Web application for exploring the credit scoring model."""

from __future__ import annotations

import pandas as pd

from flask import Flask, jsonify, render_template, request

from credit_scoring import TARGET, add_features, evaluate_models, make_sample_data

app = Flask(__name__)

# Train once when the app starts so predictions are fast and deterministic.
_training_data = make_sample_data()
_metrics, _models = evaluate_models(_training_data)

REQUIRED_FIELDS = {
    "annual_income",
    "debt_amount",
    "credit_utilization",
    "payment_delays_12m",
    "credit_history_years",
    "open_accounts",
    "employment_status",
    "home_ownership",
}


def _as_number(payload: dict, field: str) -> float:
    try:
        value = float(payload[field])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError(f"{field} must be a number") from error
    if value < 0:
        raise ValueError(f"{field} cannot be negative")
    return value


def _prediction_payload(payload: dict) -> dict:
    missing = sorted(REQUIRED_FIELDS - payload.keys())
    if missing:
        raise ValueError(f"Missing fields: {', '.join(missing)}")

    applicant = {
        "annual_income": _as_number(payload, "annual_income"),
        "debt_amount": _as_number(payload, "debt_amount"),
        "credit_utilization": _as_number(payload, "credit_utilization"),
        "payment_delays_12m": _as_number(payload, "payment_delays_12m"),
        "credit_history_years": _as_number(payload, "credit_history_years"),
        "open_accounts": _as_number(payload, "open_accounts"),
        "employment_status": str(payload["employment_status"]),
        "home_ownership": str(payload["home_ownership"]),
    }
    if applicant["credit_utilization"] > 1:
        raise ValueError("credit_utilization must be between 0 and 1")
    if applicant["employment_status"] not in {"employed", "self-employed", "unemployed"}:
        raise ValueError("Unsupported employment_status")
    if applicant["home_ownership"] not in {"rent", "mortgage", "own"}:
        raise ValueError("Unsupported home_ownership")
    return applicant


@app.get("/")
def dashboard():
    return render_template("index.html")


@app.get("/api/metrics")
def metrics():
    rows = _metrics.to_dict(orient="records")
    return jsonify({"metrics": rows, "sample_size": len(_training_data)})


@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    try:
        applicant = _prediction_payload(payload)
        model_name = payload.get("model", "Logistic Regression")
        if model_name not in _models:
            raise ValueError("Unknown model")
        frame = add_features(pd.DataFrame([applicant]))
        model = _models[model_name]
        probability = float(model.predict_proba(frame)[:, 1][0])
        prediction = int(probability >= 0.5)
        return jsonify(
            {
                "model": model_name,
                "default_probability": probability,
                "prediction": prediction,
                "decision": "Higher risk" if prediction else "Lower risk",
                "debt_to_income": float(applicant["debt_amount"] / max(applicant["annual_income"], 1)),
            }
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
