"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WellSummary } from "../../data/types";

interface TreemapChartProps {
  wells: WellSummary[];
  height?: number;
}

export function TreemapChart({ wells, height = 240 }: TreemapChartProps) {
  const [hoveredWell, setHoveredWell] = useState<WellSummary | null>(null);

  const activeWells = wells.filter((w) => w.flowBopd > 0);
  const totalFlow = activeWells.reduce((acc, w) => acc + w.flowBopd, 0) || 1;

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
          Field Production Allocation (Treemap)
        </span>
        <span className="text-xs font-mono font-bold text-accent-mechanical">
          {totalFlow.toLocaleString()} BOPD Total
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1" style={{ minHeight: height - 60 }}>
        {activeWells.map((w) => {
          const sharePct = ((w.flowBopd / totalFlow) * 100).toFixed(1);
          const isAlarm = w.status === "alarm";
          const isCss = w.status === "css_active";

          return (
            <Link
              key={w.wellId}
              href={`/well/${w.wellId}/twin`}
              onMouseEnter={() => setHoveredWell(w)}
              onMouseLeave={() => setHoveredWell(null)}
              className={`p-2.5 rounded border transition-all flex flex-col justify-between ${
                isAlarm
                  ? "bg-status-critical/10 border-status-critical/40 hover:bg-status-critical/20"
                  : isCss
                  ? "bg-accent-thermal/10 border-accent-thermal/40 hover:bg-accent-thermal/20"
                  : "bg-surface-0 border-line hover:border-accent-mechanical hover:bg-surface-2"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-text-primary">{w.name}</span>
                <span className="text-[10px] font-mono text-text-muted">{sharePct}%</span>
              </div>

              <div className="mt-2">
                <div className="text-sm font-mono font-bold text-text-primary leading-none">
                  {w.flowBopd} <span className="text-[10px] text-text-muted font-normal">BOPD</span>
                </div>
                <div className="text-[10px] font-mono text-text-muted mt-0.5">{w.padId}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
