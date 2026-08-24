"use client";

import React from "react";
import { Atom, Layers, ShieldCheck, Thermometer, Zap } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { ThermalDecayPlot } from "../../components/charts/ThermalDecayPlot";
import { ViscosityRheologyPlot } from "../../components/charts/ViscosityRheologyPlot";
import { StatusPill } from "../../components/ui/StatusPill";

export default function PhysicsPage() {
  const { twinState, simulationDay } = useTwinStore();

  return (
    <div className="space-y-4 select-none">
      {/* Page Title Strip */}
      <div className="flex items-center justify-between border-b border-app-border pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-oil-charcoal text-white flex items-center justify-center font-bold">
            <Atom className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">
              Physics & Rheology Engineering Subsystems
            </h1>
            <p className="text-xs text-text-secondary font-mono">
              Explicit Mathematical Models for Baghewala Heavy Crude & Jodhpur Sandstone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill variant="ESTIMATED" size="sm" />
          <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Coupled Twin Confidence: {twinState.confidence.overall}%
          </span>
        </div>
      </div>

      {/* Physics vs ML Surrogate Model Agreement Banner */}
      <div className="bg-surface rounded-md border border-blue-200 p-3.5 space-y-2 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-950 uppercase">
              Hybrid Architecture: Physics Model vs Learned ML Surrogate Agreement
            </span>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            AGREEMENT: {twinState.modelAgreement.agreementPercent}% ({twinState.modelAgreement.status.replace("_", " ")})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
          <div className="p-2 rounded bg-surface-alt border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">1. First-Principles Thermal Physics</span>
            <span className="font-bold text-text-primary text-sm">{twinState.modelAgreement.physicsEstimate}°C</span>
          </div>
          <div className="p-2 rounded bg-surface-alt border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">2. Deep Neural Surrogate Observer</span>
            <span className="font-bold text-text-primary text-sm">{twinState.modelAgreement.mlSurrogateEstimate}°C</span>
          </div>
          <div className="p-2 rounded bg-surface-alt border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">State Observer Method</span>
            <span className="font-bold text-slate-800 text-xs">Physics + ML Hybrid</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 font-sans">
          {twinState.modelAgreement.notes}
        </p>
      </div>

      {/* Grid of Engineering Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Thermal Model */}
        <div className="bg-surface rounded-md border border-app-border p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-oil-red" />
              <h2 className="text-xs font-bold font-mono text-text-primary uppercase">
                1. Subsurface Thermal Convective-Decay Model
              </h2>
            </div>
            <StatusPill variant="ESTIMATED" size="sm" />
          </div>

          <ThermalDecayPlot currentDay={simulationDay} />

          <div className="p-3 bg-surface-alt rounded border border-slate-200 text-xs font-mono space-y-1">
            <span className="font-bold text-text-primary block">Governing Equation:</span>
            <code className="text-slate-800 block text-[11px]">
              T_BHT(t) = T_res + (T_peak - T_res) * exp(-0.046 * (t - 10))
            </code>
            <div className="flex justify-between text-[11px] text-text-secondary pt-1 font-sans">
              <span>Steam Zone Radius: {twinState.reservoirThermalRadiusMeters} m</span>
              <span>Reservoir Depth: {twinState.depthMeters} m</span>
            </div>
          </div>
        </div>

        {/* 2. Rheology Model */}
        <div className="bg-surface rounded-md border border-app-border p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold font-mono text-text-primary uppercase">
                2. Andrade Heavy Oil Viscosity-Temperature Model
              </h2>
            </div>
            <StatusPill variant="ESTIMATED" size="sm" />
          </div>

          <ViscosityRheologyPlot currentTempC={twinState.bottomholeTemperatureC} />

          <div className="p-3 bg-surface-alt rounded border border-slate-200 text-xs font-mono space-y-1">
            <span className="font-bold text-text-primary block">Rheology Equation:</span>
            <code className="text-slate-800 block text-[11px]">
              μ(T) = A * exp(B / (T_BHT + 85.0)) [cP]
            </code>
            <p className="text-text-secondary text-[11px] font-sans pt-1">
              Shows exponential viscosity surge from 48 cP at 190°C to 18,500 cP at initial reservoir temp (35°C).
            </p>
          </div>
        </div>
      </div>

      {/* Model Health Deck */}
      <div className="bg-surface rounded-md border border-app-border p-4 space-y-3">
        <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
          Subsystem Model Health & Statistical Confidence Deck
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 rounded bg-surface-alt border border-slate-200 space-y-1">
            <span className="text-[10px] text-text-secondary uppercase block">Thermal Model</span>
            <div className="text-xl font-bold text-emerald-700">{twinState.confidence.thermalModel}%</div>
            <span className="text-[10px] text-slate-500 block">Thermal Observer v0.4</span>
          </div>

          <div className="p-3 rounded bg-surface-alt border border-slate-200 space-y-1">
            <span className="text-[10px] text-text-secondary uppercase block">Wellbore & Drag Model</span>
            <div className="text-xl font-bold text-emerald-700">{twinState.confidence.wellboreModel}%</div>
            <span className="text-[10px] text-slate-500 block">Gibbs 1D Wave Solver</span>
          </div>

          <div className="p-3 rounded bg-surface-alt border border-slate-200 space-y-1">
            <span className="text-[10px] text-text-secondary uppercase block">Rheology Estimator</span>
            <div className="text-xl font-bold text-emerald-700">{twinState.confidence.rheologyModel}%</div>
            <span className="text-[10px] text-slate-500 block">Andrade Non-Newtonian</span>
          </div>

          <div className="p-3 rounded bg-surface-alt border border-slate-200 space-y-1">
            <span className="text-[10px] text-text-secondary uppercase block">Overall Twin State</span>
            <div className="text-xl font-bold text-emerald-700">{twinState.confidence.overall}%</div>
            <span className="text-[10px] text-slate-500 block">Duplex SCADA Ingestion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
