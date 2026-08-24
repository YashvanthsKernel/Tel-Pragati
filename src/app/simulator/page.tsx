"use client";

import React, { useState } from "react";
import { ArrowRight, IndianRupee, Play, Sliders, Sparkles } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { StatusPill } from "../../components/ui/StatusPill";

export default function SimulatorPage() {
  const { twinState, scenarioConfig, setScenarioConfig } = useTwinStore();

  const [steamVolume, setSteamVolume] = useState(scenarioConfig.steamVolumeBbl);
  const [soakDays, setSoakDays] = useState(scenarioConfig.soakDays);
  const [targetSpm, setTargetSpm] = useState(scenarioConfig.nominalSpm);
  const [downstrokeDamping, setDownstrokeDamping] = useState(scenarioConfig.downstrokeDampingPercent);

  // Counterfactual Scenario Computations
  const scenarioBopd = Math.round(twinState.estimatedNetBopd * (1 + (steamVolume - 3200) / 10000 + (targetSpm - 5.2) * 0.08));
  const scenarioEnergy = Math.round(twinState.dailyEnergyKwh * (1 - (downstrokeDamping / 100) * 0.5));
  const scenarioRisk = Math.max(12, Math.round(twinState.rodFloatingRiskPercent * (1 - downstrokeDamping / 40)));
  const scenarioGrossRevInr = scenarioBopd * scenarioConfig.crudePriceInrPerBbl;
  const scenarioCostInr = Math.round(89000 * (1 + (targetSpm - 5.2) * 0.05 - (downstrokeDamping / 100) * 0.1));
  const scenarioNetValueInr = scenarioGrossRevInr - scenarioCostInr;

  const handleApplyToTwin = () => {
    setScenarioConfig({
      steamVolumeBbl: steamVolume,
      soakDays,
      nominalSpm: targetSpm,
      downstrokeDampingPercent: downstrokeDamping,
    });
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-oil-charcoal text-white flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">
              What-If Scenario Lab
            </h1>
            <p className="text-xs text-text-secondary font-mono">
              Counterfactual Simulation & Sensitivity Engine (SIMULATED)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill variant="SIMULATED" size="sm" />
          <button
            onClick={handleApplyToTwin}
            className="px-3 py-1 bg-oil-red hover:bg-oil-redDark text-white text-xs font-mono font-bold rounded transition-colors shadow-sm"
          >
            Apply Scenario to Twin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Parameter Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-md border border-app-border p-4 space-y-4 font-mono">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider block border-b border-slate-100 pb-2">
            Adjustable Operating Parameters
          </span>

          {/* Steam Volume */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Steam Injection Volume:</span>
              <strong className="text-text-primary">{steamVolume.toLocaleString()} bbl</strong>
            </div>
            <input
              type="range"
              min="2000"
              max="5000"
              step="100"
              value={steamVolume}
              onChange={(e) => setSteamVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Soak Days */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Soaking Duration:</span>
              <strong className="text-text-primary">{soakDays} Days</strong>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={soakDays}
              onChange={(e) => setSoakDays(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* SPM */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Pumping Speed (SPM):</span>
              <strong className="text-text-primary">{targetSpm} SPM</strong>
            </div>
            <input
              type="range"
              min="2.5"
              max="8.0"
              step="0.1"
              value={targetSpm}
              onChange={(e) => setTargetSpm(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Downstroke Velocity Damping */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">VFD Downstroke Deceleration:</span>
              <strong className="text-oil-red font-bold">-{downstrokeDamping}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={downstrokeDamping}
              onChange={(e) => setDownstrokeDamping(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Live Comparison Matrix & Causal Impact (7 cols) */}
        <div className="lg:col-span-7 space-y-4 font-mono">
          {/* Comparison Table */}
          <div className="bg-surface rounded-md border border-app-border p-4 space-y-3">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider block border-b border-slate-100 pb-2">
              Live Scenario Comparison Matrix (INR Economics)
            </span>

            <div className="border border-app-border rounded-md overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-surface-alt p-2.5 font-bold border-b border-app-border text-slate-700">
                <span>Engineering Metric</span>
                <span className="text-center">Current Base</span>
                <span className="text-center text-oil-red">Simulated Scenario</span>
              </div>

              <div className="grid grid-cols-3 p-2.5 border-b border-slate-100">
                <span className="text-slate-600">Net Oil Production</span>
                <span className="text-center font-bold">{twinState.estimatedNetBopd} BOPD</span>
                <span className="text-center font-bold text-emerald-700">{scenarioBopd} BOPD</span>
              </div>

              <div className="grid grid-cols-3 p-2.5 border-b border-slate-100">
                <span className="text-slate-600">Daily Lifting Energy</span>
                <span className="text-center font-bold">{twinState.dailyEnergyKwh} kWh</span>
                <span className="text-center font-bold text-emerald-700">{scenarioEnergy} kWh</span>
              </div>

              <div className="grid grid-cols-3 p-2.5 border-b border-slate-100">
                <span className="text-slate-600">Rod-Floating Risk</span>
                <span className="text-center font-bold text-oil-red">{twinState.rodFloatingRiskPercent}%</span>
                <span className="text-center font-bold text-emerald-700">{scenarioRisk}%</span>
              </div>

              <div className="grid grid-cols-3 p-2.5">
                <span className="text-slate-600">Net Economic Value</span>
                <span className="text-center font-bold">₹{twinState.economics.dailyNetMarginInr.toLocaleString()}/d</span>
                <span className="text-center font-bold text-emerald-700">₹{scenarioNetValueInr.toLocaleString()}/d</span>
              </div>
            </div>
          </div>

          {/* Causal Chain Note */}
          <div className="p-3 bg-surface-alt rounded-md border border-app-border text-xs text-slate-700 space-y-1 font-sans">
            <strong className="font-mono text-[11px] text-oil-charcoal uppercase block">
              Simulated Causal Impact Flow:
            </strong>
            <p>
              Modulating VFD downstroke by -{downstrokeDamping}% reduces peak compressive load, eliminating rod float while maintaining {scenarioBopd} BOPD production and generating ₹{scenarioNetValueInr.toLocaleString()}/day net economic value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
