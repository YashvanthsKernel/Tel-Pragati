import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from .base import BaseModel

class AnomalyDetector(BaseModel):
    RULES = {
        'bht_c': (0, 350),
        'spm': (0, 20),
        'motor_current_a': (0, 250)
    }

    def __init__(self):
        self.iso_forest = IsolationForest(contamination=0.01)

    def train_isolation_forest(self, df: pd.DataFrame) -> dict:
        X = df[['bht_c', 'spm', 'motor_current_a']].fillna(0)
        self.iso_forest.fit(X)
        return {"n_anomalies_found": int(np.sum(self.iso_forest.predict(X) == -1))}

    def check(self, reading: dict) -> dict:
        # Layer 1: Rules
        for k, (min_v, max_v) in self.RULES.items():
            if k in reading and (reading[k] < min_v or reading[k] > max_v):
                return {
                    "quality_flag": "BAD",
                    "anomaly_score": 1.0,
                    "reason": f"{k} out of bounds",
                    "feature_contributions": {k: 1.0}
                }
                
        # Layer 2: IF
        X = pd.DataFrame([reading])[['bht_c', 'spm', 'motor_current_a']].fillna(0)
        score = self.iso_forest.score_samples(X)[0]
        is_anomaly = self.iso_forest.predict(X)[0] == -1
        
        return {
            "quality_flag": "SUSPECT" if is_anomaly else "GOOD",
            "anomaly_score": float(-score),
            "reason": "Isolation Forest Anomaly" if is_anomaly else "Normal",
            "feature_contributions": {}
        }

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        return self.iso_forest.predict(features)

    def predict_with_confidence(self, features: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        preds = self.iso_forest.predict(features)
        return preds, np.abs(self.iso_forest.score_samples(features))

    def explain(self, features: pd.DataFrame) -> dict:
        return {}
