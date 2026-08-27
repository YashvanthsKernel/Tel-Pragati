"use client";

import React from "react";
import { DynagraphPoint } from "../../types/twin";

interface DynagraphPlotProps {
  surfaceCard: DynagraphPoint[];
  downholeCard: DynagraphPoint[];
  peakLoad: number;
  minLoad: number;
  strokeLength: number;
  className?: string;
}

export const DynagraphPlot: React.FC<DynagraphPlotProps> = ({
  surfaceCard,
  downholeCard,
  peakLoad,
  minLoad,
  strokeLength,
  className = "",
}) => {
  const width = 460;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const minX = 0;
  const maxX = strokeLength || 144;
  const minY = 0;
  const maxY = 26000;

  const scaleX = (x: number) =>
    padding.left + ((x - minX) / (maxX - minX)) * (width - padding.left - padding.right);
  const scaleY = (y: number) =>
    height - padding.bottom - ((y - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);

  const surfacePath = surfaceCard.reduce((path, pt, idx) => {
    const x = scaleX(pt.positionInches);
    const y = scaleY(pt.loadPounds);
    return `${path} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  const downholePath = downholeCard.reduce((path, pt, idx) => {
    const x = scaleX(pt.positionInches);
    const y = scaleY(pt.loadPounds);
    return `${path} ${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }, "");

  return (
    <div className={`w-full bg-surface-alt rounded-md border border-app-border p-3 font-mono ${className}`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-bold text-text-primary uppercase">
          Dynagraph: Surface vs Downhole Card (Gibbs Wave)
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-3 h-1 bg-oil-red rounded" />
            <span className="text-slate-600">Surface Card</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1 bg-blue-600 rounded" />
            <span className="text-slate-600">Gibbs Downhole Card</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 5000, 10000, 15000, 20000, 25000].map((y) => (
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
              x={padding.left - 8}
              y={scaleY(y) + 3}
              textAnchor="end"
              fontSize="9"
              fill="#74808B"
            >
              {y.toLocaleString()}
            </text>
          </g>
        ))}

        {[0, 36, 72, 108, 144].map((x) => (
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
              y={height - padding.bottom + 16}
              textAnchor="middle"
              fontSize="9"
              fill="#74808B"
            >
              {x}&quot;
            </text>
          </g>
        ))}

        {/* Downhole Card */}
        {downholePath && (
          <path
            d={`${downholePath} Z`}
            fill="rgba(40, 104, 168, 0.08)"
            stroke="#2868A8"
            strokeWidth="2"
          />
        )}

        {/* Surface Card */}
        {surfacePath && (
          <path
            d={`${surfacePath} Z`}
            fill="rgba(227, 30, 36, 0.06)"
            stroke="#E31E24"
            strokeWidth="2.5"
          />
        )}

        {/* Labels */}
        <text
          x={width / 2}
          y={height - 6}
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#2B2A29"
        >
          Polished Rod Position (Inches)
        </text>

        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${height / 2})`}
          fontSize="10"
          fontWeight="bold"
          fill="#2B2A29"
        >
          Rod Load (lb)
        </text>
      </svg>
    </div>
  );
};
