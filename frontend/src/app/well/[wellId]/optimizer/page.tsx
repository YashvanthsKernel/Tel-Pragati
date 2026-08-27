"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import { useDataProvider } from "../../../../data/DataProviderContext";
import { OptimizerResult, OptimizerStrategy } from "../../../../data/types";
import { ParetoScatterChart } from "../../../../components/charts/ParetoScatterChart";
import { EconomicWaterfall } from "../../../../components/charts/EconomicWaterfall";
import { TimeSeriesChart } from "../../../../components/charts/TimeSeriesChart";

export default function OptimizerPage() {
  const { wellId, wellState } = useWellContext();
  const provider = useDataProvider();

  const [optimizerResult, setOptimizerResult] = useState<OptimizerResult | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizerStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    provider.getOptimizerResult(wellId).then((res) => {
      // Check if a candidate was imported from simulator
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem(`sim_candidate_${wellId}`);
        if (stored) {
          try {
            const candidate: OptimizerStrategy = JSON.parse(stored);
            if (!res.strategies.some((s) => s.name === candidate.name)) {
              res.strategies.push(candidate);
            }
          } catch (e) {
            console.error("Failed to parse sim candidate", e);
          }
        }
      }

      setOptimizerResult(res);
      const rec = res.strategies.find((s) => s.recommended) || res.strategies[1];
      setSelectedStrategy(rec);
      setIsLoading(false);
    });
  }, [provider, wellId]);

  if (isLoading || !optimizerResult) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-accent-thermal border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Evaluating Multi-Objective Pareto Frontier for {wellId}...
        </span>
      </div>
    );
  }

  const { strategies, economicCutoffDay, daysRemainingToCutoff, waterfallBreakdown } = optimizerResult;

  // Economic cutoff trajectory data
  const cutoffCurveData = Array.from({ length: 46 }, (_, d) => {
    const rev = Math.max(0, 680 * (1 - d * 0.018) * 6200);
    const cost = 28000 + 32000 + (d > 25 ? (d - 25) * 850 : 2000);
    const net = rev - cost;
    return {
      x: `D${d}`,
      y: Math.round(net),
      label: `Day ${d}: ₹${Math.round(net).toLocaleString()}/d net margin`,
    };
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-thermal" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              {wellId} Multi-Objective Production & Economic Optimizer
            </h1>
          </div>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Pareto Frontier Trade-Off Evaluation · Dynamic Economic Break-Even Cut-Off Solver
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded bg-status-safe/10 text-status-safe border border-status-safe/30 text-xs font-mono font-bold">
            Projected Cut-Off: Day {economicCutoffDay} ({daysRemainingToCutoff} days left)
          </div>
        </div>
      </div>

      {/* Row 1: Candidate Optimization Strategies Cards (§10.5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
            Candidate Production Operating Strategies
          </span>
          <span className="text-xs font-mono text-text-muted">
            Select a strategy to evaluate economic waterfall
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategies.map((s) => {
            const isSelected = selectedStrategy?.name === s.name;
            const isRec = s.recommended;

            return (
              <div
                key={s.name}
                onClick={() => setSelectedStrategy(s)}
                className={`p-4 rounded-lg cursor-pointer transition-all border flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-surface-2 border-accent-thermal shadow-glowThermal"
                    : "bg-surface-1 border-line hover:border-text-muted/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display text-sm font-bold text-text-primary">{s.name}</span>
                    {isRec && (
                      <span className="px-2 py-0.5 rounded bg-accent-thermal text-white text-[10px] font-mono font-bold uppercase">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-accent-mechanical font-semibold">{s.label}</div>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{s.rationale}</p>
                </div>

                <div className="p-2.5 rounded bg-surface-0 border border-line grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase">Gross Flow:</span>
                    <div className="font-bold text-text-primary mt-0.5">{s.productionBopd} BOPD</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase">Rod Risk:</span>
                    <div className={`font-bold mt-0.5 ${s.rodRiskPct > 50 ? "text-status-warn" : "text-status-safe"}`}>
                      {s.rodRiskPct}%
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase">Operating Cost:</span>
                    <div className="font-bold text-text-primary mt-0.5">₹{(s.costInrDay / 1000).toFixed(0)}k/d</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase">Daily Net Margin:</span>
                    <div className="font-bold text-status-safe mt-0.5">+₹{(s.netValueInrDay / 1000).toFixed(0)}k/d</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pt-1 border-t border-line">
                  <span>Profile: {s.vfdProfile}</span>
                  <span className="font-bold text-text-primary">{s.spm} SPM</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Pareto Frontier Scatter + Economic Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParetoScatterChart strategies={strategies} height={270} />
        <EconomicWaterfall data={waterfallBreakdown} height={270} />
      </div>

      {/* Row 3: Economic Cut-Off Day Prediction Curve */}
      <div className="space-y-2">
        <TimeSeriesChart
          data={cutoffCurveData}
          title={`Dynamic CSS Cycle Economic Break-Even Cut-Off Trajectory (Break-Even at Day ${economicCutoffDay})`}
          xLabel="CSS Cycle Day (0 - 45)"
          yLabel="Net Daily Operating Margin (₹/day)"
          color="#3FAE6B"
          unit="₹/day"
          height={220}
        />
      </div>
    </div>
  );
}
