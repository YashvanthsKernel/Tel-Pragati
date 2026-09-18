"use client";

import React from "react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { TelemetryBadge } from "./TelemetryBadge";
import { TrendIndicator } from "./TrendIndicator";
import { ProvenanceMetadata, TelemetrySource } from "../../types/twin";
import { useTwinStore } from "../../store/useTwinStore";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  source: TelemetrySource;
  trend?: {
    delta: string | number;
    direction: "up" | "down" | "flat";
    unit?: string;
    isGood?: "up" | "down" | "neutral";
  };
  confidence?: number;
  statusBadge?: React.ReactNode;
  metadata?: ProvenanceMetadata;
  onClick?: () => void;
  className?: string;
  highlightCritical?: boolean;
  /** Severity wash for a metric that has crossed an alarm threshold. */
  status?: "critical" | "warn" | "safe" | "info" | "none";
  /** Breathing rim while the underlying alert is unacknowledged. */
  pulse?: boolean;
}

/* Shared severity washes — defined once in globals.css. */
const statusPanel: Record<string, string> = {
  critical: "panel-critical",
  warn:     "panel-warn",
  safe:     "panel-safe",
  info:     "panel-info",
  none:     "",
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  source,
  trend,
  confidence,
  statusBadge,
  metadata,
  onClick,
  className = "",
  highlightCritical = false,
  status = "none",
  pulse = false,
}) => {
  const openProvenance = useTwinStore((state) => state.openProvenance);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (metadata) {
      openProvenance(metadata);
    }
  };

  /* An explicit status wins; highlightCritical stays supported for existing callers. */
  const resolvedStatus = status !== "none" ? status : highlightCritical ? "critical" : "none";

  const pulseClass =
    pulse && resolvedStatus === "critical"
      ? "panel-pulse-critical"
      : pulse && resolvedStatus === "warn"
      ? "panel-pulse-warn"
      : "";

  return (
    <div
      onClick={handleCardClick}
      className={`relative bg-surface rounded-lg border p-3 transition-all duration-200 cursor-pointer select-none ${
        resolvedStatus === "none"
          ? "border-app-border hover:border-line-strong hover:shadow-card"
          : `${statusPanel[resolvedStatus]} shadow-card`
      } ${pulseClass} ${className}`}
    >
      {/* Top row: Label & Telemetry Source Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-text-secondary tracking-wide uppercase truncate" title={label}>
          {label}
        </span>
        <TelemetryBadge source={source} metadata={metadata} />
      </div>

      {/* Primary Value */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-xs font-mono text-text-secondary">{unit}</span>}
        </div>

        {statusBadge}
      </div>

      {/* Bottom row: Trend & Confidence */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-line">
        {trend ? (
          <TrendIndicator
            delta={trend.delta}
            direction={trend.direction}
            unit={trend.unit}
            isGood={trend.isGood}
          />
        ) : (
          <span className="text-[10px] font-mono text-text-muted">STEADY</span>
        )}

        {confidence !== undefined && <ConfidenceBadge value={confidence} size="sm" />}
      </div>
    </div>
  );
};
