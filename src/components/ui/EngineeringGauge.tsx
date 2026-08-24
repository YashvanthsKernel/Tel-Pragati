"use client";

import React from "react";

interface EngineeringGaugeProps {
  value: number; // 0 - 100
  label: string;
  unit?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  statusText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const EngineeringGauge: React.FC<EngineeringGaugeProps> = ({
  value,
  label,
  unit = "%",
  warningThreshold = 45,
  criticalThreshold = 75,
  statusText,
  size = "md",
  className = "",
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  let barColor = "bg-emerald-600";
  let textColor = "text-emerald-700";
  let statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-300";

  if (clampedValue >= criticalThreshold) {
    barColor = "bg-oil-red";
    textColor = "text-oil-red";
    statusBadgeClass = "bg-red-50 text-red-700 border-red-300 font-bold";
  } else if (clampedValue >= warningThreshold) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
    statusBadgeClass = "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
  }

  const heightClass = size === "sm" ? "h-2" : size === "md" ? "h-3" : "h-4";

  return (
    <div className={`w-full bg-surface-alt p-3 rounded-md border border-app-border ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold font-mono ${textColor}`}>
            {clampedValue}
            <span className="text-xs font-normal text-text-secondary ml-0.5">{unit}</span>
          </span>
          {statusText && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${statusBadgeClass}`}>
              {statusText}
            </span>
          )}
        </div>
      </div>

      {/* Gauge Linear Range Bar */}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden relative ${heightClass}`}>
        <div
          className={`h-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${clampedValue}%` }}
        />
        {/* Warning threshold indicator line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-600 opacity-60"
          style={{ left: `${warningThreshold}%` }}
          title={`Warning Threshold: ${warningThreshold}%`}
        />
        {/* Critical threshold indicator line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-600 opacity-80"
          style={{ left: `${criticalThreshold}%` }}
          title={`Critical Threshold: ${criticalThreshold}%`}
        />
      </div>

      {/* Threshold Labels */}
      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
        <span>0% (Safe)</span>
        <span>Warn: {warningThreshold}%</span>
        <span>Crit: {criticalThreshold}%</span>
        <span>100%</span>
      </div>
    </div>
  );
};
