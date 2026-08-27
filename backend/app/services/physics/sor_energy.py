"""
SOR (Steam to Oil Ratio) and energy calculations.
"""
from typing import Dict

class EnergyModel:
    def compute_sor(self, cumulative_steam_tons: float, cumulative_oil_bbl: float) -> float:
        """Compute Steam-to-Oil Ratio."""
        if cumulative_oil_bbl <= 0:
            return 0.0
        # Typically SOR is bbl water eq / bbl oil or tons / m3. We do tons / bbl.
        return cumulative_steam_tons / cumulative_oil_bbl

    def compute_pumping_energy_kwh(self, spm: float, stroke_len_in: float, motor_current_a: float, hours: float) -> float:
        """Estimate pumping energy in kWh."""
        # Power = sqrt(3) * V * I * PF / 1000. Assuming V=480, PF=0.8
        kw = 1.732 * 480.0 * motor_current_a * 0.8 / 1000.0
        return kw * hours

    def compute_steam_energy_mj(self, steam_vol_tons: float, steam_temp_c: float) -> float:
        """Compute enthalpy of injected steam in MJ."""
        # Enthalpy of saturated steam approx 2.7 GJ/ton = 2700 MJ/ton
        return steam_vol_tons * 2700.0

    def compute_energy_per_bbl(self, pumping_kwh: float, steam_mj: float, oil_bbl: float) -> float:
        """Compute total MJ per bbl of oil. (1 kWh = 3.6 MJ)"""
        if oil_bbl <= 0:
            return 0.0
        total_mj = pumping_kwh * 3.6 + steam_mj
        return total_mj / oil_bbl

    def compute_net_value_inr_day(self, production_bopd: float, energy_kwh_day: float, 
                                  steam_tons_day: float, risk_factor: float, settings: Dict[str, float]) -> Dict[str, float]:
        """Compute daily economics."""
        oil_price = settings.get("oil_price_inr_bbl", 6000.0)
        power_cost = settings.get("power_cost_inr_kwh", 8.0)
        steam_cost = settings.get("steam_cost_inr_ton", 2000.0)
        base_maintenance = settings.get("base_maintenance_inr", 5000.0)
        
        gross_revenue = production_bopd * oil_price
        lifting_cost = energy_kwh_day * power_cost
        thermal_cost = steam_tons_day * steam_cost
        # Maintenance increases with risk factor (0-100)
        maintenance_cost = base_maintenance * (1.0 + risk_factor / 50.0)
        
        net_value = gross_revenue - (lifting_cost + thermal_cost + maintenance_cost)
        
        return {
            "gross_revenue": gross_revenue,
            "lifting_cost": lifting_cost,
            "thermal_cost": thermal_cost,
            "maintenance_cost": maintenance_cost,
            "net_value": net_value
        }

    def compute_economic_cutoff_day(self, revenue_curve: list, cost_curve: list) -> int:
        """Find the day where marginal revenue < marginal cost."""
        for day, (rev, cost) in enumerate(zip(revenue_curve, cost_curve)):
            if rev < cost:
                return day
        return len(revenue_curve)
