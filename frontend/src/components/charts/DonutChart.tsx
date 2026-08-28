"use client";

import React from "react";
import { WellSummary } from "../../data/types";

interface DonutChartProps {
  wells: WellSummary[];
  size?: number;
}

export function DonutChart({ wells, size = 180 }: DonutChartProps) {
  const counts = {
    producing: wells.filter((w) => w.status === "producing").length,
    css_active: wells.filter((w) => w.status === "css_active").length,
    alarm: wells.filter((w) => w.status === "alarm").length,
    shut_in: wells.filter((w) => w.status === "shut_in").length,
  };

  const total = wells.length || 1;
  const segments = [
    { label: "Producing", count: counts.producing, color: "#238B57" },
    { label: "CSS Active", count: counts.css_active, color: "#C65B32" },
    { label: "In Alarm", count: counts.alarm, color: "#C43D35" },
    { label: "Shut In", count: counts.shut_in, color: "#74808B" },
  ];

  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2 border-b border-line pb-2">
        <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
          Fleet Operating Status
        </span>
        <span className="text-xs font-mono font-bold text-text-primary">{wells.length} Wells</span>
      </div>

      <div className="flex items-center justify-around gap-4 py-2">
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {segments.map((seg) => {
              const segPct = seg.count / total;
              const segLength = segPct * circumference;
              const offset = currentOffset;
              currentOffset += segLength;

              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segLength} ${circumference - segLength}`}
                  strokeDashoffset={-offset}
                  fill="transparent"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono font-bold text-xl text-text-primary leading-none">
              {counts.producing}
            </span>
            <span className="text-[10px] text-text-muted font-mono uppercase mt-0.5">Producing</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 text-xs font-mono">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-text-muted">{seg.label}</span>
              </div>
              <span className="font-bold text-text-primary">{seg.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
