"use client";

import React, { useState } from "react";
import { CheckCircle2, Cpu, FileCheck2, ShieldAlert } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { StatusPill } from "../../components/ui/StatusPill";
import { ControlMode } from "../../types/twin";

export default function ControlPage() {
  const {
    twinState,
    controlMode,
    setControlMode,
    isActionApproved,
    approveRecommendation,
  } = useTwinStore();

  const [isSimulated, setIsSimulated] = useState(false);

  const safetyInterlocks = [
    { name: "Maximum SPM Safety Limit", current: `${twinState.spm} SPM`, limit: "8.0 SPM", status: "SAFE" },
    { name: "Motor Current Peak Threshold", current: `${twinState.motorCurrentAmps} A`, limit: "55.0 A", status: "SAFE" },
    { name: "Peak Polished Rod Load (PPRL)", current: `${twinState.polishedRodLoadLb.toLocaleString()} lb`, limit: "24,000 lb", status: "SAFE" },
    { name: "Minimum Downstroke Tension", current: "3,420 lb", limit: "2,000 lb", status: twinState.rodFloatingRiskPercent > 60 ? "APPROACHING" : "SAFE" },
    { name: "Critical Wellhead Pressure", current: `${twinState.wellheadPressurePsi} psi`, limit: "500 psi", status: "SAFE" },
    { name: "Model Confidence Threshold", current: `${twinState.confidence.overall}%`, limit: "75%", status: "SAFE" },
    { name: "SCADA Duplex Telemetry Link", current: "ONLINE (97%)", limit: "80%", status: "SAFE" },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-oil-charcoal text-white flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">
              Supervisory Control Workstation
            </h1>
            <p className="text-xs text-text-secondary font-mono">
              Conservative Industrial Advisory & Supervisory Dispatch Envelope
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 border border-slate-300 rounded p-0.5 bg-surface-alt text-xs font-mono">
          {(["ADVISORY", "SUPERVISED", "AUTOMATED"] as ControlMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setControlMode(mode)}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                controlMode === mode
                  ? "bg-oil-charcoal text-white shadow-sm"
                  : "text-slate-600 hover:text-text-primary"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Proposed VFD Profile & Approval (6 cols) */}
        <div className="lg:col-span-6 bg-surface rounded-md border border-app-border p-4 space-y-4 font-mono">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider block border-b border-slate-100 pb-2">
            VFD Velocity Profile Modulation (Advisory)
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-surface-alt border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Current Pumping Speed</span>
              <div className="text-lg font-bold text-text-primary">{twinState.spm} SPM</div>
              <span className="text-[10px] text-slate-500">Standard Sinusoidal</span>
            </div>

            <div className="p-3 rounded bg-red-50/50 border border-red-200">
              <span className="text-[10px] text-oil-red uppercase block font-bold">Proposed Modulation</span>
              <div className="text-lg font-bold text-oil-red">4.8 SPM (-17% Downstroke)</div>
              <span className="text-[10px] text-slate-600">Asymmetric Deceleration</span>
            </div>
          </div>

          <div className="p-3 bg-surface-alt rounded border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-text-primary">Remediation Rationale:</span>
            <p className="text-slate-700 font-sans">
              Decelerating the polished rod during downstroke matches rod string terminal settling velocity in {twinState.oilViscosityCentipoise.toLocaleString()} cP crude, suppressing compression buckling.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setIsSimulated(true)}
              className="flex-1 py-2 px-3 rounded bg-surface-alt hover:bg-slate-200 border border-slate-300 text-text-primary text-xs font-bold font-mono transition-colors text-center"
            >
              {isSimulated ? "SIMULATION VERIFIED" : "SIMULATE CHANGE"}
            </button>

            {!isActionApproved ? (
              <button
                onClick={approveRecommendation}
                className="flex-1 py-2 px-3 rounded bg-oil-red hover:bg-oil-redDark text-white text-xs font-bold font-mono transition-colors text-center"
              >
                APPROVE DISPATCH
              </button>
            ) : (
              <div className="flex-1 py-2 px-3 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold font-mono text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>DISPATCHED TO SCADA</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Safety Interlocks Matrix (6 cols) */}
        <div className="lg:col-span-6 bg-surface rounded-md border border-app-border p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Safety Interlocks Matrix (Hard Limits)
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ALL 7 ARMED
            </span>
          </div>

          <div className="border border-app-border rounded-md divide-y divide-app-border text-xs">
            {safetyInterlocks.map((item) => (
              <div key={item.name} className="p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-text-primary block">{item.name}</span>
                  <span className="text-[10px] text-slate-500">Limit: {item.limit}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-text-primary">{item.current}</span>
                  <StatusPill variant={item.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
