"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from "lucide-react";
import { Sparkline } from "../charts/Sparkline";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trendPct?: number;
  sparklineData?: number[];
  variant?: "thermal" | "mechanical" | "safe" | "warn" | "critical" | "neutral";
  subtext?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  trendPct,
  sparklineData,
  variant = "neutral",
  subtext,
  isLoading = false,
  error = null,
  className = "",
}: StatCardProps) {
  let accentColor = "text-text-primary";
  let borderColor = "border-line";

  if (variant === "thermal") {
    accentColor = "text-accent-thermal";
    borderColor = "border-accent-thermal/30";
  } else if (variant === "mechanical") {
    accentColor = "text-accent-mechanical";
    borderColor = "border-accent-mechanical/30";
  } else if (variant === "safe") {
    accentColor = "text-status-safe";
    borderColor = "border-status-safe/30";
  } else if (variant === "warn") {
    accentColor = "text-status-warn";
    borderColor = "border-status-warn/30";
  } else if (variant === "critical") {
    accentColor = "text-status-critical";
    borderColor = "border-status-critical/30";
  }

  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg bg-surface-1 border border-line flex flex-col justify-between h-28 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
          <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />
        </div>
        <div className="h-6 w-28 bg-surface-2 rounded animate-pulse" />
        <div className="h-2 w-16 bg-surface-2 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg bg-surface-1 border border-status-critical/30 flex flex-col justify-between h-28 ${className}`}>
        <span className="text-xs font-mono text-text-muted">{label}</span>
        <div className="flex items-center gap-1.5 text-xs text-status-critical">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{error}</span>
        </div>
        <span className="text-[10px] text-text-muted">Telemetry error</span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg bg-surface-1 border ${borderColor} shadow-card hover:border-text-muted/40 transition-colors flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-text-muted font-medium line-clamp-1 uppercase tracking-wide">
          {label}
        </span>
        {trendPct !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-[11px] font-mono font-semibold ${
              trendPct > 0
                ? "text-status-safe"
                : trendPct < 0
                ? "text-status-warn"
                : "text-text-muted"
            }`}
          >
            {trendPct > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trendPct < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-mono font-bold tracking-tight ${accentColor}`}>
            {value}
          </span>
          {unit && <span className="text-xs font-mono text-text-muted font-normal">{unit}</span>}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-7 flex-shrink-0">
            <Sparkline
              data={sparklineData}
              color={
                variant === "thermal"
                  ? "#C65B32"
                  : variant === "mechanical"
                  ? "#197F8C"
                  : variant === "safe"
                  ? "#238B57"
                  : variant === "warn"
                  ? "#B77A08"
                  : variant === "critical"
                  ? "#C43D35"
                  : "#197F8C"
              }
            />
          </div>
        )}
      </div>

      {subtext && (
        <span className="text-[11px] text-text-muted font-mono line-clamp-1">
          {subtext}
        </span>
      )}
    </div>
  );
}
