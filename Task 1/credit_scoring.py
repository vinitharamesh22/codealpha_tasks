"""Train and evaluate a reproducible credit-scoring model comparison."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

RANDOM_STATE = 42
TARGET = "defaulted"
NUMERIC_FEATURES = [
    "annual_income",
    "debt_amount",
    "credit_utilization",
    "payment_delays_12m",
    "credit_history_years",
    "open_accounts",
]
CATEGORICAL_FEATURES = ["employment_status", "home_ownership"]


def make_sample_data(n_rows: int = 2500, random_state: int = RANDOM_STATE) -> pd.DataFrame:
    """Create realistic-looking financial records for a self-contained demo."""
    rng = np.random.default_rng(random_state)
    annual_income = rng.lognormal(mean=10.8, sigma=0.55, size=n_rows).clip(18000, 350000)
    debt_amount = (annual_income * rng.uniform(0.05, 0.85, n_rows)).clip(500, 250000)
    credit_utilization = rng.beta(2.2, 3.0, n_rows).clip(0.01, 0.99)
    payment_delays = rng.poisson(0.8, n_rows).clip(0, 8)
    history_years = rng.gamma(3.2, 2.2, n_rows).clip(0.5, 35)
    open_accounts = rng.poisson(5, n_rows).clip(1, 18)
    employment_status = rng.choice(["employed", "self-employed", "unemployed"], n_rows, p=[0.67, 0.20, 0.13])
    home_ownership = rng.choice(["rent", "mortgage", "own"], n_rows, p=[0.42, 0.43, 0.15])

    debt_to_income = debt_amount / annual_income
    risk_score = (
        -2.8
        + 3.0 * credit_utilization
        + 0.42 * payment_delays
        + 1.4 * debt_to_income
        - 0.045 * history_years
        - 0.06 * open_accounts
        + (employment_status == "unemployed") * 1.25
        + (home_ownership == "rent") * 0.18
    )
    probability = 1 / (1 + np.exp(-risk_score))
    defaulted = rng.binomial(1, probability)

    return pd.DataFrame(
        {
            "annual_income": annual_income.round(2),
            "debt_amount": debt_amount.round(2),
            "credit_utilization": credit_utilization.round(4),
            "payment_delays_12m": payment_delays,
            "credit_history_years": history_years.round(2),
            "open_accounts": open_accounts,
            "employment_status": employment_status,
            "home_ownership": home_ownership,
            TARGET: defaulted,
        }
    )


def add_features(data: pd.DataFrame) -> pd.DataFrame:
    """Add interpretable ratios used by each model."""
    enriched = data.copy()
    enriched["debt_to_income"] = enriched["debt_amount"] / enriched["annual_income"].clip(lower=1)
    enriched["income_per_account"] = enriched["annual_income"] / enriched["open_accounts"].clip(lower=1)
    return enriched.replace([np.inf, -np.inf], np.nan)


def build_preprocessor(data: pd.DataFrame) -> ColumnTransformer:
    numeric = NUMERIC_FEATURES + ["debt_to_income", "income_per_account"]
    categorical = CATEGORICAL_FEATURES
    return ColumnTransformer(
        transformers=[
            ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
            ("categorical", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical),
        ]
    )


def build_models(data: pd.DataFrame) -> dict[str, Pipeline]:
    preprocessor = build_preprocessor(data)
    return {
        "Logistic Regression": Pipeline([("features", preprocessor), ("model", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=RANDOM_STATE))]),
        "Decision Tree": Pipeline([("features", preprocessor), ("model", DecisionTreeClassifier(max_depth=5, class_weight="balanced", random_state=RANDOM_STATE))]),
        "Random Forest": Pipeline([("features", preprocessor), ("model", RandomForestClassifier(n_estimators=160, max_depth=8, class_weight="balanced", random_state=RANDOM_STATE, n_jobs=-1))]),
    }


def evaluate_models(data: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Pipeline]]:
    enriched = add_features(data)
    x = enriched.drop(columns=TARGET)
    y = enriched[TARGET]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE)
    models = build_models(enriched)
    rows = []
    for name, pipeline in models.items():
        pipeline.fit(x_train, y_train)
        predictions = pipeline.predict(x_test)
        probabilities = pipeline.predict_proba(x_test)[:, 1]
        rows.append({
            "model": name,
            "accuracy": accuracy_score(y_test, predictions),
            "precision": precision_score(y_test, predictions, zero_division=0),
            "recall": recall_score(y_test, predictions, zero_division=0),
            "f1_score": f1_score(y_test, predictions, zero_division=0),
            "roc_auc": roc_auc_score(y_test, probabilities),
        })
    return pd.DataFrame(rows).sort_values("roc_auc", ascending=False).reset_index(drop=True), models


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare credit default classifiers on sample financial data.")
    parser.add_argument("--rows", type=int, default=2500, help="Number of synthetic applicants to generate.")
    parser.add_argument("--output", type=Path, default=Path("outputs/model_metrics.csv"), help="Where to save evaluation metrics.")
    args = parser.parse_args()
    if args.rows < 100:
        parser.error("--rows must be at least 100")
    data = make_sample_data(args.rows)
    metrics, _ = evaluate_models(data)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    metrics.to_csv(args.output, index=False)
    print(metrics.to_string(index=False, formatters={column: "{:.3f}".format for column in metrics.columns if column != "model"}))
    print(f"\nSaved metrics to {args.output}")


if __name__ == "__main__":
    main()
