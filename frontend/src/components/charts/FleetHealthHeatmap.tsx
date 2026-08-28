"use client";

import React from "react";
import Link from "next/link";
import { WellSummary } from "../../data/types";

interface FleetHealthHeatmapProps {
  wells: WellSummary[];
}

export function FleetHealthHeatmap({ wells }: FleetHealthHeatmapProps) {
  const columns = [
    { key: "healthPct", label: "Health Index", format: (v: any) => `${v}%`, getScore: (v: number) => v },
    { key: "flowBopd", label: "Gross BOPD", format: (v: any) => `${v}`, getScore: (v: number) => Math.min(100, (v / 800) * 100) },
    { key: "rodFloatingRiskPct", label: "Rod Risk", format: (v: any) => `${v || 0}%`, getScore: (v: number) => Math.max(0, 100 - (v || 0)) },
    { key: "bhtCelsius", label: "BHT (°C)", format: (v: any) => `${v || 74}°C`, getScore: (v: number) => Math.min(100, ((v || 74) / 180) * 100) },
    { key: "viscosityCp", label: "Viscosity", format: (v: any) => `${v || 5000} cP`, getScore: (v: number) => Math.max(0, 100 - ((v || 5000) / 15000) * 100) },
  ];

  const getColor = (score: number) => {
    if (score >= 80) return "bg-status-safe/25 text-status-safe border-status-safe/40";
    if (score >= 50) return "bg-status-warn/25 text-status-warn border-status-warn/40";
    return "bg-status-critical/25 text-status-critical border-status-critical/40";
  };

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none space-y-3">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
          Fleet Telemetry & Health Matrix (Heatmap)
        </span>
        <span className="text-xs font-mono text-text-muted">
          {wells.length} Wells Monitored
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-line text-text-muted">
              <th className="py-2 px-3 text-left">Well ID</th>
              <th className="py-2 px-3 text-left">Pad</th>
              <th className="py-2 px-3 text-left">Status</th>
              {columns.map((c) => (
                <th key={c.key} className="py-2 px-3 text-center">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {wells.map((w) => (
              <tr key={w.wellId} className="hover:bg-surface-2 transition-colors">
                <td className="py-2 px-3 font-bold text-text-primary">
                  <Link href={`/well/${w.wellId}/twin`} className="hover:text-accent-mechanical">
                    {w.name}
                  </Link>
                </td>
                <td className="py-2 px-3 text-text-muted">{w.padId}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      w.status === "producing"
                        ? "bg-status-safe/10 text-status-safe"
                        : w.status === "css_active"
                        ? "bg-accent-thermal/10 text-accent-thermal"
                        : w.status === "alarm"
                        ? "bg-status-critical/10 text-status-critical"
                        : "bg-surface-2 text-text-muted"
                    }`}
                  >
                    {w.status}
                  </span>
                </td>
                {columns.map((c) => {
                  const val = (w as any)[c.key];
                  const score = c.getScore(val);
                  return (
                    <td key={c.key} className="py-2 px-3 text-center">
                      <div className={`py-1 px-2 rounded border text-xs font-bold ${getColor(score)}`}>
                        {c.format(val)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
