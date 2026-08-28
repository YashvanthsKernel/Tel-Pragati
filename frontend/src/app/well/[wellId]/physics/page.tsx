"use client";

import React, { useState } from "react";
import {
  Atom,
  Flame,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Thermometer,
  Droplets,
  ShieldCheck,
  Activity,
  Gauge,
} from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import {
  CalibratedPhysicsParams,
  DEFAULT_PHYSICS_PARAMS,
  calculateBottomholeTemp,
  calculateViscosityCp,
  calculateRodDragLb,
  calculateRodFloatingRiskPct,
} from "../../../../data/demo/physicsSim";
import { MultiAxisChart } from "../../../../components/charts/MultiAxisChart";
import { TimeSeriesChart } from "../../../../components/charts/TimeSeriesChart";
import { RoleGate } from "../../../../components/shell/RoleGate";
import { PageHeader } from "../../../../components/ui/PageHeader";

export default function PhysicsPage() {
  const { wellId, wellState, isLoading } = useWellContext();
  const [params, setParams] = useState<CalibratedPhysicsParams>(DEFAULT_PHYSICS_PARAMS);
  const [isModified, setIsModified] = useState(false);

  const handleParamChange = (key: keyof CalibratedPhysicsParams, val: number) => {
    setParams((prev) => ({ ...prev, [key]: val }));
    setIsModified(true);
  };

  const handleReset = () => {
    setParams(DEFAULT_PHYSICS_PARAMS);
    setIsModified(false);
  };

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Loading Physics Calibration Models for {wellId}...
        </span>
      </div>
    );
  }

  // Generate real-time curve data from the edited physics parameters (§10.2)
  const trajectoryData = Array.from({ length: 46 }, (_, d) => {
    const tempC = calculateBottomholeTemp(d, params);
    const viscosityCp = calculateViscosityCp(tempC, 17.2, params);
    const dragLb = calculateRodDragLb(viscosityCp, 5.2, 0);
    const riskPct = calculateRodFloatingRiskPct(dragLb, params);

    return {
      day: d,
      tempC,
      viscosityCp,
      dragLb,
      riskPct,
    };
  });

  const rheologyTempCurve = Array.from({ length: 30 }, (_, i) => {
    const t = 35 + i * 5; // 35°C to 180°C
    const visc = calculateViscosityCp(t, 17.2, params);
    return {
      x: `${t}°C`,
      y: visc,
      label: `Temp ${t}°C`,
    };
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── 1. Page Header ── */}
      <PageHeader
        wellId={wellId}
        icon={<Atom className="w-5 h-5 text-accent-thermal" />}
        title="First-Principles Physics & Rheology Engine"
        subtitle="Coupled Convective Thermal Diffusion · Andrade/Vogel Rheology · Gibbs 1D Wave Shear"
        badge="Calibrated Model v2.4"
        actions={
          isModified ? (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-2 border border-line text-xs font-sans text-text-secondary hover:text-text-primary transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Calibrations</span>
            </button>
          ) : undefined
        }
      />

      {/* ── 2. Primary Engineering State Area (§8: WHAT IS HAPPENING FIRST) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* State 1: Thermal */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-xs font-sans font-medium uppercase tracking-wide">Current Thermal State</span>
            <Thermometer className="w-4 h-4 text-accent-thermal" />
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-accent-thermal tabular-nums">
              {wellState.inferred.bottomholeTempC.value.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-text-muted">°C</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 flex justify-between">
            <span>Reservoir Base: {params.initResTempC}°C</span>
            <span className="text-accent-thermal font-mono">Day {wellState.day}</span>
          </div>
        </div>

        {/* State 2: Viscosity */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-xs font-sans font-medium uppercase tracking-wide">In-Situ Viscosity</span>
            <Droplets className="w-4 h-4 text-accent-mechanical" />
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-accent-mechanical tabular-nums">
              {wellState.inferred.viscosityCp.value.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-text-muted">cP</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 flex justify-between">
            <span>Heavy Crude: 17.2° API</span>
            <span className="text-accent-mechanical font-mono">Andrade</span>
          </div>
        </div>

        {/* State 3: Downstroke Rod Drag */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-xs font-sans font-medium uppercase tracking-wide">Downstroke Rod Drag</span>
            <Gauge className="w-4 h-4 text-text-muted" />
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tabular-nums">
              {wellState.inferred.rodDragLb.value.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-text-muted">lb</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 flex justify-between">
            <span>Buoyant Wt: {params.buoyantRodWeightLb.toLocaleString()} lb</span>
            <span className={`font-mono font-bold ${wellState.rodFloatingRiskPct > 50 ? "text-status-warn" : "text-status-safe"}`}>
              Risk: {wellState.rodFloatingRiskPct}%
            </span>
          </div>
        </div>

        {/* State 4: Model Confidence */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary mb-1">
            <span className="text-xs font-sans font-medium uppercase tracking-wide">Model Confidence</span>
            <ShieldCheck className="w-4 h-4 text-status-safe" />
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-status-safe tabular-nums">
              {(wellState.inferred.bottomholeTempC.confidence * 100).toFixed(1)}
            </span>
            <span className="text-xs font-mono text-text-muted">%</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 flex justify-between">
            <span>Dual-Solver Architecture</span>
            <span className="text-status-safe font-mono font-bold">PINN + 1D Wave</span>
          </div>
        </div>
      </div>

      {/* ── 3. Main Analytical Visualization: Thermal – Rheology Coupling Chart ── */}
      <MultiAxisChart data={trajectoryData} height={260} />

      {/* ── 4. Calibrated Physical Boundary Parameters (Compact Engineering Strip) ── */}
      <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-mechanical" />
            <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Calibrated Physical Boundary Parameters
            </span>
          </div>
          <RoleGate
            roles={["engineer", "admin"]}
            fallback={
              <span className="text-[11px] font-sans text-text-muted italic">
                Read-Only (Requires Engineer role to adjust)
              </span>
            }
          >
            <span className="text-[11px] font-sans text-status-safe font-semibold">
              ● Engineer Calibration Mode Active
            </span>
          </RoleGate>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Parameter 1: Tau Thermal Decay */}
          <div className="p-2 rounded bg-surface-0 border border-line space-y-0.5">
            <div className="text-[10px] font-sans text-text-muted">Decay Const (τ)</div>
            <input
              type="number"
              step="0.002"
              value={params.tauDecay}
              onChange={(e) => handleParamChange("tauDecay", parseFloat(e.target.value))}
              className="w-full bg-transparent font-mono text-xs font-bold text-accent-thermal focus:outline-none"
            />
            <div className="text-[9px] font-mono text-text-muted">T_decay = e^(-τ·t)</div>
          </div>

          {/* Parameter 2: Peak Temp */}
          <div className="p-2 rounded bg-surface-0 border border-line space-y-0.5">
            <div className="text-[10px] font-sans text-text-muted">Peak Steam (T_peak)</div>
            <input
              type="number"
              step="1"
              value={params.peakTempC}
              onChange={(e) => handleParamChange("peakTempC", parseFloat(e.target.value))}
              className="w-full bg-transparent font-mono text-xs font-bold text-accent-thermal focus:outline-none"
            />
            <div className="text-[9px] font-mono text-text-muted">°C (Post-injection)</div>
          </div>

          {/* Parameter 3: Initial Res Temp */}
          <div className="p-2 rounded bg-surface-0 border border-line space-y-0.5">
            <div className="text-[10px] font-sans text-text-muted">Reservoir Base (T_res)</div>
            <input
              type="number"
              step="1"
              value={params.initResTempC}
              onChange={(e) => handleParamChange("initResTempC", parseFloat(e.target.value))}
              className="w-full bg-transparent font-mono text-xs font-bold text-accent-thermal focus:outline-none"
            />
            <div className="text-[9px] font-mono text-text-muted">°C (Native Jodhpur)</div>
          </div>

          {/* Parameter 4: Andrade A */}
          <div className="p-2 rounded bg-surface-0 border border-line space-y-0.5">
            <div className="text-[10px] font-sans text-text-muted">Rheology Coeff (A)</div>
            <input
              type="number"
              step="0.01"
              value={params.viscosityA}
              onChange={(e) => handleParamChange("viscosityA", parseFloat(e.target.value))}
              className="w-full bg-transparent font-mono text-xs font-bold text-accent-mechanical focus:outline-none"
            />
            <div className="text-[9px] font-mono text-text-muted">Pre-exponential cP</div>
          </div>

          {/* Parameter 5: Andrade B */}
          <div className="p-2 rounded bg-surface-0 border border-line space-y-0.5">
            <div className="text-[10px] font-sans text-text-muted">Activation Const (B)</div>
            <input
              type="number"
              step="50"
              value={params.viscosityB}
              onChange={(e) => handleParamChange("viscosityB", parseFloat(e.target.value))}
              className="w-full bg-transparent font-mono text-xs font-bold text-accent-mechanical focus:outline-none"
            />
            <div className="text-[9px] font-mono text-text-muted">Energy barrier K</div>
          </div>

          {/* Parameter 6: Rod Buoyancy */}
          <div className="p-2 rounded bg-surface-0 border border-line space-y-0.5">
            <div className="text-[10px] font-sans text-text-muted">Buoyant Weight (W_b)</div>
            <input
              type="number"
              step="200"
              value={params.buoyantRodWeightLb}
              onChange={(e) => handleParamChange("buoyantRodWeightLb", parseFloat(e.target.value))}
              className="w-full bg-transparent font-mono text-xs font-bold text-text-primary focus:outline-none"
            />
            <div className="text-[9px] font-mono text-text-muted">lb (Grade D String)</div>
          </div>
        </div>
      </div>

      {/* ── 5. Physical Governing Model Formulations (Supporting detail, not hero) ── */}
      <div className="space-y-2">
        <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
          Governing Physical Formulations & Coupling Equations
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Equation 1 */}
          <div className="p-3 rounded-lg bg-surface-1 border border-line shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-accent-thermal">
                1. Convective Thermal Decay
              </span>
            </div>
            <div className="p-2 rounded bg-surface-0 border border-line font-mono text-xs text-text-primary overflow-x-auto">
              T_BHT(t) = T_res + (T_peak - T_res) · e^(-τ(t - 10))
            </div>
            <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
              Models transient heat conduction and convective energy dissipation into the surrounding formation during heavy oil inflow.
            </p>
          </div>

          {/* Equation 2 */}
          <div className="p-3 rounded-lg bg-surface-1 border border-line shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-accent-mechanical">
                2. Andrade / Vogel Heavy Rheology
              </span>
            </div>
            <div className="p-2 rounded bg-surface-0 border border-line font-mono text-xs text-text-primary overflow-x-auto">
              μ(T) = A · exp(B / (T + C))
            </div>
            <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
              Captures exponential viscosity thinning across 35°C to 195°C thermal windows for 17.2° API extra-heavy crude.
            </p>
          </div>

          {/* Equation 3 */}
          <div className="p-3 rounded-lg bg-surface-1 border border-line shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-bold text-status-warn">
                3. Gibbs 1D Wave Rod Shear Drag
              </span>
            </div>
            <div className="p-2 rounded bg-surface-0 border border-line font-mono text-xs text-text-primary overflow-x-auto">
              F_drag = C_geom · μ^0.62 · v_downstroke · L_rod
            </div>
            <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
              Solves distributed annular hydrodynamic shear friction acting upward against the downward rod stroke velocity.
            </p>
          </div>
        </div>
      </div>

      {/* ── 6. Viscosity vs Temperature Curve & Dual-Redundant Integrity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimeSeriesChart
          data={rheologyTempCurve}
          title="Heavy Crude Viscosity vs. Bottomhole Temperature (35°C – 180°C)"
          xLabel="Temperature (°C)"
          yLabel="Viscosity (cP)"
          color="var(--accent-mechanical)"
          unit="cP"
          height={220}
        />

        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-3 flex flex-col justify-between">
          <div>
            <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Dual-Redundant Solver & Surrogate Observation Integrity
            </span>
            <p className="text-xs font-sans text-text-secondary leading-relaxed mt-1.5">
              The Digital Twin evaluates first-principles thermodynamic and wave equations at 1 Hz alongside a deep neural surrogate observer trained on synthetic physics ensembles.
            </p>
          </div>

          <div className="p-3 rounded bg-surface-0 border border-line text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Governing Solver:</span>
              <span className="font-bold text-accent-thermal">Convective Diffusion + Gibbs Wave</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Surrogate Observer:</span>
              <span className="font-bold text-accent-mechanical">Physics-Informed Neural Network (PINN)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Uncertainty Envelope:</span>
              <span className="font-bold text-status-safe">± 1.4°C / ± 8.2% cP (95% CI)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
