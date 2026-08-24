"use client";

import React from "react";
import { calculateOilViscosity } from "../../models/baghewalaPhysics";

interface ViscosityRheologyPlotProps {
  currentTempC: number;
  className?: string;
}

export const ViscosityRheologyPlot: React.FC<ViscosityRheologyPlotProps> = ({
  currentTempC,
  className = "",
}) => {
  const width = 460;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const temps = [35, 45, 55, 65, 75, 90, 110, 130, 150, 175, 195];
  const data = temps.map((t) => ({ temp: t, visc: calculateOilViscosity(t) }));

  const minX = 35;
  const maxX = 195;
  const minY = 10;
  const maxY = 20000;

  const scaleX = (x: number) =>
    padding.left + ((x - minX) / (maxX - minX)) * (width - padding.left - padding.right);
  
  // Logarithmic Y scale for viscosity
  const scaleY = (y: number) => {
    const logMin = Math.log10(minY);
    const logMax = Math.log10(maxY);
    const logVal = Math.log10(Math.max(minY, y));
    return height - padding.bottom - ((logVal - logMin) / (logMax - logMin)) * (height - padding.top - padding.bottom);
  };

  const linePath = data.reduce((path, pt, idx) => {
    const x = scaleX(pt.temp);
    const y = scaleY(pt.visc);
    return `${path} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  const currentVisc = calculateOilViscosity(currentTempC);

  return (
    <div className={`w-full bg-surface-alt rounded-md border border-app-border p-3 font-mono ${className}`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-bold text-text-primary uppercase">
          Andrade Rheology: Viscosity vs Temperature (17Ã‚Â° API)
        </span>
        <span className="text-[11px] text-oil-charcoal font-bold">
          {currentTempC.toFixed(1)}Ã‚Â°C: {Math.round(currentVisc).toLocaleString()} cP
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y Grid lines (Log scale) */}
        {[50, 200, 1000, 5000, 18000].map((y) => (
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
              {y.toLocaleString()}
            </text>
          </g>
        ))}

        {/* X Grid lines */}
        {[35, 75, 115, 155, 195].map((x) => (
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
              {x}Ã‚Â°C
            </text>
          </g>
        ))}

        {/* Curve Path */}
        <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="2.5" />

        {/* Current Marker */}
        <circle
          cx={scaleX(currentTempC)}
          cy={scaleY(currentVisc)}
          r="5"
          fill="#2563EB"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};
