"use client";

import React from "react";
import { Activity, AlertOctagon, CheckCircle2, ChevronRight } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { DynagraphPlot } from "../../components/charts/DynagraphPlot";
import { FailureReplayGuide } from "../../components/diagnostics/FailureReplayGuide";
import { StatusPill } from "../../components/ui/StatusPill";
import { ConfidenceBadge } from "../../components/ui/ConfidenceBadge";

export default function DiagnosticsPage() {
  const { twinState } = useTwinStore();

  const classifierData = [
    { condition: "Rod Floating (Inferred)", probability: twinState.rodFloatingRiskPercent, severity: "WARNING", dominant: twinState.rodFloatingRiskPercent >= 50 },
    { condition: "Normal Production Envelope", probability: Math.max(0, 100 - twinState.rodFloatingRiskPercent - 18), severity: "NOMINAL", dominant: twinState.rodFloatingRiskPercent < 40 },
    { condition: "Fluid Pound Condition", probability: twinState.pumpFillagePercent < 80 ? 22 : 8, severity: "WARNING", dominant: false },
    { condition: "Gas Interference", probability: 3, severity: "NOMINAL", dominant: false },
    { condition: "Traveling Valve Leak", probability: 2, severity: "NOMINAL", dominant: false },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-oil-charcoal text-white flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">
              SRP Dynagraph Diagnostics & Downhole Reconstruction
            </h1>
            <p className="text-xs text-text-secondary font-mono">
              Coupled Surface Load Cell & Gibbs 1D Damped Wave Equation Solver
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill variant="ESTIMATED" size="sm" />
          <ConfidenceBadge value={twinState.confidence.wellboreModel} size="sm" />
        </div>
      </div>

      {/* Flagship Guided Failure Replay Sequence */}
      <FailureReplayGuide />

      {/* Dynagraph Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Dynagraph Plot (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-md border border-app-border p-4 space-y-3">
          <DynagraphPlot
            surfaceCard={twinState.dynagraph.surfaceCard}
            downholeCard={twinState.dynagraph.downholeCard}
            peakLoad={twinState.dynagraph.peakSurfaceLoadLb}
            minLoad={twinState.dynagraph.minSurfaceLoadLb}
            strokeLength={twinState.strokeLengthInches}
          />

          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
            <div className="p-2 rounded bg-surface-alt border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Peak Surface Load</span>
              <span className="font-bold text-text-primary">{twinState.dynagraph.peakSurfaceLoadLb.toLocaleString()} lb</span>
            </div>
            <div className="p-2 rounded bg-surface-alt border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Min Surface Load</span>
              <span className="font-bold text-text-primary">{twinState.dynagraph.minSurfaceLoadLb.toLocaleString()} lb</span>
            </div>
            <div className="p-2 rounded bg-surface-alt border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Downhole Fillage</span>
              <span className="font-bold text-text-primary">{twinState.pumpFillagePercent}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Classifier & Explainability Dossier (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Classifier Card */}
          <div className="bg-surface rounded-md border border-app-border p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-text-primary uppercase">
                Diagnostic Condition Classifier
              </span>
              <ConfidenceBadge value={twinState.confidence.wellboreModel} size="sm" />
            </div>

            <div className="space-y-2">
              {classifierData.map((item) => (
                <div
                  key={item.condition}
                  className={`p-2 rounded border text-xs flex items-center justify-between ${
                    item.dominant
                      ? "bg-red-50/50 border-oil-red font-bold"
                      : "bg-surface-alt border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                    <span>{item.condition}</span>
                  </div>
                  <span className={item.dominant ? "text-oil-red font-black" : "text-slate-600"}>
                    {item.probability}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Explainability Evidence Dossier */}
          <div className="bg-surface rounded-md border border-app-border p-4 space-y-2 font-mono">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Physical Evidence & Causal Manifestation:
            </span>

            <ul className="text-xs space-y-1.5 text-slate-700 list-disc pl-4 font-sans">
              <li>
                <strong>Delayed downstroke velocity:</strong> Sucker rod column descends slower than carrier bar due to {twinState.rodFluidDragPounds.toLocaleString()} lb viscous drag.
              </li>
              <li>
                <strong>Compressive slack tendency:</strong> Minimum surface load drops below safe tension threshold (8,200 lb).
              </li>
              <li>
                <strong>Deformed card boundary:</strong> Compression sag detected on Gibbs 1D wave downhole reconstruction.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
