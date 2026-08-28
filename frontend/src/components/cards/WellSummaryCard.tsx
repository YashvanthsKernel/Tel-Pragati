"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WellSummary } from "../../data/types";
import { RadialGauge } from "../common/RadialGauge";
import { Sparkline } from "../charts/Sparkline";

interface WellSummaryCardProps {
  well: WellSummary;
  sparklineData?: number[];
  onClick?: () => void;
}

const statusConfig = {
  producing: {
    label: "PRODUCING",
    pillStyle: "bg-status-safe/15 text-status-safe border border-status-safe/30",
    sparkColor: "var(--status-safe)",
  },
  css_active: {
    label: "CSS ACTIVE",
    pillStyle: "bg-accent-thermal/15 text-accent-thermal border border-accent-thermal/30",
    sparkColor: "var(--accent-thermal)",
  },
  alarm: {
    label: "ALARM",
    pillStyle: "bg-status-critical/15 text-status-critical border border-status-critical/30",
    sparkColor: "var(--status-critical)",
  },
  shut_in: {
    label: "SHUT IN",
    pillStyle: "bg-surface-2 text-text-muted border border-line",
    sparkColor: "var(--text-muted)",
  },
};

export function WellSummaryCard({
  well,
  sparklineData = [520, 540, 580, 560, 550, 570, 560],
  onClick,
}: WellSummaryCardProps) {
  const cfg = statusConfig[well.status];

  return (
    <Link
      href={`/well/${well.wellId}/twin`}
      onClick={onClick}
      className="bg-surface-1 border border-line rounded-lg shadow-card hover:border-accent-mechanical/50 transition-all group flex flex-col justify-between"
    >
      {/* ── Status header row ── */}
      <div className="px-3.5 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-sans font-bold text-sm text-text-primary group-hover:text-accent-mechanical transition-colors">
            {well.name}
          </span>
          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${cfg.pillStyle}`}>
            {cfg.label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          {well.padId}
        </span>
      </div>

      <div className="px-3.5 text-[11px] font-mono text-text-muted mt-0.5">
        {well.depthM || 1040}m depth · API {well.apiGravity || 17.2}°
      </div>

      {/* ── Metrics row ── */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-sans text-text-muted uppercase tracking-wide">Gross Flow</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-2xl font-bold text-text-primary leading-none tabular-nums">
              {well.flowBopd}
            </span>
            <span className="text-[10px] text-text-muted font-mono">BOPD</span>
          </div>
          <div className="w-20 h-4 mt-1.5">
            <Sparkline data={sparklineData} color={cfg.sparkColor} height={16} />
          </div>
        </div>

        <RadialGauge
          value={well.healthPct}
          label="Health"
          size={58}
          strokeWidth={4.5}
          variant="auto"
        />
      </div>

      {/* ── Footer row ── */}
      <div className="px-3.5 py-2 bg-surface-0 rounded-b-lg border-t border-line flex items-center justify-between text-xs font-mono text-text-muted">
        <div className="flex items-center gap-3">
          {well.rodFloatingRiskPct !== undefined && (
            <span className={well.rodFloatingRiskPct > 50 ? "text-status-warn font-semibold" : ""}>
              Risk {well.rodFloatingRiskPct}%
            </span>
          )}
          {well.bhtCelsius !== undefined && (
            <span className="text-accent-thermal font-semibold">{well.bhtCelsius}°C</span>
          )}
        </div>
        <span className="flex items-center gap-1 text-accent-mechanical group-hover:translate-x-0.5 transition-transform font-sans font-medium text-xs">
          Twin <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
