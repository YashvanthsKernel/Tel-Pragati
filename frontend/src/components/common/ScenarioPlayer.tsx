"use client";

import React from "react";
import { Play, Pause, FastForward, RotateCcw, Sliders } from "lucide-react";
import { useTimeMachineStore } from "../../state/useTimeMachineStore";
import { DEMO_SCENARIOS } from "../../data/demo/DemoDataProvider";
import { PhaseTimeline } from "./PhaseTimeline";

export function ScenarioPlayer({ showTimeline = true }: { showTimeline?: boolean }) {
  const {
    activeScenarioId,
    currentDay,
    isPlaying,
    speed,
    setScenarioId,
    setDay,
    togglePlay,
    setSpeed,
  } = useTimeMachineStore();

  const activeScenario = DEMO_SCENARIOS.find((s) => s.id === activeScenarioId) || DEMO_SCENARIOS[0];

  return (
    <div className="p-3.5 rounded-lg bg-surface-1 border border-line shadow-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-accent-thermal/10 text-accent-thermal border border-accent-thermal/30">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
              Time Machine · Scenario Player
            </span>
            <div className="text-[10px] font-mono text-text-muted">
              Drives 2D charts and 3D Wellbore in synchronized lockstep
            </div>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-surface-0 p-0.5 rounded border border-line">
          {([1, 2, 5] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                speed === s
                  ? "bg-surface-2 text-accent-mechanical border border-line"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Preset Scenarios Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {DEMO_SCENARIOS.map((scn) => {
          const isSelected = activeScenarioId === scn.id;
          return (
            <button
              key={scn.id}
              type="button"
              onClick={() => setScenarioId(scn.id)}
              className={`p-2 rounded text-left transition-all border ${
                isSelected
                  ? "bg-surface-2 border-accent-thermal text-text-primary shadow-glowThermal"
                  : "bg-surface-0 border-line text-text-muted hover:border-text-muted/40 hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-accent-thermal">
                  {scn.badge}
                </span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent-thermal" />}
              </div>
              <div className="text-xs font-semibold text-text-primary line-clamp-1 mt-0.5">
                {scn.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Scrubber & Timeline Bar */}
      {showTimeline && (
        <PhaseTimeline
          currentDay={currentDay}
          totalDays={45}
          onScrub={(day) => setDay(day)}
        />
      )}

      {/* Transport Controls & Scrub Slider */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={togglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isPlaying
              ? "bg-status-warn text-surface-0 font-bold"
              : "bg-accent-mechanical text-surface-0 font-bold hover:bg-accent-mechanical/90"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setDay(0)}
          className="p-1.5 rounded bg-surface-2 border border-line text-text-muted hover:text-text-primary transition-colors"
          title="Reset to Day 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="45"
            step="0.5"
            value={currentDay}
            onChange={(e) => setDay(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-surface-0 rounded-lg appearance-none cursor-pointer accent-accent-mechanical"
          />
          <span className="font-mono text-xs text-text-primary font-bold min-w-[3.5rem] text-right">
            D{currentDay.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
