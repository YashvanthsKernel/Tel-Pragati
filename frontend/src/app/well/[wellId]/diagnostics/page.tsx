"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Waves,
  Cpu,
} from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import { generateDynamometerCard } from "../../../../data/demo/physicsSim";
import { DynamometerChart } from "../../../../components/charts/DynamometerChart";
import { EstimatedBadge } from "../../../../components/common/EstimatedBadge";
import { PageHeader } from "../../../../components/ui/PageHeader";

export default function DiagnosticsPage() {
  const { wellId, wellState, isLoading } = useWellContext();
  const [activeFailureMode, setActiveFailureMode] = useState<string>("rod_floating");

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Loading Dynagraph Transducer Wave Data for {wellId}...
        </span>
      </div>
    );
  }

  // Reconstruct card based on active condition simulation
  const dragLb = activeFailureMode === "rod_floating" ? 8200 : 4200;
  const floatingRiskPct = activeFailureMode === "rod_floating" ? 72 : 18;
  const fillagePct = activeFailureMode === "fluid_pound" ? 64 : 88;

  const dynagraph = generateDynamometerCard(
    wellId,
    144,
    wellState.observed.spm,
    dragLb,
    floatingRiskPct,
    fillagePct
  );

  const failureScenarios = [
    {
      id: "normal",
      label: "Nominal Full Card",
      badge: "Normal",
      desc: "Full pump fillage (92%), smooth valve transitions, nominal rod string tension.",
      severity: "safe",
    },
    {
      id: "rod_floating",
      label: "Severe Rod Floating & Sag",
      badge: "Viscous Fault",
      desc: "Viscous crude (5,800+ cP) retards downward plunger travel; compression slack induces buckling risk.",
      severity: "warn",
    },
    {
      id: "fluid_pound",
      label: "Incomplete Pump Fillage",
      badge: "Fluid Pound",
      desc: "Low reservoir inflow leads to gas space in pump barrel, causing severe impact shock on downstroke.",
      severity: "critical",
    },
    {
      id: "gas_interference",
      label: "Gas Interference",
      badge: "Gas Cushion",
      desc: "Associated solution gas compression rounds card corners and reduces volumetric pumping efficiency.",
      severity: "warn",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        wellId={wellId}
        icon={<Stethoscope className="w-5 h-5 text-accent-mechanical" />}
        title="Sucker Rod Lift Diagnostics & Dynamometer Analysis"
        subtitle="Gibbs 1D Wave Equation Inversion · Automated Dynagraph Pattern Classifier"
        actions={
          <EstimatedBadge
            label="AI Classifier"
            data={{
              value: 94,
              confidence: 0.94,
              labelSource: "ground_truth",
              description: "Pattern classification trained on verified Baghewala dynagraph library with synthetic wave validation.",
            }}
          />
        }
      />

      {/* ── Diagnostic Presets Selector ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
            Guided Condition Replay & Diagnostic Presets
          </span>
          <span className="text-xs font-sans text-text-muted">
            Select a diagnostic condition to simulate waveform response
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {failureScenarios.map((scn) => {
            const isSelected = activeFailureMode === scn.id;
            return (
              <button
                key={scn.id}
                type="button"
                onClick={() => setActiveFailureMode(scn.id)}
                className={`p-3 rounded-lg text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? "bg-accent-mechanical/10 border-accent-mechanical"
                    : "bg-surface-1 border-line hover:border-line-strong"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans font-semibold text-xs text-text-primary">{scn.label}</span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        scn.severity === "critical"
                          ? "bg-status-critical/15 text-status-critical"
                          : scn.severity === "warn"
                          ? "bg-status-warn/15 text-status-warn"
                          : "bg-status-safe/15 text-status-safe"
                      }`}
                    >
                      {scn.badge}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-text-secondary leading-relaxed line-clamp-2">
                    {scn.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Master Dynamometer Card Overlay ── */}
      <DynamometerChart card={dynagraph} height={300} />

      {/* ── Downhole Wave Analysis & Classifier Guidance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dossier */}
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-3">
          <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
            Downhole Pump Wave Reconstruction Analysis
          </span>
          <div className="p-3 rounded bg-surface-0 border border-line text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Surface Card Source:</span>
              <span className="font-bold text-accent-mechanical">Hall-Effect Load Cell (1 Hz)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Reconstruction Method:</span>
              <span className="font-bold text-accent-thermal">Everitt-Jennings 1D Wave Solver</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Damping Factor (α):</span>
              <span className="text-text-primary">0.082 sec⁻¹ (Viscous Fluid Damping)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Peak Surface Load (PPRL):</span>
              <span className="font-bold text-text-primary tabular-nums">{dynagraph.peakSurfaceLoadLb.toLocaleString()} lb</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Min Surface Load (MPRL):</span>
              <span className={`font-bold tabular-nums ${activeFailureMode === "rod_floating" ? "text-status-warn" : "text-text-primary"}`}>
                {dynagraph.minSurfaceLoadLb.toLocaleString()} lb
              </span>
            </div>
          </div>
        </div>

        {/* Remediation */}
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-3 flex flex-col justify-between">
          <div>
            <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Automated Classifier & Engineering Interpretation
            </span>
            <p className="text-xs font-sans text-text-secondary leading-relaxed mt-1.5">
              {activeFailureMode === "rod_floating"
                ? "The classifier detects severe downstroke compression sag. Downstroke velocity exceeds viscous settlement rate in 5,820 cP crude."
                : activeFailureMode === "fluid_pound"
                ? "Severe hydraulic impact detected at 64% stroke position due to incomplete barrel liquid fillage."
                : "Dynagraph profile indicates healthy valve seating and full volumetric displacement."}
            </p>
          </div>

          <div className="p-3 rounded bg-surface-0 border border-line text-xs font-sans">
            <div className="text-[10px] font-sans text-text-muted uppercase font-bold mb-1">Recommended Engineering Remediation</div>
            <div className="font-semibold text-accent-thermal leading-relaxed">
              {activeFailureMode === "rod_floating"
                ? "Apply VFD Asymmetric Downstroke Deceleration (-17%) to restore rod string downstroke tension."
                : activeFailureMode === "fluid_pound"
                ? "Reduce SPM from 5.2 to 4.0 to match formation fluid inflow rate and prevent valve shock."
                : "Maintain current VFD operating frequency and telemetry monitoring loop."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
