"use client";

import React from "react";
import { EconomicCutoffPoint } from "../../types/twin";

interface EconomicCutoffPlotProps {
  currentDay: number;
  curve: EconomicCutoffPoint[];
  projectedCutoffDay: number;
  className?: string;
}

export const EconomicCutoffPlot: React.FC<EconomicCutoffPlotProps> = ({
  currentDay,
  curve,
  projectedCutoffDay = 41,
  className = "",
}) => {
  const width = 460;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 65 };

  const minX = 0;
  const maxX = 45;
  const minY = 0;
  const maxY = 5500000; // ₹55 Lakhs daily scale

  const scaleX = (x: number) =>
    padding.left + ((x - minX) / (maxX - minX)) * (width - padding.left - padding.right);
  const scaleY = (y: number) =>
    height - padding.bottom - ((y - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);

  const revenuePath = curve.reduce((path, pt, idx) => {
    const x = scaleX(pt.day);
    const y = scaleY(pt.dailyGrossRevenueInr);
    return `${path} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  const costPath = curve.reduce((path, pt, idx) => {
    const x = scaleX(pt.day);
    const y = scaleY(pt.dailyLiftingAndThermalCostInr * 25); // Scaled for break-even crossover visualization
    return `${path} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  return (
    <div className={`w-full bg-surface-alt rounded-md border border-app-border p-3 font-mono ${className}`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-bold text-text-primary uppercase">
          Economic CSS Cut-Off: Gross Revenue vs Lifting & Thermal Costs (₹/day)
        </span>
        <span className="text-[11px] text-status-warn font-bold bg-status-warn-soft px-2 py-0.5 rounded border border-status-warn/30">
          Model Cut-Off: Day {projectedCutoffDay}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Cut-off vertical marker */}
        <line
          x1={scaleX(projectedCutoffDay)}
          y1={padding.top}
          x2={scaleX(projectedCutoffDay)}
          y2={height - padding.bottom}
          stroke="#E31E24"
          strokeWidth="2"
          strokeDasharray="4,4"
        />
        <text
          x={scaleX(projectedCutoffDay) - 4}
          y={padding.top + 14}
          textAnchor="end"
          fontSize="9"
          fontWeight="bold"
          fill="#E31E24"
        >
          CUT-OFF (DAY {projectedCutoffDay})
        </text>

        {/* Revenue Curve */}
        <path d={revenuePath} fill="none" stroke="#238B57" strokeWidth="2.5" />

        {/* Cost Curve */}
        <path d={costPath} fill="none" stroke="#C65B32" strokeWidth="2.5" />

        {/* Labels & Legend */}
        <text
          x={width - padding.right - 10}
          y={scaleY(1200000)}
          textAnchor="end"
          fontSize="9"
          fontWeight="bold"
          fill="#238B57"
        >
          Daily Gross Revenue (₹)
        </text>

        <text
          x={width - padding.right - 10}
          y={scaleY(2800000)}
          textAnchor="end"
          fontSize="9"
          fontWeight="bold"
          fill="#C65B32"
        >
          Lifting & Thermal Cost (₹)
        </text>
      </svg>
    </div>
  );
};
