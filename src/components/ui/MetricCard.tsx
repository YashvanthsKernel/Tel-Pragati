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
}

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
}) => {
  const openProvenance = useTwinStore((state) => state.openProvenance);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (metadata) {
      openProvenance(metadata);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative bg-surface rounded-md border p-3 transition-all duration-150 cursor-pointer select-none ${
        highlightCritical
          ? "border-red-400 bg-red-50/20 shadow-sm"
          : "border-app-border hover:border-slate-400 hover:shadow-card"
      } ${className}`}
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
      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100">
        {trend ? (
          <TrendIndicator
            delta={trend.delta}
            direction={trend.direction}
            unit={trend.unit}
            isGood={trend.isGood}
          />
        ) : (
          <span className="text-[10px] font-mono text-slate-400">STEADY</span>
        )}

        {confidence !== undefined && <ConfidenceBadge value={confidence} size="sm" />}
      </div>
    </div>
  );
};
