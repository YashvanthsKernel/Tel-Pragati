"use client";

import React, { useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FastForward,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";

const CSS_PHASES = [
  { name: "INJECTION", startDay: 0, endDay: 5, color: "bg-rose-500", label: "Steam Injection (195Ã‚Â°C)" },
  { name: "SOAK", startDay: 5, endDay: 10, color: "bg-orange-500", label: "Soaking Phase" },
  { name: "PRODUCTION", startDay: 10, endDay: 28, color: "bg-emerald-500", label: "Peak Production" },
  { name: "COOLING", startDay: 28, endDay: 42, color: "bg-cyan-600", label: "Thermal Decay & Drag" },
  { name: "CYCLE_END", startDay: 42, endDay: 45, color: "bg-slate-500", label: "Economic Cut-Off" },
];

export const TimeMachine: React.FC = () => {
  const {
    simulationDay,
    setSimulationDay,
    isPlayingTimeline,
    toggleTimelinePlay,
    timelineSpeed,
    setTimelineSpeed,
    twinState,
    setDemoScenario,
  } = useTwinStore();

  // Auto-play interval loop
  useEffect(() => {
    if (!isPlayingTimeline) return;

    const interval = setInterval(() => {
      const nextDay = simulationDay >= 45 ? 0 : simulationDay + 0.5 * timelineSpeed;
      setSimulationDay(Number(nextDay.toFixed(1)));
    }, 600);

    return () => clearInterval(interval);
  }, [isPlayingTimeline, simulationDay, timelineSpeed, setSimulationDay]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationDay(parseFloat(e.target.value));
  };

  return (
    <footer className="w-full bg-surface border-t-2 border-slate-300 shadow-panel p-3 select-none sticky bottom-0 z-30">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Top bar: Controls & Day Readout */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          {/* Left: Title and Playback Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-oil-charcoal text-white rounded font-bold">
              <Clock className="w-3.5 h-3.5 text-oil-red" />
              <span>TIME MACHINE</span>
            </div>

            {/* Play/Pause */}
            <button
              onClick={toggleTimelinePlay}
              className={`p-1.5 rounded border transition-colors flex items-center gap-1 font-bold ${
                isPlayingTimeline
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-surface-alt hover:bg-slate-200 text-text-primary border-slate-300"
              }`}
              title={isPlayingTimeline ? "Pause Simulation" : "Auto-advance Timeline"}
            >
              {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{isPlayingTimeline ? "PAUSE" : "PLAY"}</span>
            </button>

            {/* Step Back / Forward */}
            <button
              onClick={() => setSimulationDay(Math.max(0, simulationDay - 1))}
              className="p-1 rounded bg-surface-alt hover:bg-slate-200 border border-slate-300 text-text-primary"
              title="Step Back 1 Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSimulationDay(Math.min(45, simulationDay + 1))}
              className="p-1 rounded bg-surface-alt hover:bg-slate-200 border border-slate-300 text-text-primary"
              title="Step Forward 1 Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Speed toggle */}
            <div className="flex items-center border border-slate-300 rounded overflow-hidden">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setTimelineSpeed(speed)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold ${
                    timelineSpeed === speed
                      ? "bg-oil-red text-white"
                      : "bg-surface text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Center: Current Day Readout & Operating Summary */}
          <div className="flex items-center gap-3 bg-surface-alt px-3 py-1 rounded border border-app-border">
            <span className="text-slate-500 font-medium">CSS CYCLE #04:</span>
            <span className="text-sm font-black text-text-primary">
              DAY {simulationDay.toFixed(1)} / 45
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-semibold">
              BHT: {twinState.bottomholeTemperatureC}Ã‚Â°C
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-semibold">
              Viscosity: {twinState.oilViscosityCentipoise.toLocaleString()} cP
            </span>
            <span className="text-slate-300">|</span>
            <span
              className={`font-bold ${
                twinState.rodFloatingRiskPercent > 60
                  ? "text-oil-red"
                  : twinState.rodFloatingRiskPercent > 40
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              Rod Risk: {twinState.rodFloatingRiskPercent}%
            </span>
          </div>

          {/* Right: Quick Stage Presets */}
          <div className="hidden lg:flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-normal mr-1">Jump to:</span>
            <button
              onClick={() => setDemoScenario("NORMAL_OPERATION")}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700"
            >
              Day 14 (Peak)
            </button>
            <button
              onClick={() => setDemoScenario("COOLING_RESERVOIR")}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700"
            >
              Day 25 (Cooling)
            </button>
            <button
              onClick={() => setDemoScenario("ROD_FLOATING_EVENT")}
              className="px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-oil-red font-semibold"
            >
              Day 35 (Rod Float)
            </button>
            <button
              onClick={() => setDemoScenario("OPTIMAL_CSS_TIMING")}
              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-amber-900 font-semibold"
            >
              Day 41 (Cut-Off)
            </button>
          </div>
        </div>

        {/* Phase Band Track */}
        <div className="relative pt-1">
          {/* Visual Phase segments */}
          <div className="w-full h-3 bg-slate-200 rounded-full flex overflow-hidden border border-slate-300">
            {CSS_PHASES.map((phase) => {
              const widthPct = ((phase.endDay - phase.startDay) / 45) * 100;
              const isCurrent =
                simulationDay >= phase.startDay && simulationDay < phase.endDay;

              return (
                <div
                  key={phase.name}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full ${phase.color} ${
                    isCurrent ? "opacity-100 ring-2 ring-oil-charcoal" : "opacity-40"
                  } transition-opacity duration-200 cursor-pointer`}
                  title={`${phase.name} (Day ${phase.startDay}-${phase.endDay}): ${phase.label}`}
                  onClick={() => setSimulationDay((phase.startDay + phase.endDay) / 2)}
                />
              );
            })}
          </div>

          {/* Interactive Range Input Slider */}
          <input
            type="range"
            min="0"
            max="45"
            step="0.1"
            value={simulationDay}
            onChange={handleSliderChange}
            className="w-full absolute -top-1 left-0 opacity-0 cursor-pointer h-6 z-20"
          />

          {/* Phase Markers and Day Numbers */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>DAY 0 (Steam Inj)</span>
            <span>DAY 5 (Soak)</span>
            <span>DAY 10 (Peak Prod)</span>
            <span>DAY 20</span>
            <span>DAY 30 (Cooling)</span>
            <span>DAY 41 (Cut-Off)</span>
            <span>DAY 45 (End)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
