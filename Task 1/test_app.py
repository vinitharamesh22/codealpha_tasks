from app import app


def test_dashboard_and_metrics_routes():
    client = app.test_client()
    assert client.get("/").status_code == 200
    response = client.get("/api/metrics")
    assert response.status_code == 200
    assert len(response.json["metrics"]) == 3


def test_prediction_route_returns_risk_details():
    client = app.test_client()
    response = client.post(
        "/api/predict",
        json={
            "annual_income": 72000,
            "debt_amount": 28000,
            "credit_utilization": 0.34,
            "payment_delays_12m": 1,
            "credit_history_years": 8,
            "open_accounts": 5,
            "employment_status": "employed",
            "home_ownership": "mortgage",
            "model": "Logistic Regression",
        },
    )
    assert response.status_code == 200
    assert 0 <= response.json["default_probability"] <= 1
    assert response.json["decision"] in {"Higher risk", "Lower risk"}


def test_prediction_route_validates_required_fields():
    response = app.test_client().post("/api/predict", json={})
    assert response.status_code == 400
    assert "Missing fields" in response.json["error"]
