# Credit Scoring Model

A reproducible classification project for predicting whether an applicant will default, based on income, debt, credit utilization, payment history, credit history, employment, and home ownership.

## What it includes

- Synthetic financial data generation so the project runs without a private dataset.
- Feature engineering for debt-to-income and income-per-account ratios.
- Preprocessing for missing values, numeric scaling, and categorical encoding.
- Comparison of Logistic Regression, Decision Tree, and Random Forest models.
- Accuracy, Precision, Recall, F1-Score, and ROC-AUC evaluation.

The synthetic data is for demonstration only. It must not be used to make real lending decisions.

## Setup

Use Python 3.11 or newer with a stable release supported by scikit-learn.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Run the model comparison

```powershell
python credit_scoring.py
```

The command prints a ranked metrics table and saves `outputs/model_metrics.csv`.

To change the sample size:

```powershell
python credit_scoring.py --rows 5000 --output outputs/large_run.csv
```

## Run tests

```powershell
pytest -q
```

## Run the dashboard

```powershell
python -m pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000` in your browser. The dashboard provides a browser-based applicant form, a prediction API, and a model benchmark table.

API endpoints:

- `GET /api/metrics` returns the model comparison metrics.
- `POST /api/predict` scores an applicant JSON payload.

## Replacing the sample data

Load a real, consented dataset into a DataFrame with the feature columns listed in `credit_scoring.py` and a binary `defaulted` target, then pass it to `evaluate_models(data)`. Before any real-world use, add governance checks for fairness, explainability, privacy, drift, calibration, and applicable lending regulations.
