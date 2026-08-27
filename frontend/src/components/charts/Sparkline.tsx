"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number | string;
  fill?: boolean;
}

export function Sparkline({
  data,
  color = "#197F8C",
  height = 28,
  width = "100%",
  fill = true,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className="h-full w-full bg-surface-2/40 rounded animate-pulse" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 2;
  const effectiveHeight = height - padding * 2;

  // ViewBox coordinates (normalized to 100 x height)
  const vbWidth = 100;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * vbWidth;
    const y = effectiveHeight - ((val - min) / range) * effectiveHeight + padding;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(" ");
  const areaPath = `M 0,${height} L ${points[0]} L ${polylineStr.replace(/ /g, " L ")} L ${vbWidth},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-full overflow-visible"
    >
      {fill && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.15}
        />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylineStr}
      />
    </svg>
  );
}
