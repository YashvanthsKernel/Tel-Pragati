"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Flame, AlertTriangle, ShieldCheck } from "lucide-react";
import { WellSummary } from "../../data/types";
import { RadialGauge } from "../common/RadialGauge";
import { Sparkline } from "../charts/Sparkline";

interface WellSummaryCardProps {
  well: WellSummary;
  sparklineData?: number[];
  onClick?: () => void;
}

export function WellSummaryCard({ well, sparklineData = [520, 540, 580, 560, 550, 570, 560], onClick }: WellSummaryCardProps) {
  const getStatusBadge = (status: WellSummary["status"]) => {
    switch (status) {
      case "producing":
        return { label: "PRODUCING", bg: "bg-status-safe/10", text: "text-status-safe", border: "border-status-safe/30" };
      case "css_active":
        return { label: "CSS ACTIVE", bg: "bg-accent-thermal/10", text: "text-accent-thermal", border: "border-accent-thermal/30" };
      case "alarm":
        return { label: "ALARM", bg: "bg-status-critical/10", text: "text-status-critical", border: "border-status-critical/30" };
      case "shut_in":
        return { label: "SHUT IN", bg: "bg-surface-2", text: "text-text-muted", border: "border-line" };
    }
  };

  const badge = getStatusBadge(well.status);

  return (
    <Link
      href={`/well/${well.wellId}/twin`}
      onClick={onClick}
      className="p-3.5 rounded-lg bg-surface-1 border border-line shadow-card hover:border-accent-mechanical/50 transition-all group flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-sm text-text-primary group-hover:text-accent-mechanical transition-colors">
              {well.name}
            </span>
            <span className="text-[10px] font-mono text-text-muted">({well.padId})</span>
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-0.5">
            Depth: {well.depthM || 1040}m · API {well.apiGravity || 17.2}°
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-line/60">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-mono text-text-muted uppercase">Gross Flow</span>
          <span className="font-mono text-lg font-bold text-text-primary leading-tight">
            {well.flowBopd}
            <span className="text-[10px] text-text-muted font-normal ml-1">BOPD</span>
          </span>
          <div className="w-20 h-5 mt-1">
            <Sparkline
              data={sparklineData}
              color={well.status === "alarm" ? "#C43D35" : "#197F8C"}
              height={20}
            />
          </div>
        </div>

        <div className="flex justify-end items-center">
          <RadialGauge
            value={well.healthPct}
            label="Health Index"
            size={68}
            strokeWidth={5.5}
            variant="auto"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1">
        <div className="flex items-center gap-2">
          {well.rodFloatingRiskPct !== undefined && (
            <span className={well.rodFloatingRiskPct > 50 ? "text-status-warn font-semibold" : ""}>
              Risk: {well.rodFloatingRiskPct}%
            </span>
          )}
          {well.bhtCelsius !== undefined && (
            <span className="text-accent-thermal">
              {well.bhtCelsius}°C
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 text-accent-mechanical group-hover:translate-x-0.5 transition-transform font-sans font-medium">
          <span>Twin</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
