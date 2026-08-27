"use client";

import React, { useState } from "react";
import { DynamometerCard } from "../../data/types";
import { EstimatedBadge } from "../common/EstimatedBadge";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface DynamometerChartProps {
  card: DynamometerCard;
  height?: number;
  interactive?: boolean;
}

export function DynamometerChart({
  card,
  height = 280,
  interactive = true,
}: DynamometerChartProps) {
  const [hoveredTrace, setHoveredTrace] = useState<"surface" | "downhole" | null>(null);

  const width = 560;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Position X range (0 to ~144 in)
  const maxPosition = 144;

  // Load Y range (0 to ~25,000 lb)
  const minLoad = 0;
  const maxLoad = 25000;
  const loadRange = maxLoad - minLoad;

  const mapPoint = (p: { position: number; load: number }) => {
    const x = padding.left + (p.position / maxPosition) * chartWidth;
    const y = padding.top + chartHeight - ((p.load - minLoad) / loadRange) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const surfacePoints = card.surfaceTrace.map(mapPoint);
  const downholePoints = card.downholeTrace.map(mapPoint);

  const surfacePathD = surfacePoints.length > 0 ? `M ${surfacePoints.join(" L ")} Z` : "";
  const downholePathD = downholePoints.length > 0 ? `M ${downholePoints.join(" L ")} Z` : "";

  const isRodFloating = card.classification === "rod_floating";
  const isFluidPound = card.classification === "fluid_pound";

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
            Dynagraph Card Overlay (Gibbs 1D Wave Reconstruction)
          </span>
          <EstimatedBadge
            data={{
              value: card.confidence * 100,
              confidence: card.confidence,
              labelSource: card.labelSource,
              description: "Continuous 1D damped wave equation state reconstruction from surface load-position transducers.",
            }}
          />
        </div>

        {/* Classification status badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border ${
            isRodFloating
              ? "bg-status-warn/10 text-status-warn border-status-warn/40"
              : isFluidPound
              ? "bg-status-critical/10 text-status-critical border-status-critical/40"
              : "bg-status-safe/10 text-status-safe border-status-safe/40"
          }`}
        >
          {isRodFloating ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          <span>Classification: {card.classification.replace("_", " ")}</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Y-axis grid lines & labels */}
          {[0, 5000, 10000, 15000, 20000, 25000].map((load) => {
            const y = padding.top + chartHeight - ((load - minLoad) / loadRange) * chartHeight;
            return (
              <g key={load}>
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
                  {load.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* X-axis grid lines & labels */}
          {[0, 36, 72, 108, 144].map((pos) => {
            const x = padding.left + (pos / maxPosition) * chartWidth;
            return (
              <g key={pos}>
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
                  {pos}&quot;
                </text>
              </g>
            );
          })}

          {/* Downhole Reconstructed Card (Gibbs 1D Wave) */}
          <path
            d={downholePathD}
            fill="var(--accent-thermal)"
            fillOpacity={hoveredTrace === "downhole" ? "0.3" : "0.15"}
            stroke="var(--accent-thermal)"
            strokeWidth={hoveredTrace === "downhole" ? "3" : "2"}
            strokeDasharray="4 2"
            className="transition-all"
            onMouseEnter={() => setHoveredTrace("downhole")}
            onMouseLeave={() => setHoveredTrace(null)}
          />

          {/* Surface Transducer Measured Card */}
          <path
            d={surfacePathD}
            fill="var(--accent-mechanical)"
            fillOpacity={hoveredTrace === "surface" ? "0.3" : "0.15"}
            stroke={isRodFloating ? "var(--status-warn)" : "var(--accent-mechanical)"}
            strokeWidth={hoveredTrace === "surface" ? "3" : "2.25"}
            className="transition-all"
            onMouseEnter={() => setHoveredTrace("surface")}
            onMouseLeave={() => setHoveredTrace(null)}
          />

          {/* Axis Titles */}
          <text
            x={width / 2}
            y={height - 5}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-ibm-plex-mono)"
            textAnchor="middle"
          >
            Polished Rod Position (Inches)
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
            Load (lb)
          </text>
        </svg>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-line text-xs font-mono mt-1">
        <div>
          <span className="text-[10px] text-text-muted">Peak Surface (PPRL):</span>
          <div className="font-bold text-text-primary">{card.peakSurfaceLoadLb.toLocaleString()} lb</div>
        </div>
        <div>
          <span className="text-[10px] text-text-muted">Min Surface (MPRL):</span>
          <div className={`font-bold ${isRodFloating ? "text-status-warn" : "text-text-primary"}`}>
            {card.minSurfaceLoadLb.toLocaleString()} lb
          </div>
        </div>
        <div>
          <span className="text-[10px] text-text-muted">Downhole Fillage:</span>
          <div className="font-bold text-accent-thermal">{card.pumpFillagePct}%</div>
        </div>
        <div>
          <span className="text-[10px] text-text-muted">Stroke Length:</span>
          <div className="font-bold text-accent-mechanical">144 in</div>
        </div>
      </div>
    </div>
  );
}
