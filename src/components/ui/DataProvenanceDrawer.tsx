"use client";

import React from "react";
import { Database, FileCode, ShieldCheck, X } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { StatusPill } from "./StatusPill";

export const DataProvenanceDrawer: React.FC = () => {
  const {
    selectedProvenance,
    isProvenanceDrawerOpen,
    closeProvenance,
  } = useTwinStore();

  if (!isProvenanceDrawerOpen || !selectedProvenance) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-[2px] transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-surface border-l border-app-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-app-border bg-surface-alt flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-wide uppercase font-mono">
                  Data Provenance & Lineage
                </h2>
                <p className="text-xs text-text-secondary font-mono">
                  Parameter ID: {selectedProvenance.parameterId}
                </p>
              </div>
            </div>

            <button
              onClick={closeProvenance}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Primary Value Card */}
            <div className="p-4 rounded-md border border-app-border bg-surface-alt space-y-1">
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                Parameter Display Label
              </span>
              <h3 className="text-lg font-bold text-text-primary font-mono">
                {selectedProvenance.label}
              </h3>
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-3xl font-black font-mono text-text-primary">
                  {selectedProvenance.valueString}
                </span>
                <span className="text-sm font-mono text-text-secondary font-medium">
                  {selectedProvenance.unit}
                </span>
              </div>
            </div>

            {/* Provenance Metadata Table */}
            <div className="border border-app-border rounded-md divide-y divide-app-border text-xs font-mono">
              <div className="p-3 flex items-center justify-between bg-surface">
                <span className="text-text-secondary">Lineage Classification:</span>
                <StatusPill variant={selectedProvenance.sourceType} size="sm" />
              </div>

              <div className="p-3 flex items-center justify-between bg-surface">
                <span className="text-text-secondary">Instrument / Algorithm:</span>
                <span className="font-semibold text-text-primary text-right">
                  {selectedProvenance.instrumentOrModel}
                </span>
              </div>

              {selectedProvenance.modelVersion && (
                <div className="p-3 flex items-center justify-between bg-surface">
                  <span className="text-text-secondary">Model Version:</span>
                  <span className="font-semibold text-text-primary">
                    {selectedProvenance.modelVersion}
                  </span>
                </div>
              )}

              <div className="p-3 flex items-center justify-between bg-surface">
                <span className="text-text-secondary">Statistical Confidence:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedProvenance.confidencePercent}%
                </span>
              </div>

              {selectedProvenance.uncertaintyMargin && (
                <div className="p-3 flex items-center justify-between bg-surface">
                  <span className="text-text-secondary">Uncertainty Margin:</span>
                  <span className="text-slate-700 font-semibold">
                    {selectedProvenance.uncertaintyMargin}
                  </span>
                </div>
              )}

              <div className="p-3 flex items-center justify-between bg-surface">
                <span className="text-text-secondary">Telemetry Timestamp:</span>
                <span className="text-slate-600">{selectedProvenance.lastSyncTimestamp}</span>
              </div>
            </div>

            {/* Physics Equation (if estimated/predicted) */}
            {selectedProvenance.physicalEquation && (
              <div className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Governing Engineering Formulation</span>
                </div>
                <div className="p-2.5 bg-surface border border-slate-200 rounded font-mono text-xs text-slate-900 overflow-x-auto">
                  <code>{selectedProvenance.physicalEquation}</code>
                </div>
              </div>
            )}

            {/* Engineering Description */}
            <div className="p-4 rounded-md border border-app-border bg-surface space-y-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                Engineering Operational Context
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedProvenance.engineeringDescription}
              </p>
            </div>

            {/* Audit & Compliance Note */}
            <div className="p-3 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>
                Verified according to Oil India Limited SCADA QA-2026 standards. Model estimates are explicitly delineated from physical wellhead transducer telemetry.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-app-border bg-surface-alt flex justify-end">
            <button
              onClick={closeProvenance}
              className="px-4 py-1.5 rounded bg-oil-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
