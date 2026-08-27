import structlog
from typing import Dict, Any

from ..models.production_forecaster import ProductionForecaster
from ..models.viscosity_corrector import ViscosityResidualCorrector
from ..models.dynamometer_classifier import DynamometerClassifier
from ..models.failure_risk import FailureRiskModel
from ..models.anomaly_detector import AnomalyDetector
from ..models.fusion import FusionLayer

logger = structlog.get_logger()

class MLInferenceService:
    def __init__(self):
        self.forecaster = ProductionForecaster.load_from_registry('ProductionForecaster')
        self.corrector = ViscosityResidualCorrector.load_from_registry('ViscosityResidualCorrector')
        self.classifier = DynamometerClassifier.load_from_registry('DynamometerClassifier')
        self.risk_model = FailureRiskModel.load_from_registry('FailureRiskModel')
        self.anomaly_detector = AnomalyDetector.load_from_registry('AnomalyDetector')
        self.fusion = FusionLayer()
        self.logger = logger.bind(service="MLInference")

    def predict_production(self, well_id: str, features: pd.DataFrame) -> dict:
        return self.forecaster.predict(features)

    def correct_viscosity(self, physics_mu: float, features: dict) -> dict:
        val, conf = self.corrector.correct(physics_mu, features)
        return {"corrected_viscosity": val, "confidence": conf}

    def classify_dynamometer_card(self, card_trace: dict) -> dict:
        return self.classifier.classify(card_trace)

    def predict_failure_risk(self, well_id: str, as_of_ts: Any, horizon_days: int) -> dict:
        return self.risk_model.predict_risk(well_id, as_of_ts, horizon_days)

    def check_sensor_health(self, reading: dict) -> dict:
        return self.anomaly_detector.check(reading)

    def get_full_ml_predictions(self, well_id: str, features: dict, physics_state: dict) -> dict:
        health = self.check_sensor_health(features)
        if health['quality_flag'] == 'BAD':
            self.logger.warning("Bad sensor data, falling back to physics")
            return self.fallback_to_physics_only()
            
        visc = self.correct_viscosity(physics_state.get('viscosity_cp', 100), features)
        risk = self.predict_failure_risk(well_id, None, 7)
        
        return {
            "health": health,
            "viscosity_correction": visc,
            "failure_risk": risk
        }

    def fallback_to_physics_only(self) -> dict:
        return {"status": "degraded", "message": "ML models disabled due to bad data"}
