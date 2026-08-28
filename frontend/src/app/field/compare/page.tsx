"use client";

import React, { useEffect, useState } from "react";
import {
  GitCompare,
  Check,
  Plus,
  Trash2,
  Activity,
  Layers,
  Flame,
  Zap,
} from "lucide-react";
import { useDataProvider } from "../../../data/DataProviderContext";
import { WellSummary } from "../../../data/types";
import { RadarChart } from "../../../components/charts/RadarChart";
import { RadialGauge } from "../../../components/common/RadialGauge";
import { PageHeader } from "../../../components/ui/PageHeader";

export default function CompareWellsPage() {
  const provider = useDataProvider();
  const [allWells, setAllWells] = useState<WellSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(["BGW-01", "BGW-08", "BGW-04"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    provider.getFleetSummary().then((res) => {
      setAllWells(res.wells);
      setIsLoading(false);
    });
  }, [provider]);

  const toggleSelectWell = (wellId: string) => {
    if (selectedIds.includes(wellId)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((id) => id !== wellId));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, wellId]);
      }
    }
  };

  const selectedWells = allWells.filter((w) => selectedIds.includes(w.wellId));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        icon={<GitCompare className="w-5 h-5 text-accent-mechanical" />}
        title="Multi-Well Digital Twin Comparative Analysis"
        subtitle="Cross-Well Performance Radar · Relative Thermal, Mechanical, and Recovery Profiling"
        actions={
          <div className="flex flex-wrap items-center gap-1 bg-surface-1 p-1 rounded-lg border border-line text-xs font-sans max-w-2xl">
            <span className="text-text-muted px-2 font-sans">Selected ({selectedIds.length}/3):</span>
            {allWells.map((w) => {
              const isSelected = selectedIds.includes(w.wellId);
              return (
                <button
                  key={w.wellId}
                  type="button"
                  onClick={() => toggleSelectWell(w.wellId)}
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] transition-colors ${
                    isSelected
                      ? "bg-accent-mechanical text-surface-0 font-bold"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                  }`}
                >
                  {w.name}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Row 1: Radar Chart + Comparative Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RadarChart wells={selectedWells} height={320} />
        </div>

        {/* Side-by-side comparative metric cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {selectedWells.map((well) => (
            <div
              key={well.wellId}
              className="p-4 rounded-lg bg-surface-1 border border-line shadow-card flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                  <div>
                    <h3 className="font-sans text-base font-bold text-text-primary">{well.name}</h3>
                    <span className="text-[10px] font-mono text-text-muted">{well.padId}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                      well.status === "producing"
                        ? "bg-status-safe/10 text-status-safe border border-status-safe/30"
                        : well.status === "css_active"
                        ? "bg-accent-thermal/10 text-accent-thermal border border-accent-thermal/30"
                        : "bg-status-critical/10 text-status-critical border border-status-critical/30"
                    }`}
                  >
                    {well.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-text-muted font-sans">Gross Production:</span>
                    <span className="font-bold text-text-primary tabular-nums">{well.flowBopd} BOPD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted font-sans">Bottomhole Temp:</span>
                    <span className="font-bold text-accent-thermal tabular-nums">{well.bhtCelsius || 74.2}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted font-sans">Viscosity:</span>
                    <span className="font-bold text-accent-mechanical tabular-nums">{(well.viscosityCp || 5820).toLocaleString()} cP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted font-sans">Rod Floating Risk:</span>
                    <span className={`font-bold tabular-nums ${(well.rodFloatingRiskPct || 0) > 50 ? "text-status-warn" : "text-status-safe"}`}>
                      {well.rodFloatingRiskPct || 18}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted font-sans">CSS Cycle:</span>
                    <span className="text-text-primary">Cycle #{well.cssCycle || 4}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-2 border-t border-line">
                <RadialGauge
                  value={well.healthPct}
                  label="Twin Health Index"
                  size={76}
                  strokeWidth={6}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
