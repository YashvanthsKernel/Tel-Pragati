"use client";

import React from "react";
import { WellSummary } from "../../data/types";

interface RadarChartProps {
  wells: WellSummary[];
  height?: number;
}

export function RadarChart({ wells, height = 280 }: RadarChartProps) {
  const dimensions = [
    { label: "Production", getValue: (w: WellSummary) => Math.min(100, (w.flowBopd / 850) * 100) },
    { label: "Health Index", getValue: (w: WellSummary) => w.healthPct },
    { label: "Rod Safety", getValue: (w: WellSummary) => Math.max(0, 100 - (w.rodFloatingRiskPct || 15)) },
    { label: "Thermal State", getValue: (w: WellSummary) => Math.min(100, ((w.bhtCelsius || 80) / 180) * 100) },
    { label: "Energy Margin", getValue: (w: WellSummary) => (w.status === "producing" ? 85 : 40) },
  ];

  const colors = ["#C65B32", "#197F8C", "#238B57"];
  const width = 340;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 35;
  const angleStep = (2 * Math.PI) / dimensions.length;

  const getCoordinates = (index: number, score: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (score / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
          Multi-KPI Well Comparison Radar
        </span>
        <div className="flex items-center gap-3 text-xs font-mono">
          {wells.map((w, idx) => (
            <div key={w.wellId} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="text-text-primary font-bold">{w.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center relative overflow-hidden">
        <svg width={width} height={height} className="overflow-visible">
          {/* Concentric rings (25%, 50%, 75%, 100%) */}
          {[0.25, 0.5, 0.75, 1].map((level) => {
            const r = level * radius;
            const points = dimensions.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            });
            return (
              <polygon
                key={level}
                points={points.join(" ")}
                fill="none"
                stroke="var(--line)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            );
          })}

          {/* Radial axis lines and dimension labels */}
          {dimensions.map((dim, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            const labelX = cx + (radius + 18) * Math.cos(angle);
            const labelY = cy + (radius + 18) * Math.sin(angle);

            return (
              <g key={dim.label}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY + 4}
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontFamily="var(--font-ibm-plex-mono)"
                  textAnchor="middle"
                >
                  {dim.label}
                </text>
              </g>
            );
          })}

          {/* Well Polygons */}
          {wells.map((well, wIdx) => {
            const color = colors[wIdx % colors.length];
            const coords = dimensions.map((dim, i) => getCoordinates(i, dim.getValue(well)));
            const polyPoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

            return (
              <g key={well.wellId}>
                <polygon
                  points={polyPoints}
                  fill={color}
                  fillOpacity="0.2"
                  stroke={color}
                  strokeWidth="2"
                />
                {coords.map((c, i) => (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r="3.5"
                    fill={color}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
