"use client";

import React, { useState } from "react";

export interface TimeSeriesDataPoint {
  x: number | string;
  y: number;
  yLower?: number;
  yUpper?: number;
  label?: string;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  yLabel?: string;
  xLabel?: string;
  color?: string;
  height?: number;
  showConfidenceBand?: boolean;
  unit?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function TimeSeriesChart({
  data,
  title,
  yLabel,
  xLabel = "Cycle Day",
  color = "var(--accent-thermal)",
  height = 220,
  showConfidenceBand = true,
  unit = "",
  isLoading = false,
  error = null,
}: TimeSeriesChartProps) {
  const [hoverPoint, setHoverPoint] = useState<TimeSeriesDataPoint | null>(null);

  if (isLoading) {
    return (
      <div style={{ height }} className="w-full rounded-lg bg-surface-1 border border-line p-4 flex flex-col justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-mechanical border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-2">Loading time series telemetry...</span>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div style={{ height }} className="w-full rounded-lg bg-surface-1 border border-line p-4 flex flex-col justify-center items-center text-center">
        <span className="text-xs font-mono text-status-critical">{error || "No telemetry data available for this range."}</span>
      </div>
    );
  }

  const yValues = data.map((d) => d.y);
  const upperValues = data.map((d) => d.yUpper ?? d.y);
  const lowerValues = data.map((d) => d.yLower ?? d.y);

  const minY = Math.min(...lowerValues, ...yValues);
  const maxY = Math.max(...upperValues, ...yValues);
  const yPadding = (maxY - minY) * 0.1 || 10;
  const domainMin = Math.max(0, Math.floor(minY - yPadding));
  const domainMax = Math.ceil(maxY + yPadding);
  const domainRange = domainMax - domainMin || 1;

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 35, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Build SVG points
  const points = data.map((d, idx) => {
    const x = padding.left + (idx / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.y - domainMin) / domainRange) * chartHeight;
    return { ...d, screenX: x, screenY: y };
  });

  const pathD = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.screenX.toFixed(1)},${curr.screenY.toFixed(1)}`, "");

  // Build confidence band polygon
  let bandPolygonD = "";
  if (showConfidenceBand) {
    const upperPoints = data.map((d, idx) => {
      const x = padding.left + (idx / (data.length - 1)) * chartWidth;
      const yVal = d.yUpper ?? d.y;
      const y = padding.top + chartHeight - ((yVal - domainMin) / domainRange) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const lowerPoints = data.map((d, idx) => {
      const x = padding.left + (idx / (data.length - 1)) * chartWidth;
      const yVal = d.yLower ?? d.y;
      const y = padding.top + chartHeight - ((yVal - domainMin) / domainRange) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).reverse();

    bandPolygonD = `M ${upperPoints.join(" L ")} L ${lowerPoints.join(" L ")} Z`;
  }

  // Y-axis ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const val = domainMin + (i / tickCount) * domainRange;
    const y = padding.top + chartHeight - (i / tickCount) * chartHeight;
    return { val: Math.round(val), y };
  });

  return (
    <div className="w-full select-none">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-sans font-bold text-text-primary uppercase tracking-wide">
            {title}
          </span>
          {hoverPoint && (
            <span className="text-xs font-mono font-bold text-accent-mechanical">
              {hoverPoint.label || `Day ${hoverPoint.x}`}: {hoverPoint.y.toLocaleString()} {unit}
            </span>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          {/* Grid lines */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={t.y}
                x2={width - padding.right}
                y2={t.y}
                stroke="var(--line)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={t.y + 3}
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="var(--font-ibm-plex-mono)"
                textAnchor="end"
              >
                {t.val}
              </text>
            </g>
          ))}

          {/* Confidence band */}
          {showConfidenceBand && bandPolygonD && (
            <path
              d={bandPolygonD}
              fill={color}
              fillOpacity={0.12}
            />
          )}

          {/* Main line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive touch targets */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.screenX}
                cy={p.screenY}
                r="3"
                fill={color}
                className="opacity-0 hover:opacity-100 transition-opacity"
              />
              <rect
                x={p.screenX - 10}
                y={padding.top}
                width="20"
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoverPoint(p)}
                onMouseLeave={() => setHoverPoint(null)}
                className="cursor-crosshair"
              />
            </g>
          ))}

          {/* X Axis line & labels */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="var(--line)"
            strokeWidth="1.5"
          />

          <text
            x={padding.left}
            y={height - 8}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-ibm-plex-mono)"
          >
            {data[0]?.x}
          </text>
          <text
            x={width / 2}
            y={height - 8}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-ibm-plex-mono)"
            textAnchor="middle"
          >
            {xLabel}
          </text>
          <text
            x={width - padding.right}
            y={height - 8}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-ibm-plex-mono)"
            textAnchor="end"
          >
            {data[data.length - 1]?.x}
          </text>
        </svg>
      </div>
    </div>
  );
}
