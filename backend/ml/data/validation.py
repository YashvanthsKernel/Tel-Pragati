import pandas as pd
from typing import Tuple, Dict, Any
from dataclasses import dataclass
from .schemas import WellStateSchema

@dataclass
class ValidationResult:
    passed: bool
    failed_rows: pd.DataFrame
    warnings: list
    errors: list

class DataValidator:
    VALIDATION_RULES = {
        'bht_c': (0, 400),
        'viscosity_cp': (0, 10000),
        'spm': (0, 20),
        'stroke_len_m': (0, 10),
        'motor_current_a': (0, 200),
        'flow_bopd': (0, 5000)
    }

    def validate_batch(self, df: pd.DataFrame) -> ValidationResult:
        errors = []
        warnings = []
        failed_mask = pd.Series(False, index=df.index)

        try:
            WellStateSchema.validate(df, lazy=True)
        except Exception as e:
            errors.append(f"Schema validation failed: {str(e)}")

        for col, (min_val, max_val) in self.VALIDATION_RULES.items():
            if col in df.columns:
                out_of_bounds = (df[col] < min_val) | (df[col] > max_val)
                if out_of_bounds.any():
                    warnings.append(f"Column {col} has {out_of_bounds.sum()} values out of bounds ({min_val}, {max_val})")
                    failed_mask = failed_mask | out_of_bounds

        # Missingness checks
        critical_cols = ['bht_c', 'viscosity_cp', 'flow_bopd']
        for col in critical_cols:
            if col in df.columns:
                missing_pct = df[col].isnull().mean()
                if missing_pct > 0.3:
                    errors.append(f"Column {col} has {missing_pct*100:.1f}% missing values (threshold: 30%)")

        passed = len(errors) == 0
        return ValidationResult(passed=passed, failed_rows=df[failed_mask], warnings=warnings, errors=errors)

    def validate_row(self, row: dict) -> Tuple[bool, str]:
        for col, (min_val, max_val) in self.VALIDATION_RULES.items():
            if col in row and row[col] is not None:
                if row[col] < min_val or row[col] > max_val:
                    return False, f"Value {row[col]} for {col} out of bounds"
        return True, ""
