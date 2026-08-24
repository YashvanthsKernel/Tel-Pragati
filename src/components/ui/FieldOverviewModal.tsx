"use client";

import React from "react";
import { Grid, MapPin, X } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { BAGHEWALA_FIELD_WELLS } from "../../models/fieldData";
import { StatusPill } from "./StatusPill";

export const FieldOverviewModal: React.FC = () => {
  const {
    isFieldOverviewOpen,
    setFieldOverviewOpen,
    selectedWellId,
    setWellId,
  } = useTwinStore();

  if (!isFieldOverviewOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-surface rounded-lg border border-app-border shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-app-border bg-surface-alt flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-oil-charcoal text-white flex items-center justify-center font-bold">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                Baghewala Field Multi-Well Overview
              </h2>
              <p className="text-xs text-text-secondary font-mono">
                Jodhpur Sandstone CSS + SRP Operation Matrix (12 Active Wells with Parameter Provenance)
              </p>
            </div>
          </div>

          <button
            onClick={() => setFieldOverviewOpen(false)}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Well Grid */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {BAGHEWALA_FIELD_WELLS.map((well) => {
              const isSelected = well.wellId === selectedWellId;

              return (
                <div
                  key={well.wellId}
                  onClick={() => {
                    setWellId(well.wellId);
                    setFieldOverviewOpen(false);
                  }}
                  className={`p-3 rounded-md border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-red-50/40 border-oil-red ring-2 ring-oil-red/30 shadow-md"
                      : "bg-surface border-app-border hover:border-slate-400 hover:shadow-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-oil-red" />
                      <span className="font-bold font-mono text-sm text-text-primary">
                        {well.wellName}
                      </span>
                    </div>
                    <StatusPill variant={well.status} size="sm" />
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-text-secondary">
                      <span>Depth ({well.depthMeters.source}):</span>
                      <span className="text-text-primary font-semibold">{well.depthMeters.value} m</span>
                    </div>

                    <div className="flex justify-between text-text-secondary">
                      <span>Cycle / Day:</span>
                      <span className="text-text-primary font-semibold">
                        #{well.currentCycle} (Day {well.currentDay})
                      </span>
                    </div>

                    <div className="flex justify-between text-text-secondary">
                      <span>Phase:</span>
                      <span className="text-text-primary font-semibold">{well.phase}</span>
                    </div>

                    <div className="flex justify-between text-text-secondary">
                      <span>BHT ({well.bhtCelsius.source}):</span>
                      <span className="text-text-primary font-semibold">{well.bhtCelsius.value}°C</span>
                    </div>

                    <div className="flex justify-between text-text-secondary">
                      <span>Viscosity:</span>
                      <span className="text-text-primary font-semibold">
                        {well.viscosityCp.value.toLocaleString()} cP
                      </span>
                    </div>

                    <div className="flex justify-between text-text-secondary pt-1 border-t border-slate-100">
                      <span>Rod Risk:</span>
                      <span
                        className={`font-bold ${
                          well.rodFloatingRiskPercent > 60
                            ? "text-oil-red"
                            : well.rodFloatingRiskPercent > 40
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {well.rodFloatingRiskPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-app-border bg-surface-alt flex items-center justify-between text-xs font-mono text-text-secondary">
          <span>Click any well to immediately switch workstation context</span>
          <button
            onClick={() => setFieldOverviewOpen(false)}
            className="px-4 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-text-primary font-medium transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
