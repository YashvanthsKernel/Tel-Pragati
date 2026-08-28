"use client";

import React, { useState } from "react";
import { OptimizerStrategy } from "../../data/types";

interface ParetoScatterChartProps {
  strategies: OptimizerStrategy[];
  height?: number;
}

export function ParetoScatterChart({ strategies, height = 270 }: ParetoScatterChartProps) {
  const [hoveredStrategy, setHoveredStrategy] = useState<OptimizerStrategy | null>(null);

  if (!strategies || strategies.length === 0) return null;

  const width = 560;
  const padding = { top: 25, right: 40, bottom: 40, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Cost X Range (e.g. 50k to 140k INR/day)
  const minCost = 50000;
  const maxCost = 140000;
  const costRange = maxCost - minCost;

  // Production Y Range (e.g. 300 to 900 BOPD)
  const minProd = 300;
  const maxProd = 900;
  const prodRange = maxProd - minProd;

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none space-y-2">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
          Pareto Multi-Objective Optimization Frontier
        </span>
        <span className="text-[11px] font-sans text-text-muted">
          Bubble Radius = Mechanical Risk %
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Y-axis grid & labels */}
          {[300, 450, 600, 750, 900].map((prod) => {
            const y = padding.top + chartHeight - ((prod - minProd) / prodRange) * chartHeight;
            return (
              <g key={prod}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontFamily="var(--font-ibm-plex-mono)"
                  textAnchor="end"
                >
                  {prod} BOPD
                </text>
              </g>
            );
          })}

          {/* X-axis grid & labels */}
          {[60000, 80000, 100000, 120000, 140000].map((cost) => {
            const x = padding.left + ((cost - minCost) / costRange) * chartWidth;
            return (
              <g key={cost}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartHeight}
                  stroke="var(--line)"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + chartHeight + 15}
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontFamily="var(--font-ibm-plex-mono)"
                  textAnchor="middle"
                >
                  ₹{(cost / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Pareto Frontier Curve */}
          {strategies.length > 1 && (
            <polyline
              points={strategies
                .map((s) => {
                  const x = padding.left + ((s.costInrDay - minCost) / costRange) * chartWidth;
                  const y = padding.top + chartHeight - ((s.productionBopd - minProd) / prodRange) * chartHeight;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke="var(--accent-mechanical)"
              strokeDasharray="4 3"
              strokeWidth="2"
            />
          )}

          {/* Strategy candidate bubbles */}
          {strategies.map((s) => {
            const x = padding.left + ((s.costInrDay - minCost) / costRange) * chartWidth;
            const y = padding.top + chartHeight - ((s.productionBopd - minProd) / prodRange) * chartHeight;
            const radius = Math.max(8, Math.min(22, s.rodRiskPct * 0.3 + 6));
            const isRec = s.recommended;

            return (
              <g key={s.name}>
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={isRec ? "var(--status-safe)" : "var(--accent-mechanical)"}
                  fillOpacity="0.3"
                  stroke={isRec ? "var(--status-safe)" : "var(--accent-mechanical)"}
                  strokeWidth={isRec ? "2.5" : "1.5"}
                  onMouseEnter={() => setHoveredStrategy(s)}
                  onMouseLeave={() => setHoveredStrategy(null)}
                  className="cursor-pointer transition-transform hover:scale-110"
                />
                <text
                  x={x}
                  y={y - radius - 4}
                  fill={isRec ? "var(--status-safe)" : "var(--text-primary)"}
                  fontSize="10"
                  fontFamily="var(--font-ibm-plex-mono)"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {s.name}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 5}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-ibm-plex-mono)"
            textAnchor="middle"
          >
            Daily Operating Cost (₹ INR/day)
          </text>
          <text
            x={15}
            y={height / 2}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-ibm-plex-mono)"
            textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Net Production (BOPD)
          </text>
        </svg>
      </div>

      {hoveredStrategy && (
        <div className="mt-1 p-2 rounded bg-surface-0 border border-line text-xs font-mono flex items-center justify-between">
          <span className="font-bold text-accent-mechanical">{hoveredStrategy.name}: {hoveredStrategy.label}</span>
          <span className="text-text-muted">
            ₹{hoveredStrategy.costInrDay.toLocaleString()}/d · {hoveredStrategy.productionBopd} BOPD · Risk {hoveredStrategy.rodRiskPct}%
          </span>
        </div>
      )}
    </div>
  );
}
