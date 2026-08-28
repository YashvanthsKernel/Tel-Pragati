"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  IndianRupee,
  Activity,
} from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import { runSimulation } from "../../../../data/demo/physicsSim";
import { SimulationParams, SimulationResult } from "../../../../data/types";
import { TimeSeriesChart } from "../../../../components/charts/TimeSeriesChart";
import { RoleGate } from "../../../../components/shell/RoleGate";
import { PageHeader } from "../../../../components/ui/PageHeader";

export default function SimulatorPage() {
  const router = useRouter();
  const { wellId, wellState, isLoading } = useWellContext();

  const [params, setParams] = useState<SimulationParams>({
    spm: 4.8,
    strokeLengthIn: 144,
    steamVolumeBbl: 3500,
    soakDays: 5,
    downstrokeDampingPct: 20,
    crudePriceInrPerBbl: 6200,
  });

  const [simResult, setSimResult] = useState<SimulationResult>(() => runSimulation(wellId, params));
  const [isSimulating, setIsSimulating] = useState(false);

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Initializing Predictive Simulator for {wellId}...
        </span>
      </div>
    );
  }

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setTimeout(() => {
      const result = runSimulation(wellId, params);
      setSimResult(result);
      setIsSimulating(false);
    }, 200);
  };

  const handleSendToOptimizer = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `sim_candidate_${wellId}`,
        JSON.stringify({
          name: "Strategy S (Simulated)",
          label: `Custom What-If (${params.spm} SPM, -${params.downstrokeDampingPct}% Damping)`,
          productionBopd: simResult.trajectory[25].simulatedProductionBopd,
          energyKwhDay: 36.4,
          rodRiskPct: simResult.trajectory[25].simulatedRiskPct,
          costInrDay: 84000,
          netValueInrDay:
            simResult.trajectory[25].simulatedProductionBopd * 6200 - 84000,
          recommended: false,
          spm: params.spm,
          strokeLenIn: params.strokeLengthIn,
          vfdProfile: `Simulated Asymmetric (${params.downstrokeDampingPct}% damping)`,
          rationale: "Candidate strategy imported from What-If Simulator module.",
        })
      );
    }
    router.push(`/well/${wellId}/optimizer`);
  };

  const prodComparisonData = simResult.trajectory.map((t) => ({
    x: `Day ${t.day}`,
    y: t.simulatedProductionBopd,
    label: `Simulated: ${t.simulatedProductionBopd} BOPD (Baseline: ${t.baselineProductionBopd} BOPD)`,
  }));

  const riskComparisonData = simResult.trajectory.map((t) => ({
    x: `Day ${t.day}`,
    y: t.simulatedRiskPct,
    label: `Simulated Risk: ${t.simulatedRiskPct}% (Baseline: ${t.baselineRiskPct}%)`,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        wellId={wellId}
        icon={<Sliders className="w-5 h-5 text-accent-mechanical" />}
        title="Predictive What-If Lift & Thermal Simulator"
        subtitle="Coupled Forward Prognostic Engine · VFD Speed Profile & Steam Slug Tuning"
        actions={
          <button
            type="button"
            onClick={handleSendToOptimizer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-accent-mechanical text-surface-0 text-xs font-sans font-semibold hover:bg-accent-mechanical/90 transition-colors"
          >
            <span>Send Candidate to Optimizer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: What-If Parameter Form & Workstation Controls ── */}
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              What-If Simulation Inputs
            </span>
            <span className="text-[10px] font-mono text-accent-mechanical font-semibold">Interactive</span>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            {/* Input 1: SPM */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-text-secondary font-medium">Pumping Speed (SPM)</span>
                <span className="font-mono font-bold text-text-primary tabular-nums">{params.spm} SPM</span>
              </div>
              <input
                type="range"
                min="2.5"
                max="7.0"
                step="0.1"
                value={params.spm}
                onChange={(e) => setParams({ ...params, spm: parseFloat(e.target.value) })}
                className="w-full h-1 bg-surface-0 rounded appearance-none accent-accent-mechanical cursor-pointer"
              />
            </div>

            {/* Input 2: Downstroke Damping */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-text-secondary font-medium">Downstroke Damping (%)</span>
                <span className="font-mono font-bold text-accent-thermal tabular-nums">-{params.downstrokeDampingPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="1"
                value={params.downstrokeDampingPct}
                onChange={(e) => setParams({ ...params, downstrokeDampingPct: parseInt(e.target.value) })}
                className="w-full h-1 bg-surface-0 rounded appearance-none accent-accent-thermal cursor-pointer"
              />
            </div>

            {/* Input 3: Steam Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-text-secondary font-medium">Steam Slug Volume</span>
                <span className="font-mono font-bold text-text-primary tabular-nums">{params.steamVolumeBbl} bbl</span>
              </div>
              <input
                type="range"
                min="2000"
                max="5000"
                step="100"
                value={params.steamVolumeBbl}
                onChange={(e) => setParams({ ...params, steamVolumeBbl: parseInt(e.target.value) })}
                className="w-full h-1 bg-surface-0 rounded appearance-none accent-accent-mechanical cursor-pointer"
              />
            </div>

            {/* Input 4: Soak Days */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-text-secondary font-medium">Thermal Soak Duration</span>
                <span className="font-mono font-bold text-text-primary tabular-nums">{params.soakDays} Days</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={params.soakDays}
                onChange={(e) => setParams({ ...params, soakDays: parseInt(e.target.value) })}
                className="w-full h-1 bg-surface-0 rounded appearance-none accent-accent-mechanical cursor-pointer"
              />
            </div>

            <RoleGate
              roles={["operator", "engineer", "admin"]}
              fallback={
                <div className="text-[11px] font-sans text-text-muted italic text-center p-2">
                  Simulation computation requires Operator or Engineer role.
                </div>
              }
            >
              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2 px-4 rounded bg-accent-mechanical text-surface-0 font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent-mechanical/90 transition-colors mt-3"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Computing Forward Trajectory..." : "Run Predictive Simulation"}</span>
              </button>
            </RoleGate>
          </form>

          {/* ── Predicted Impact Summary ── */}
          <div className="p-3 rounded bg-surface-0 border border-line space-y-2 text-xs font-mono mt-4">
            <div className="text-[10px] font-sans text-text-muted uppercase font-bold tracking-wide">
              Predicted Impact Summary
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-sans">Delta Production:</span>
              <span className={`font-bold tabular-nums ${simResult.summary.deltaProductionBopd >= 0 ? "text-status-safe" : "text-status-warn"}`}>
                {simResult.summary.deltaProductionBopd > 0 ? "+" : ""}{simResult.summary.deltaProductionBopd} BOPD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-sans">Delta Rod Risk:</span>
              <span className={`font-bold tabular-nums ${simResult.summary.deltaRiskPct <= 0 ? "text-status-safe" : "text-status-critical"}`}>
                {simResult.summary.deltaRiskPct > 0 ? "+" : ""}{simResult.summary.deltaRiskPct}%
              </span>
            </div>
            <div className="flex justify-between border-t border-line pt-1.5">
              <span className="text-text-muted font-sans">Est. Daily Net Margin:</span>
              <span className="font-bold text-status-safe tabular-nums">
                +₹{Math.abs(Math.round(simResult.summary.deltaNetValueInrDay)).toLocaleString()}/day
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Comparative Charts ── */}
        <div className="lg:col-span-2 space-y-4">
          <TimeSeriesChart
            data={prodComparisonData}
            title="Simulated vs. Baseline Gross Oil Production (BOPD)"
            xLabel="CSS Cycle Day"
            yLabel="Production (BOPD)"
            color="var(--status-safe)"
            unit="BOPD"
            height={220}
          />

          <TimeSeriesChart
            data={riskComparisonData}
            title="Simulated vs. Baseline Rod Floating Risk Profile (%)"
            xLabel="CSS Cycle Day"
            yLabel="Risk %"
            color="var(--accent-thermal)"
            unit="%"
            height={220}
          />
        </div>
      </div>
    </div>
  );
}
