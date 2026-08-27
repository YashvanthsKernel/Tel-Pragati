"use client";

import React from "react";
import { OptimizationStrategy } from "../../types/twin";

interface ParetoStrategyPlotProps {
  strategies: OptimizationStrategy[];
  className?: string;
}

export const ParetoStrategyPlot: React.FC<ParetoStrategyPlotProps> = ({
  strategies,
  className = "",
}) => {
  const width = 460;
  const height = 240;
  const padding = { top: 25, right: 35, bottom: 40, left: 65 };

  const minX = 50000;  // ₹50,000 / day
  const maxX = 135000; // ₹135,000 / day
  const minY = 350;    // 350 BOPD
  const maxY = 900;    // 900 BOPD

  const scaleX = (x: number) =>
    padding.left + ((x - minX) / (maxX - minX)) * (width - padding.left - padding.right);
  const scaleY = (y: number) =>
    height - padding.bottom - ((y - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);

  return (
    <div className={`w-full bg-surface-alt rounded-md border border-app-border p-3 font-mono ${className}`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-bold text-text-primary uppercase">
          Pareto Optimization: Operating Cost vs Oil Production
        </span>
        <span className="text-[10px] text-slate-500">
          Circle Diameter: Failure Risk (%)
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y Grid lines (BOPD) */}
        {[400, 550, 700, 850].map((y) => (
          <g key={y}>
            <line
              x1={padding.left}
              y1={scaleY(y)}
              x2={width - padding.right}
              y2={scaleY(y)}
              stroke="#D1D8DF"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 6}
              y={scaleY(y) + 3}
              textAnchor="end"
              fontSize="9"
              fill="#74808B"
            >
              {y}
            </text>
          </g>
        ))}

        {/* X Grid lines (Cost in ₹k) */}
        {[60000, 80000, 100000, 120000].map((x) => (
          <g key={x}>
            <line
              x1={scaleX(x)}
              y1={padding.top}
              x2={scaleX(x)}
              y2={height - padding.bottom}
              stroke="#D1D8DF"
              strokeDasharray="2,2"
            />
            <text
              x={scaleX(x)}
              y={height - padding.bottom + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#74808B"
            >
              ₹{x / 1000}k
            </text>
          </g>
        ))}

        {/* Strategy Points */}
        {strategies.map((s) => {
          const cx = scaleX(s.dailyOperatingCostInr);
          const cy = scaleY(s.productionBopd);
          const radius = Math.max(7, Math.min(22, s.rodFloatingRiskPercent * 0.28));

          const isRec = s.isRecommended;

          return (
            <g key={s.id}>
              {/* Risk circle */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={isRec ? "rgba(227, 30, 36, 0.25)" : "rgba(100, 116, 139, 0.2)"}
                stroke={isRec ? "#E31E24" : "#64748B"}
                strokeWidth={isRec ? "2" : "1.5"}
              />

              {/* Center point */}
              <circle
                cx={cx}
                cy={cy}
                r="3.5"
                fill={isRec ? "#E31E24" : "#2B2A29"}
              />

              {/* Label */}
              <text
                x={cx}
                y={cy - radius - 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={isRec ? "#E31E24" : "#2B2A29"}
              >
                {s.name} {isRec ? "★ (Recommended)" : ""}
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text
          x={width / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize="9"
          fontWeight="bold"
          fill="#2B2A29"
        >
          Daily Operating Cost (₹/day)
        </text>

        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${height / 2})`}
          fontSize="9"
          fontWeight="bold"
          fill="#2B2A29"
        >
          Production (BOPD)
        </text>
      </svg>
    </div>
  );
};
