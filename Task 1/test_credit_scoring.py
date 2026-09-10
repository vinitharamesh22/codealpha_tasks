import pandas as pd

from credit_scoring import TARGET, add_features, evaluate_models, make_sample_data


def test_sample_data_is_reproducible_and_balanced():
    first = make_sample_data(400)
    second = make_sample_data(400)
    pd.testing.assert_frame_equal(first, second)
    assert set(first[TARGET].unique()) == {0, 1}


def test_feature_engineering_adds_expected_ratios():
    enriched = add_features(make_sample_data(120))
    assert {"debt_to_income", "income_per_account"}.issubset(enriched.columns)
    assert enriched[["debt_to_income", "income_per_account"]].notna().all().all()


def test_all_models_return_required_metrics():
    metrics, models = evaluate_models(make_sample_data(500))
    assert len(models) == 3
    assert set(metrics["model"]) == {"Logistic Regression", "Decision Tree", "Random Forest"}
    assert metrics[["precision", "recall", "f1_score", "roc_auc"]].apply(lambda column: column.between(0, 1).all()).all()
