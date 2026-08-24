"use client";

import React from "react";
import { CSSPhase, RiskSeverity, TelemetrySource } from "../../types/twin";

type PillVariant =
  | TelemetrySource
  | RiskSeverity
  | CSSPhase
  | "LIVE"
  | "OFFLINE"
  | "SYNCED"
  | "APPROVED"
  | "ADVISORY"
  | "SUPERVISED"
  | "AUTOMATED";

interface StatusPillProps {
  variant: PillVariant | string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  variant,
  label,
  size = "sm",
  className = "",
}) => {
  const displayLabel = label || variant.replace("_", " ");

  const getStyles = () => {
    switch (variant) {
      // Data Provenance
      case "MEASURED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ESTIMATED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "PREDICTED":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "SIMULATED":
        return "bg-purple-50 text-purple-700 border-purple-200";

      // Status / Severity
      case "NOMINAL":
      case "HEALTHY":
      case "SYNCED":
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "WARNING":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "CRITICAL":
      case "OFFLINE":
        return "bg-red-50 text-red-700 border-red-300 font-semibold";

      // CSS Phases
      case "INJECTION":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "SOAK":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "PRODUCTION":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "COOLING":
        return "bg-cyan-50 text-cyan-800 border-cyan-300";
      case "CYCLE_END":
        return "bg-slate-100 text-slate-700 border-slate-300";

      // Control Modes
      case "ADVISORY":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SUPERVISED":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "AUTOMATED":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";

      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] tracking-wider uppercase font-mono font-medium"
      : "px-2.5 py-1 text-xs tracking-wider uppercase font-mono font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${getStyles()} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />
      {displayLabel}
    </span>
  );
};
