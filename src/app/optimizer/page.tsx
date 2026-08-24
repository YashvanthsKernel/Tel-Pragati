"use client";

import React from "react";
import { Cpu, Gauge, IndianRupee, TrendingUp } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { EconomicCutoffPlot } from "../../components/charts/EconomicCutoffPlot";
import { ParetoStrategyPlot } from "../../components/charts/ParetoStrategyPlot";
import { StatusPill } from "../../components/ui/StatusPill";

export default function OptimizerPage() {
  const { twinState, simulationDay } = useTwinStore();
  const strategies = twinState.strategies;
  const recommendedStrategy = twinState.currentStrategy;

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-oil-charcoal text-white flex items-center justify-center font-bold">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">
              Operating Strategy Optimizer
            </h1>
            <p className="text-xs text-text-secondary font-mono">
              Multi-Objective Pareto Frontier & Economic CSS Cut-off Analyzer (INR Economics)
            </p>
          </div>
        </div>

        <StatusPill variant="SIMULATED" size="sm" />
      </div>

      {/* Top Banner: Dynamically Evaluated Strategy Rationale */}
      <div className="p-4 bg-surface rounded-md border-2 border-oil-red/60 shadow-panel space-y-1 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-oil-red uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            Dynamic Optimization Winner: {recommendedStrategy.name} ({recommendedStrategy.tagline})
          </span>
          <span className="text-[10px] font-bold bg-red-50 text-oil-red px-2 py-0.5 rounded border border-red-200">
            Score: {Math.round(recommendedStrategy.score)} pts
          </span>
        </div>
        <p className="text-xs text-slate-800 font-sans leading-relaxed">
          {recommendedStrategy.recommendationRationale}
        </p>
      </div>

      {/* 3 Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 rounded-md border space-y-3 transition-all ${
              strategy.isRecommended
                ? "bg-surface border-oil-red ring-2 ring-oil-red/30 shadow-md"
                : "bg-surface-alt border-app-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-text-primary">{strategy.name}</span>
              {strategy.isRecommended && (
                <span className="text-[10px] font-bold text-white bg-oil-red px-2 py-0.5 rounded">
                  RECOMMENDED
                </span>
              )}
            </div>

            <p className="text-[11px] text-text-secondary font-sans">{strategy.tagline}</p>

            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Production:</span>
                <strong className="text-text-primary">{strategy.productionBopd} BOPD</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lifting Energy:</span>
                <strong className="text-text-primary">{strategy.energyKwhPerDay} kWh/day</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rod Risk:</span>
                <strong className={strategy.rodFloatingRiskPercent > 50 ? "text-oil-red font-bold" : "text-emerald-700"}>
                  {strategy.rodFloatingRiskPercent}%
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Operating Cost:</span>
                <strong className="text-slate-800">₹{(strategy.dailyOperatingCostInr / 1000).toFixed(0)}k/day</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">Net Economic Value:</span>
                <strong className="text-emerald-700">₹{(strategy.dailyNetRevenueInr / 100000).toFixed(2)} Lakh/day</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid of 2 Charts: Pareto Frontier & Economic Cut-off */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pareto Frontier Plot */}
        <ParetoStrategyPlot strategies={strategies} />

        {/* Economic Cut-off Plot */}
        <EconomicCutoffPlot
          currentDay={simulationDay}
          curve={twinState.economics.curve}
          projectedCutoffDay={twinState.economics.projectedCutoffDay}
        />
      </div>
    </div>
  );
}
