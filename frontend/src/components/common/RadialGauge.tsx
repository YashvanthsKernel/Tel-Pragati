"use client";

import React from "react";

interface RadialGaugeProps {
  value: number; // 0 to 100
  label: string;
  size?: number;
  strokeWidth?: number;
  variant?: "safe" | "warn" | "critical" | "thermal" | "mechanical" | "auto";
  unit?: string;
  showValue?: boolean;
}

export function RadialGauge({
  value,
  label,
  size = 90,
  strokeWidth = 7,
  variant = "auto",
  unit = "%",
  showValue = true,
}: RadialGaugeProps) {
  const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let color = "var(--accent-mechanical)";
  if (variant === "safe") color = "var(--status-safe)";
  else if (variant === "warn") color = "var(--status-warn)";
  else if (variant === "critical") color = "var(--status-critical)";
  else if (variant === "thermal") color = "var(--accent-thermal)";
  else if (variant === "mechanical") color = "var(--accent-mechanical)";
  else if (variant === "auto") {
    if (clamped >= 75) color = "var(--status-critical)";
    else if (clamped >= 45) color = "var(--status-warn)";
    else color = "var(--status-safe)";
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--line)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono font-bold text-sm text-text-primary leading-none">
              {Math.round(clamped)}
              <span className="text-[10px] text-text-muted font-normal ml-0.5">{unit}</span>
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="text-[11px] font-mono text-text-muted mt-1 text-center font-medium line-clamp-1 max-w-[120px]">
          {label}
        </span>
      )}
    </div>
  );
}
