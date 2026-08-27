"use client";

import React from "react";
import { ArrowDown, ArrowUp, IndianRupee } from "lucide-react";

interface EconomicWaterfallProps {
  data: {
    grossRevenueInr: number;
    liftingPowerCostInr: number;
    steamThermalCostInr: number;
    chemicalMaintenanceInr: number;
    netMarginInr: number;
  };
  height?: number;
}

export function EconomicWaterfall({ data, height = 240 }: EconomicWaterfallProps) {
  const steps = [
    { label: "Gross Revenue", value: data.grossRevenueInr, type: "income", color: "var(--status-safe)" },
    { label: "Lifting Power", value: -data.liftingPowerCostInr, type: "expense", color: "var(--status-warn)" },
    { label: "Steam Thermal", value: -data.steamThermalCostInr, type: "expense", color: "var(--accent-thermal)" },
    { label: "Chemical / Maint", value: -data.chemicalMaintenanceInr, type: "expense", color: "var(--status-critical)" },
    { label: "Net Margin", value: data.netMarginInr, type: "total", color: "var(--accent-mechanical)" },
  ];

  const maxVal = Math.max(data.grossRevenueInr, 1);

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-3.5 shadow-card select-none space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
          Daily Economic Waterfall (₹ INR / Day)
        </span>
        <span className="text-xs font-mono font-bold text-status-safe">
          Net Margin: ₹{data.netMarginInr.toLocaleString()}/d
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {steps.map((step) => {
          const absVal = Math.abs(step.value);
          const barWidthPct = Math.min(100, Math.max(8, (absVal / maxVal) * 100));

          return (
            <div key={step.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-muted">{step.label}</span>
                <span
                  style={{ color: step.color }}
                  className="font-bold flex items-center gap-0.5"
                >
                  {step.type === "expense" ? "-" : "+"}₹{absVal.toLocaleString()}
                </span>
              </div>

              <div className="h-4 bg-surface-0 rounded border border-line overflow-hidden relative">
                <div
                  style={{ width: `${barWidthPct}%`, backgroundColor: step.color }}
                  className="h-full rounded-sm opacity-80"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
