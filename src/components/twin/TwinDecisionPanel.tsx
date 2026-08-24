"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileCheck2,
  Gauge,
  IndianRupee,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { StatusPill } from "../ui/StatusPill";

export const TwinDecisionPanel: React.FC = () => {
  const {
    twinState,
    controlMode,
    isActionApproved,
    approveRecommendation,
  } = useTwinStore();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-2">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
            Twin Decision Engine
          </h2>
          <p className="text-xs text-text-secondary font-mono">
            Prognostics & Autonomous Advisory
          </p>
        </div>
        <StatusPill variant={controlMode} size="sm" />
      </div>

      {/* Current State & Predicted Event Box */}
      <div className="bg-surface rounded-md border border-app-border p-3.5 space-y-3">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
            Current Operating State:
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-black font-mono text-text-primary">
              {twinState.phase === "COOLING" ? "Cooling Production Phase" : `${twinState.phase} Phase`}
            </span>
            <StatusPill variant={twinState.phase} size="sm" />
          </div>
        </div>

        <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200">
          <div className="flex items-center gap-1.5 text-amber-900 font-mono text-xs font-bold">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-700" />
            <span>PREDICTED EVENT:</span>
          </div>
          <p className="text-xs text-amber-950 font-mono mt-1">
            Rod-floating risk increasing (+8.4%/day) due to thermal decline in 1,040m column.
          </p>
        </div>
      </div>

      {/* Recommended Action Card */}
      <div className="bg-surface rounded-md border-2 border-oil-red/60 p-4 space-y-3 shadow-panel">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-oil-red uppercase tracking-wider font-mono flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            Recommended Action
          </span>
          <span className="text-[10px] font-mono font-bold bg-red-50 text-oil-red px-2 py-0.5 rounded border border-red-200">
            VFD Δ: {twinState.recommendedAction.vfdDeltaPercent}%
          </span>
        </div>

        <h3 className="text-base font-bold font-mono text-text-primary">
          {twinState.recommendedAction.title}
        </h3>

        <p className="text-xs text-slate-700 font-mono leading-relaxed">
          {twinState.recommendedAction.description}
        </p>

        {/* Expected Subsystem Impact Matrix */}
        <div className="pt-2 border-t border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block mb-1.5">
            Expected Subsystem Impact:
          </span>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-surface-alt border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Energy</span>
              <span className="text-xs font-bold text-emerald-700">
                {twinState.recommendedAction.expectedEnergyDelta}%
              </span>
            </div>

            <div className="p-2 rounded bg-surface-alt border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Net Margin</span>
              <span className="text-xs font-bold text-emerald-700">
                +₹38k/d
              </span>
            </div>

            <div className="p-2 rounded bg-surface-alt border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Rod Risk</span>
              <span className="text-xs font-bold text-emerald-700">
                {twinState.recommendedAction.expectedRiskDelta}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link
              href="/simulator"
              className="flex-1 py-2 px-3 rounded bg-surface-alt hover:bg-slate-200 border border-slate-300 text-text-primary text-xs font-mono font-bold transition-colors text-center flex items-center justify-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>SIMULATE</span>
            </Link>

            <Link
              href="/optimizer"
              className="flex-1 py-2 px-3 rounded bg-surface-alt hover:bg-slate-200 border border-slate-300 text-text-primary text-xs font-mono font-bold transition-colors text-center flex items-center justify-center gap-1"
            >
              <Gauge className="w-3.5 h-3.5 text-slate-600" />
              <span>OPTIMIZER</span>
            </Link>
          </div>

          {!isActionApproved ? (
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full py-2.5 px-4 rounded bg-oil-red hover:bg-oil-redDark text-white text-xs font-mono font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>APPROVE ADVISORY CONTROL</span>
            </button>
          ) : (
            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ADVISORY APPROVED & APPLIED TO VFD</span>
            </div>
          )}
        </div>
      </div>

      {/* Safety Interlock Summary */}
      <div className="p-3 bg-surface-alt rounded-md border border-app-border text-xs font-mono text-text-secondary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          <span>Safety Interlocks:</span>
        </div>
        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          ALL 7 ARMED
        </span>
      </div>

      {/* Supervisory Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-lg border border-app-border shadow-2xl p-5 space-y-4 font-mono">
            <div className="flex items-center gap-2 text-oil-red font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>SUPERVISORY SAFETY CONFIRMATION</span>
            </div>

            <p className="text-xs text-text-primary leading-relaxed">
              You are applying an advisory VFD setpoint modulation (-17% Downstroke Velocity) to well{" "}
              <strong>{twinState.wellName}</strong>.
            </p>

            <div className="p-3 bg-surface-alt border border-slate-200 rounded text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Target SPM:</span>
                <span className="font-bold text-text-primary">4.8 SPM (Asymmetric)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Predicted Risk Reduction:</span>
                <span className="font-bold text-emerald-700">-29.4%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Interlock Verification:</span>
                <span className="font-bold text-emerald-700">PASSED</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  approveRecommendation();
                  setIsConfirmModalOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-oil-red hover:bg-oil-redDark text-white text-xs font-bold"
              >
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
