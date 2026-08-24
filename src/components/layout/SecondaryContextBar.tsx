"use client";

import React from "react";
import { Atom, Compass, Database, Grid, MapPin, ShieldCheck } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { StatusPill } from "../ui/StatusPill";

export const SecondaryContextBar: React.FC = () => {
  const {
    twinState,
    setPhysicsXRayOpen,
    setFieldOverviewOpen,
  } = useTwinStore();

  return (
    <div className="w-full bg-surface-alt border-b border-app-border px-4 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono select-none">
      {/* Context Parameters & Divergence / Agreement Badges */}
      <div className="flex items-center gap-3 flex-wrap text-[11px]">
        <div className="flex items-center gap-1 text-slate-600">
          <span className="text-slate-400 font-normal">FIELD:</span>
          <strong className="text-text-primary font-bold">{twinState.field}</strong>
        </div>

        <span className="text-slate-300 hidden sm:inline">•</span>

        <div className="flex items-center gap-1 text-slate-600">
          <span className="text-slate-400 font-normal">FORMATION:</span>
          <strong className="text-text-primary font-bold">{twinState.formation}</strong>
        </div>

        <span className="text-slate-300 hidden sm:inline">•</span>

        <div className="flex items-center gap-1 text-slate-600">
          <span className="text-slate-400 font-normal">WELL:</span>
          <strong className="text-text-primary font-bold">{twinState.wellName}</strong>
        </div>

        <span className="text-slate-300 hidden sm:inline">•</span>

        <div className="flex items-center gap-1 text-slate-600">
          <span className="text-slate-400 font-normal">DEPTH:</span>
          <strong className="text-text-primary font-bold">{twinState.depthMeters} m</strong>
        </div>

        <span className="text-slate-300 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-normal">PHASE:</span>
          <StatusPill variant={twinState.phase} size="sm" />
        </div>

        <span className="text-slate-300 hidden sm:inline">•</span>

        {/* Digital Twin Divergence Readout */}
        <div className="flex items-center gap-1 text-slate-600" title={`Measured vs Twin Prediction Divergence: ${twinState.divergence.summary}`}>
          <span className="text-slate-400 font-normal">DIVERGENCE:</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
            {twinState.divergence.productionDivergencePercent}% ({twinState.divergence.status})
          </span>
        </div>

        <span className="text-slate-300 hidden sm:inline">•</span>

        {/* Physics-ML Model Agreement Readout */}
        <div className="flex items-center gap-1 text-slate-600" title={`First-Principles Physics vs Deep Surrogate Observer Agreement: ${twinState.modelAgreement.agreementPercent}%`}>
          <span className="text-slate-400 font-normal">AGREEMENT:</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
            {twinState.modelAgreement.agreementPercent}% ({twinState.modelAgreement.status.replace("_", " ")})
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-1 sm:mt-0">
        <button
          onClick={() => setPhysicsXRayOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-oil-red hover:bg-oil-redDark text-white text-[11px] font-bold uppercase transition-colors shadow-sm"
        >
          <Atom className="w-3 h-3" />
          <span>SEE PHYSICS</span>
        </button>

        <button
          onClick={() => setFieldOverviewOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-slate-200 border border-slate-300 text-text-primary text-[11px] font-medium transition-colors"
        >
          <Grid className="w-3 h-3 text-slate-600" />
          <span>FIELD OVERVIEW</span>
        </button>
      </div>
    </div>
  );
};
