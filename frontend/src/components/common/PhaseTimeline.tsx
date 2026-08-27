"use client";

import React from "react";
import { WellPhase } from "../../data/types";

interface PhaseTimelineProps {
  currentDay: number; // 0 to 45
  totalDays?: number;
  onScrub?: (day: number) => void;
  className?: string;
}

export function PhaseTimeline({
  currentDay,
  totalDays = 45,
  onScrub,
  className = "",
}: PhaseTimelineProps) {
  const phases = [
    { label: "INJECTION", startDay: 0, endDay: 5, color: "#C65B32", desc: "Steam slug 3,200 bbl" },
    { label: "SOAK", startDay: 5, endDay: 10, color: "#E58A3A", desc: "Thermal soak 5 days" },
    { label: "PRODUCTION", startDay: 10, endDay: 28, color: "#238B57", desc: "Peak heavy recovery" },
    { label: "COOLING", startDay: 28, endDay: 42, color: "#197F8C", desc: "Viscosity rise window" },
    { label: "CUT-OFF", startDay: 42, endDay: 45, color: "#C43D35", desc: "Next cycle planning" },
  ];

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onScrub) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetDay = Math.round(ratio * totalDays * 10) / 10;
    onScrub(targetDay);
  };

  const currentPercent = (Math.max(0, Math.min(totalDays, currentDay)) / totalDays) * 100;

  return (
    <div className={`space-y-2 select-none ${className}`}>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-text-muted">CSS Cycle #04 Timeline</span>
        <span className="font-semibold text-text-primary">
          Day {currentDay.toFixed(1)} / {totalDays}
        </span>
      </div>

      {/* Interactive Bar */}
      <div
        onClick={handleBarClick}
        className={`relative h-6 bg-surface-0 rounded border border-line overflow-hidden flex ${
          onScrub ? "cursor-pointer" : ""
        }`}
        title="Click to scrub CSS timeline day"
      >
        {phases.map((p) => {
          const widthPct = ((p.endDay - p.startDay) / totalDays) * 100;
          return (
            <div
              key={p.label}
              style={{ width: `${widthPct}%`, backgroundColor: `${p.color}25`, borderColor: `${p.color}60` }}
              className="h-full border-r last:border-r-0 flex items-center justify-center relative overflow-hidden"
              title={`${p.label} (Days ${p.startDay} - ${p.endDay}): ${p.desc}`}
            >
              <span
                style={{ color: p.color }}
                className="text-[9px] font-mono font-bold tracking-tight uppercase truncate px-1"
              >
                {p.label}
              </span>
            </div>
          );
        })}

        {/* Current Day Scrubber Indicator */}
        <div
          style={{ left: `${currentPercent}%` }}
          className="absolute top-0 bottom-0 w-1 bg-white shadow-glowMechanical transform -translate-x-1/2 z-10 pointer-events-none"
        >
          <div className="w-2.5 h-2.5 bg-white rounded-full -ml-[3px] -mt-0.5 border border-surface-0" />
        </div>
      </div>

      {/* Axis Days Scale */}
      <div className="flex justify-between text-[10px] font-mono text-text-muted px-0.5">
        <span>Day 0</span>
        <span>Day 10</span>
        <span>Day 20</span>
        <span>Day 30</span>
        <span>Day 40</span>
        <span>Day 45</span>
      </div>
    </div>
  );
}
