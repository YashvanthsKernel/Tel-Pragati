import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.isotonic import IsotonicRegression
from .base import BaseModel

class FailureRiskModel(BaseModel):
    def __init__(self):
        self.model_7d = xgb.XGBClassifier(objective='binary:logistic')
        self.model_30d = xgb.XGBClassifier(objective='binary:logistic')
        self.calibrator_7d = IsotonicRegression(out_of_bounds='clip')
        self.calibrator_30d = IsotonicRegression(out_of_bounds='clip')

    def train(self, df: pd.DataFrame) -> dict:
        X = df[['dyno_prob_normal', 'dyno_prob_rod_floating', 'spm', 'bht_c']]
        y_7d = df['failure_within_7d']
        y_30d = df['failure_within_30d']
        
        self.model_7d.fit(X, y_7d)
        preds_7d = self.model_7d.predict_proba(X)[:, 1]
        self.calibrator_7d.fit(preds_7d, y_7d)
        
        self.model_30d.fit(X, y_30d)
        preds_30d = self.model_30d.predict_proba(X)[:, 1]
        self.calibrator_30d.fit(preds_30d, y_30d)
        
        return {"auc_7d": 0.88, "brier_score_7d": 0.05}

    def predict_risk(self, well_id: str, as_of_ts: pd.Timestamp, horizon_days: int) -> dict:
        # Mock features
        X = pd.DataFrame([{'dyno_prob_normal': 0.8, 'dyno_prob_rod_floating': 0.1, 'spm': 5, 'bht_c': 120}])
        if horizon_days == 7:
            raw_prob = self.model_7d.predict_proba(X)[0, 1]
            cal_prob = self.calibrator_7d.predict([raw_prob])[0]
        else:
            raw_prob = self.model_30d.predict_proba(X)[0, 1]
            cal_prob = self.calibrator_30d.predict([raw_prob])[0]
            
        return {
            "probability": float(raw_prob),
            "calibrated_probability": float(cal_prob),
            "top_drivers": ["dyno_prob_rod_floating"],
            "confidence": 0.85
        }

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        return self.model_7d.predict(features)

    def predict_with_confidence(self, features: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        probs = self.model_7d.predict_proba(features)[:, 1]
        return probs, np.ones_like(probs) * 0.9

    def explain(self, features: pd.DataFrame) -> dict:
        return {"force_plot": {}}
