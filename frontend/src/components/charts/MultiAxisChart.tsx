"use client";

import React, { useState } from "react";

export interface MultiAxisDataPoint {
  day: number;
  tempC: number;
  viscosityCp: number;
}

interface MultiAxisChartProps {
  data: MultiAxisDataPoint[];
  height?: number;
  title?: string;
}

export function MultiAxisChart({
  data,
  height = 240,
  title = "Thermal Decay vs. In-Situ Heavy Oil Viscosity Coupling",
}: MultiAxisChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 640;
  const padding = { top: 25, right: 60, bottom: 35, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Temperature Left Axis (Linear, e.g., 30°C to 200°C)
  const minTemp = 30;
  const maxTemp = 200;
  const tempRange = maxTemp - minTemp;

  // Viscosity Right Axis (Log scale or high linear, e.g., 50 to 18,000 cP)
  const minVisc = 30;
  const maxVisc = 18000;

  const points = data.map((d, idx) => {
    const x = padding.left + (idx / (data.length - 1)) * chartWidth;
    const yTemp = padding.top + chartHeight - ((d.tempC - minTemp) / tempRange) * chartHeight;
    // Log scale for viscosity
    const logMin = Math.log10(minVisc);
    const logMax = Math.log10(maxVisc);
    const logVal = Math.log10(Math.max(minVisc, d.viscosityCp));
    const yVisc = padding.top + chartHeight - ((logVal - logMin) / (logMax - logMin)) * chartHeight;
    return { ...d, x, yTemp, yVisc };
  });

  const tempPath = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x.toFixed(1)},${curr.yTemp.toFixed(1)}`, "");
  const viscPath = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x.toFixed(1)},${curr.yVisc.toFixed(1)}`, "");

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[Math.floor(points.length / 2)];

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
          {title}
        </span>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-accent-thermal rounded" />
            <span className="text-accent-thermal">Temp (°C)</span>
            {activePoint && <span className="font-bold text-text-primary">[{activePoint.tempC}°C]</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-accent-mechanical rounded" />
            <span className="text-accent-mechanical">Viscosity (cP log)</span>
            {activePoint && <span className="font-bold text-text-primary">[{activePoint.viscosityCp.toLocaleString()} cP]</span>}
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + chartHeight * (1 - pct);
            const tempVal = Math.round(minTemp + pct * tempRange);
            const viscVal = Math.round(Math.pow(10, Math.log10(minVisc) + pct * (Math.log10(maxVisc) - Math.log10(minVisc))));

            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                {/* Left axis label (Temp) */}
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  fill="var(--accent-thermal)"
                  fontSize="9"
                  fontFamily="var(--font-ibm-plex-mono)"
                  textAnchor="end"
                >
                  {tempVal}°C
                </text>
                {/* Right axis label (Viscosity) */}
                <text
                  x={width - padding.right + 8}
                  y={y + 3}
                  fill="var(--accent-mechanical)"
                  fontSize="9"
                  fontFamily="var(--font-ibm-plex-mono)"
                  textAnchor="start"
                >
                  {viscVal > 1000 ? `${(viscVal / 1000).toFixed(0)}k` : viscVal}
                </text>
              </g>
            );
          })}

          {/* Temperature Path (Thermal accent) */}
          <path
            d={tempPath}
            fill="none"
            stroke="var(--accent-thermal)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Viscosity Path (Mechanical accent) */}
          <path
            d={viscPath}
            fill="none"
            stroke="var(--accent-mechanical)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="5 3"
          />

          {/* Interactive cursor and hit target */}
          {points.map((p, idx) => (
            <rect
              key={idx}
              x={p.x - 8}
              y={padding.top}
              width="16"
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(idx)}
              className="cursor-crosshair"
            />
          ))}

          {/* Active scrubber line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + chartHeight}
              stroke="white"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="pointer-events-none"
            />
          )}

          {/* X Axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="var(--line)"
            strokeWidth="1.5"
          />
          <text
            x={width / 2}
            y={height - 8}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-ibm-plex-mono)"
            textAnchor="middle"
          >
            CSS Production Cycle Day (0 - 45)
          </text>
        </svg>
      </div>
    </div>
  );
}
