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
  Target,
  Award,
} from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import { useDataProvider } from "../../../../data/DataProviderContext";
import { OptimizerResult, OptimizerStrategy } from "../../../../data/types";
import { ParetoScatterChart } from "../../../../components/charts/ParetoScatterChart";
import { EconomicWaterfall } from "../../../../components/charts/EconomicWaterfall";
import { TimeSeriesChart } from "../../../../components/charts/TimeSeriesChart";
import { PageHeader } from "../../../../components/ui/PageHeader";

export default function OptimizerPage() {
  const { wellId, wellState } = useWellContext();
  const provider = useDataProvider();

  const [optimizerResult, setOptimizerResult] = useState<OptimizerResult | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizerStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    provider.getOptimizerResult(wellId).then((res) => {
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
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
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

  const recommendedStrategy = strategies.find((s) => s.recommended) || strategies[0];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        wellId={wellId}
        icon={<TrendingUp className="w-5 h-5 text-accent-thermal" />}
        title="Multi-Objective Production & Economic Optimizer"
        subtitle="Pareto Frontier Trade-Off Evaluation · Dynamic Economic Break-Even Cut-Off Solver"
        badge={`Cut-Off: Day ${economicCutoffDay} (${daysRemainingToCutoff}d left)`}
      />

      {/* ── Candidate Operating Strategies ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
            Decision Candidate Strategies & Trade-Off Matrix
          </span>
          <span className="text-xs font-sans text-text-muted">
            Select candidate to evaluate economic breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {strategies.map((s) => {
            const isSelected = selectedStrategy?.name === s.name;
            const isRec = s.recommended;

            return (
              <div
                key={s.name}
                onClick={() => setSelectedStrategy(s)}
                className={`p-4 rounded-lg cursor-pointer transition-all border flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-surface-1 border-accent-mechanical shadow-card"
                    : "bg-surface-1 border-line hover:border-line-strong"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-sans text-sm font-bold text-text-primary">{s.name}</span>
                    {isRec ? (
                      <span className="px-2 py-0.5 rounded bg-status-safe/10 text-status-safe border border-status-safe/30 text-[10px] font-sans font-bold uppercase">
                        Recommended
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-text-muted">Candidate</span>
                    )}
                  </div>
                  <div className="text-xs text-accent-mechanical font-semibold font-sans">{s.label}</div>
                  <p className="text-[11px] font-sans text-text-secondary mt-1 leading-relaxed">{s.rationale}</p>
                </div>

                <div className="p-2.5 rounded bg-surface-0 border border-line grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] font-sans text-text-muted uppercase">Gross Flow:</span>
                    <div className="font-bold text-text-primary mt-0.5 tabular-nums">{s.productionBopd} BOPD</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-text-muted uppercase">Rod Risk:</span>
                    <div className={`font-bold mt-0.5 tabular-nums ${s.rodRiskPct > 50 ? "text-status-warn" : "text-status-safe"}`}>
                      {s.rodRiskPct}%
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-text-muted uppercase">Op Cost:</span>
                    <div className="font-bold text-text-primary mt-0.5 tabular-nums">₹{(s.costInrDay / 1000).toFixed(0)}k/d</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-text-muted uppercase">Net Margin:</span>
                    <div className="font-bold text-status-safe mt-0.5 tabular-nums">+₹{(s.netValueInrDay / 1000).toFixed(0)}k/d</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-sans text-text-muted pt-1 border-t border-line">
                  <span className="truncate">Profile: {s.vfdProfile}</span>
                  <span className="font-mono font-bold text-text-primary ml-2 flex-shrink-0">{s.spm} SPM</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pareto Frontier & Economic Waterfall ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParetoScatterChart strategies={strategies} height={270} />
        <EconomicWaterfall data={waterfallBreakdown} height={270} />
      </div>

      {/* ── Economic Cut-Off Trajectory ── */}
      <div className="space-y-2">
        <TimeSeriesChart
          data={cutoffCurveData}
          title={`Dynamic CSS Cycle Economic Break-Even Cut-Off Trajectory (Break-Even Day ${economicCutoffDay})`}
          xLabel="CSS Cycle Day (0 - 45)"
          yLabel="Net Daily Operating Margin (₹/day)"
          color="var(--status-safe)"
          unit="₹/day"
          height={220}
        />
      </div>
    </div>
  );
}
