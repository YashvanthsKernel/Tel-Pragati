"use client";

import React from "react";
import { calculateFirstPrinciplesBHT } from "../../models/baghewalaPhysics";

interface ThermalDecayPlotProps {
  currentDay: number;
  className?: string;
}

export const ThermalDecayPlot: React.FC<ThermalDecayPlotProps> = ({
  currentDay,
  className = "",
}) => {
  const width = 460;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  const days = Array.from({ length: 46 }, (_, i) => i);
  const data = days.map((d) => ({ day: d, temp: calculateFirstPrinciplesBHT(d) }));

  const minX = 0;
  const maxX = 45;
  const minY = 30;
  const maxY = 210;

  const scaleX = (x: number) =>
    padding.left + ((x - minX) / (maxX - minX)) * (width - padding.left - padding.right);
  const scaleY = (y: number) =>
    height - padding.bottom - ((y - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);

  const linePath = data.reduce((path, pt, idx) => {
    const x = scaleX(pt.day);
    const y = scaleY(pt.temp);
    return `${path} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  const currentTemp = calculateFirstPrinciplesBHT(currentDay);

  return (
    <div className={`w-full bg-surface-alt rounded-md border border-app-border p-3 font-mono ${className}`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-bold text-text-primary uppercase">
          Bottomhole Temperature vs CSS Cycle Days
        </span>
        <span className="text-[11px] text-oil-red font-bold">
          Day {currentDay.toFixed(1)}: {currentTemp.toFixed(1)}°C
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y Grid lines */}
        {[35, 75, 115, 155, 195].map((y) => (
          <g key={y}>
            <line
              x1={padding.left}
              y1={scaleY(y)}
              x2={width - padding.right}
              y2={scaleY(y)}
              stroke="#D8DEE6"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 6}
              y={scaleY(y) + 3}
              textAnchor="end"
              fontSize="9"
              fill="#667085"
            >
              {y}°C
            </text>
          </g>
        ))}

        {/* X Grid lines */}
        {[0, 5, 10, 20, 30, 40, 45].map((x) => (
          <g key={x}>
            <line
              x1={scaleX(x)}
              y1={padding.top}
              x2={scaleX(x)}
              y2={height - padding.bottom}
              stroke="#D8DEE6"
              strokeDasharray="2,2"
            />
            <text
              x={scaleX(x)}
              y={height - padding.bottom + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#667085"
            >
              D{x}
            </text>
          </g>
        ))}

        {/* Curve Path */}
        <path d={linePath} fill="none" stroke="#E31E24" strokeWidth="2.5" />

        {/* Current Marker */}
        <circle
          cx={scaleX(currentDay)}
          cy={scaleY(currentTemp)}
          r="5"
          fill="#E31E24"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};
