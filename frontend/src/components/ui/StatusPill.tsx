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
        return "bg-telemetry-soft text-telemetry border-telemetry/30";
      case "ESTIMATED":
        return "bg-mechanical-soft text-mechanical-dark border-mechanical/30";
      case "PREDICTED":
        return "bg-status-warn-soft text-status-warn border-status-warn/30";
      case "SIMULATED":
        return "bg-purple-50 text-provenance-simulated border-purple-200";

      // Status / Severity
      case "NOMINAL":
      case "HEALTHY":
      case "SYNCED":
      case "APPROVED":
        return "bg-status-safe-soft text-status-safe border-status-safe/30";
      case "WARNING":
        return "bg-status-warn-soft text-status-warn border-status-warn/30";
      case "CRITICAL":
      case "OFFLINE":
        return "bg-status-critical-soft text-status-critical border-status-critical/30 font-semibold";

      // CSS Phases
      case "INJECTION":
        return "bg-oil-red-soft text-oil-red border-oil-red/30";
      case "SOAK":
        return "bg-status-warn-soft text-status-warn border-status-warn/30";
      case "PRODUCTION":
        return "bg-status-safe-soft text-status-safe border-status-safe/30";
      case "COOLING":
        return "bg-mechanical-soft text-mechanical-dark border-mechanical/30";
      case "CYCLE_END":
        return "bg-surface-2 text-text-muted border-line";

      // Control Modes
      case "ADVISORY":
        return "bg-telemetry-soft text-telemetry border-telemetry/30";
      case "SUPERVISED":
        return "bg-status-warn-soft text-status-warn border-status-warn/30";
      case "AUTOMATED":
        return "bg-status-safe-soft text-status-safe border-status-safe/30";

      default:
        return "bg-surface-2 text-text-secondary border-line";
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
