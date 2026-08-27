class FusionLayer:
    def fuse(self, physics_estimate: float, physics_conf: float, ml_estimate: float, ml_conf: float) -> dict:
        # Convert confidence to pseudo-sigma (variance)
        # Higher confidence = lower variance
        sigma_phys = 1.0 / (physics_conf + 1e-6)
        sigma_ml = 1.0 / (ml_conf + 1e-6)
        
        w_phys = 1.0 / (sigma_phys ** 2)
        w_ml = 1.0 / (sigma_ml ** 2)
        
        fused = (physics_estimate * w_phys + ml_estimate * w_ml) / (w_phys + w_ml)
        divergence_pct = abs(physics_estimate - ml_estimate) / (fused + 1e-6) * 100
        agreement_pct = max(0.0, min(100.0, 100.0 - divergence_pct))
        
        return {
            "fused_value": float(fused),
            "agreement_pct": float(agreement_pct),
            "divergence_pct": float(divergence_pct),
            "physics_estimate": float(physics_estimate),
            "ml_estimate": float(ml_estimate)
        }

    def fuse_all_quantities(self, physics_state: dict, ml_predictions: dict) -> dict:
        fused_state = {}
        if 'viscosity_cp' in physics_state and 'viscosity_cp' in ml_predictions:
            fused_state['viscosity'] = self.fuse(
                physics_state['viscosity_cp'], physics_state.get('viscosity_conf', 0.8),
                ml_predictions['viscosity_cp'], ml_predictions.get('viscosity_conf', 0.85)
            )
        return fused_state
