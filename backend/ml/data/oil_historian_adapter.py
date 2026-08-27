import pandas as pd
import yaml

class OilHistorianAdapter:
    def __init__(self, config_path: str):
        self.config_path = config_path
        # Mock load for yaml
        self.field_map = {'TEMP_BHT': 'bht_c', 'VISC': 'viscosity_cp', 'FLOW': 'flow_bopd'}
        self.unit_conversions = {'TEMP_BHT': lambda x: (x - 32) * 5/9} # F to C

    def load_csv_batch(self, file_path: str) -> pd.DataFrame:
        df = pd.read_csv(file_path)
        df = self._canonicalize(df)
        df = self._apply_unit_conversions(df)
        return df

    def load_sql_dump(self, connection_string: str, query: str) -> pd.DataFrame:
        # placeholder for SQL load
        df = pd.DataFrame()
        return self._canonicalize(df)

    def _canonicalize(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.rename(columns=self.field_map)
        df['source'] = 'scada'
        df['label_source'] = 'weak'
        return df

    def _apply_unit_conversions(self, df: pd.DataFrame) -> pd.DataFrame:
        # Example conversion
        if 'bht_c' in df.columns:
            # assuming it was in F originally but already mapped to bht_c name
            pass
        return df

    def extract_weak_labels_from_workover_log(self, log_df: pd.DataFrame) -> pd.DataFrame:
        labels = log_df[['timestamp', 'well_id', 'failure_type']].copy()
        labels['label_source'] = 'weak'
        return labels
