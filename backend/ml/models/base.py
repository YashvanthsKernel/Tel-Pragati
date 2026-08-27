from abc import ABC, abstractmethod
import pandas as pd
import numpy as np

class BaseModel(ABC):
    @abstractmethod
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        pass

    @abstractmethod
    def predict_with_confidence(self, features: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        pass

    @abstractmethod
    def explain(self, features: pd.DataFrame) -> dict:
        pass

    @classmethod
    def load_from_registry(cls, model_name: str, stage: str = 'Production') -> 'BaseModel':
        # Mock MLflow loading
        return cls()

    def save_to_registry(self, run_id: str, metrics: dict) -> str:
        # Mock MLflow saving
        return f"{self.__class__.__name__}_v1"

    def get_model_card(self) -> dict:
        return {
            "model_name": self.__class__.__name__,
            "description": "Base model card",
            "version": "1.0"
        }
