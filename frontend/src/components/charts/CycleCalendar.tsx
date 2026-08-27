"use client";

import React from "react";

interface CycleCalendarProps {
  wellId?: string;
  year?: number;
}

export function CycleCalendar({ wellId = "BGW-08", year = 2026 }: CycleCalendarProps) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Deterministic simulation of CSS cycles (Cycles 1, 2, 3, 4)
  const getDayStatus = (monthIdx: number, dayIdx: number) => {
    const totalDayOfYear = daysPerMonth.slice(0, monthIdx).reduce((a, b) => a + b, 0) + dayIdx;
    const cyclePos = totalDayOfYear % 75; // 75-day full turnaround

    if (cyclePos < 5) return { type: "inject", color: "bg-accent-thermal", label: "Steam Injection" };
    if (cyclePos < 10) return { type: "soak", color: "bg-status-warn", label: "Thermal Soak" };
    if (cyclePos < 38) return { type: "produce", color: "bg-status-safe", label: "Production" };
    if (cyclePos < 45) return { type: "cooling", color: "bg-accent-mechanical", label: "Cooling & VFD Damping" };
    return { type: "idle", color: "bg-surface-0", label: "Turnaround / Maintenance" };
  };

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
          Annual CSS Cycle & Operational Calendar ({year})
        </span>
        <span className="text-xs font-mono text-accent-mechanical">{wellId} History</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px] space-y-1">
          {months.map((m, mIdx) => {
            const count = daysPerMonth[mIdx];
            return (
              <div key={m} className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="w-8 text-text-muted">{m}</span>
                <div className="flex-1 grid grid-cols-31 gap-0.5">
                  {Array.from({ length: 31 }, (_, dIdx) => {
                    if (dIdx >= count) {
                      return <div key={dIdx} className="h-3 w-full opacity-0" />;
                    }
                    const status = getDayStatus(mIdx, dIdx + 1);
                    return (
                      <div
                        key={dIdx}
                        title={`${m} ${dIdx + 1}: ${status.label}`}
                        className={`h-3 w-full rounded-[1px] border border-line/40 ${status.color} hover:scale-125 transition-transform cursor-pointer`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-line text-[11px] font-mono">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent-thermal" />
          <span className="text-text-muted">Steam Injection (5d)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-status-warn" />
          <span className="text-text-muted">Thermal Soak (5d)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-status-safe" />
          <span className="text-text-muted">Production (28d)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent-mechanical" />
          <span className="text-text-muted">Cooling & Damping (7d)</span>
        </div>
      </div>
    </div>
  );
}
