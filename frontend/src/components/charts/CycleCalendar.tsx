"use client";

import React, { useState } from "react";
import { WellSummary } from "../../data/types";
import { Flame, Clock, Droplets, Zap, Wrench, Activity, CheckCircle2, ChevronRight, BarChart3, Calendar } from "lucide-react";

interface CycleCalendarProps {
  wellId?: string;
  year?: number;
  wells?: WellSummary[];
}

interface PhaseDetail {
  name: string;
  days: number;
  color: string;
  textColor: string;
  bgSoft: string;
  borderColor: string;
  icon: any;
  summary: string;
  targetTemp: string;
  spmRange: string;
  flowImpact: string;
}

const PHASES: Record<string, PhaseDetail> = {
  inject: {
    name: "Steam Injection",
    days: 5,
    color: "#C65B32",
    textColor: "text-accent-thermal",
    bgSoft: "bg-accent-thermal/15",
    borderColor: "border-accent-thermal/40",
    icon: Flame,
    summary: "High-enthalpy saturated steam (240°C, 80% quality) injected at 1,850 psi to heat heavy crude.",
    targetTemp: "210°C – 240°C",
    spmRange: "0 SPM (Shut-In)",
    flowImpact: "Thermal Reservoir Charging",
  },
  soak: {
    name: "Thermal Heat Soak",
    days: 5,
    color: "#B77A08",
    textColor: "text-status-warn",
    bgSoft: "bg-status-warn/15",
    borderColor: "border-status-warn/40",
    icon: Clock,
    summary: "Well shut in to allow conductive and convective thermal diffusion through Jodhpur Sandstone pay zone.",
    targetTemp: "190°C – 210°C",
    spmRange: "0 SPM (Shut-In)",
    flowImpact: "Viscosity Reduction to <80 cP",
  },
  produce: {
    name: "Peak Oil Production",
    days: 28,
    color: "#238B57",
    textColor: "text-status-safe",
    bgSoft: "bg-status-safe/15",
    borderColor: "border-status-safe/40",
    icon: Droplets,
    summary: "Sucker rod beam pump active at nominal speed. High thermal inflow yields peak oil production.",
    targetTemp: "140°C – 190°C",
    spmRange: "4.8 – 5.8 SPM",
    flowImpact: "650 – 820 BOPD Peak Recovery",
  },
  cooling: {
    name: "Annular Cooling & VFD Damping",
    days: 7,
    color: "#00B4A0",
    textColor: "text-accent-mechanical",
    bgSoft: "bg-accent-mechanical/15",
    borderColor: "border-accent-mechanical/40",
    icon: Zap,
    summary: "Reservoir cools below 120°C; viscosity rises. VFD downstroke velocity damping (-17%) prevents rod floating.",
    targetTemp: "90°C – 140°C",
    spmRange: "3.8 – 4.5 SPM (Asymmetric)",
    flowImpact: "380 – 520 BOPD (Risk Guarded)",
  },
  turnaround: {
    name: "Turnaround & Maintenance",
    days: 30,
    color: "#5A6572",
    textColor: "text-text-muted",
    bgSoft: "bg-surface-2",
    borderColor: "border-line",
    icon: Wrench,
    summary: "Inter-cycle surface facility inspection, valve seating overhaul, and steam generator redistribution.",
    targetTemp: "Ambient / 65°C",
    spmRange: "Standby / Low SPM",
    flowImpact: "Facility Turnaround",
  },
};

interface AnnualCycle {
  cycleNum: number;
  dateRange: string;
  quarter: string;
  status: "completed" | "active" | "scheduled";
  currentDayInCycle?: number;
  steamBbl: number;
  expectedBopd: number;
}

export function CycleCalendar({ wellId: initialWellId = "BGW-08", year = 2026, wells = [] }: CycleCalendarProps) {
  const [activeWellId, setActiveWellId] = useState<string>(initialWellId);
  const [selectedPhaseKey, setSelectedPhaseKey] = useState<string>("produce");
  const [activeTab, setActiveTab] = useState<"gantt" | "profile">("gantt");

  const annualCycles: AnnualCycle[] = [
    {
      cycleNum: 1,
      dateRange: "02 Jan – 18 Mar",
      quarter: "Q1 Cycle",
      status: "completed",
      steamBbl: 3500,
      expectedBopd: 740,
    },
    {
      cycleNum: 2,
      dateRange: "19 Mar – 02 Jun",
      quarter: "Q1–Q2 Cycle",
      status: "completed",
      steamBbl: 3500,
      expectedBopd: 710,
    },
    {
      cycleNum: 3,
      dateRange: "03 Jun – 17 Aug",
      quarter: "Q2–Q3 Cycle",
      status: "completed",
      steamBbl: 3500,
      expectedBopd: 690,
    },
    {
      cycleNum: 4,
      dateRange: "18 Aug – 01 Nov",
      quarter: "Q3–Q4 Cycle",
      status: "active",
      currentDayInCycle: 25, // Current Day in cycle (Day 25 = Production phase)
      steamBbl: 3500,
      expectedBopd: 680,
    },
    {
      cycleNum: 5,
      dateRange: "02 Nov – 15 Jan",
      quarter: "Q4–Q1 Cycle",
      status: "scheduled",
      steamBbl: 3500,
      expectedBopd: 660,
    },
  ];

  const selectedPhase = PHASES[selectedPhaseKey] || PHASES.produce;

  return (
    <div className="w-full bg-surface-1 border border-line rounded-lg p-4 shadow-card select-none space-y-4">
      {/* ── 1. Header with Well Selector and View Mode ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-thermal" />
            <h3 className="font-sans text-sm font-bold text-text-primary uppercase tracking-wide">
              Annual CSS Cycle & Turnaround Schedule ({year})
            </h3>
          </div>
          <p className="text-xs font-sans text-text-secondary mt-0.5">
            Cyclic Steam Stimulation Lifecycle Timeline · Jodhpur Heavy Oil Recovery
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Well picker */}
          {wells.length > 0 ? (
            <select
              value={activeWellId}
              onChange={(e) => setActiveWellId(e.target.value)}
              className="bg-surface-0 border border-line rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
            >
              {wells.map((w) => (
                <option key={w.wellId} value={w.wellId}>
                  {w.name} ({w.padId})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-mono font-bold text-accent-mechanical bg-surface-2 px-2.5 py-1 rounded border border-line">
              {activeWellId}
            </span>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-surface-0 p-0.5 rounded border border-line text-xs font-sans">
            <button
              type="button"
              onClick={() => setActiveTab("gantt")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === "gantt"
                  ? "bg-accent-mechanical text-surface-0 font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Lifecycle Timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === "profile"
                  ? "bg-accent-mechanical text-surface-0 font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              75-Day Phase Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Annual Overview KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded bg-surface-0 border border-line">
          <span className="text-[10px] font-sans text-text-muted uppercase">Annual Steam Quota:</span>
          <div className="font-mono text-sm font-bold text-accent-thermal mt-0.5 tabular-nums">17,500 bbl</div>
          <div className="text-[10px] font-sans text-text-muted mt-0.5">5 Cyl x 3,500 bbl</div>
        </div>

        <div className="p-2.5 rounded bg-surface-0 border border-line">
          <span className="text-[10px] font-sans text-text-muted uppercase">Annual Production Est:</span>
          <div className="font-mono text-sm font-bold text-status-safe mt-0.5 tabular-nums">128,400 bbl</div>
          <div className="text-[10px] font-sans text-text-muted mt-0.5">Avg 696 BOPD / active day</div>
        </div>

        <div className="p-2.5 rounded bg-surface-0 border border-line">
          <span className="text-[10px] font-sans text-text-muted uppercase">Current Phase State:</span>
          <div className="font-mono text-sm font-bold text-accent-mechanical mt-0.5">Cycle #4 · Day 25</div>
          <div className="text-[10px] font-sans text-status-safe font-semibold mt-0.5">● Peak Production Phase</div>
        </div>

        <div className="p-2.5 rounded bg-surface-0 border border-line">
          <span className="text-[10px] font-sans text-text-muted uppercase">Operating Factor:</span>
          <div className="font-mono text-sm font-bold text-text-primary mt-0.5 tabular-nums">91.4% Uptime</div>
          <div className="text-[10px] font-sans text-text-muted mt-0.5">Turnaround on schedule</div>
        </div>
      </div>

      {/* ── 3. Main View: Gantt Lifecycle Timeline ── */}
      {activeTab === "gantt" ? (
        <div className="space-y-3 pt-1">
          <div className="space-y-2.5">
            {annualCycles.map((cycle) => {
              const isActive = cycle.status === "active";
              const isCompleted = cycle.status === "completed";

              return (
                <div
                  key={cycle.cycleNum}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive
                      ? "bg-surface-0 border-accent-mechanical/60 shadow-card"
                      : "bg-surface-0/60 border-line hover:border-line-strong"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text-primary">
                        CSS Cycle #{cycle.cycleNum}
                      </span>
                      <span className="text-text-muted text-xs">·</span>
                      <span className="font-sans text-xs text-text-secondary">{cycle.quarter}</span>
                      <span className="text-text-muted text-xs">({cycle.dateRange})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          isActive
                            ? "bg-accent-mechanical/15 text-accent-mechanical border-accent-mechanical/40 animate-pulse"
                            : isCompleted
                            ? "bg-status-safe/15 text-status-safe border-status-safe/30"
                            : "bg-surface-2 text-text-muted border-line"
                        }`}
                      >
                        {isActive ? `● ACTIVE (Day ${cycle.currentDayInCycle})` : isCompleted ? "COMPLETED" : "SCHEDULED"}
                      </span>
                    </div>
                  </div>

                  {/* 75-Day Proportional Segmented Progress Strip */}
                  <div className="relative h-6 w-full bg-surface-2 rounded overflow-hidden flex items-center border border-line">
                    {/* Phase 1: Steam Injection (5d = 6.6%) */}
                    <div
                      style={{ width: "6.6%" }}
                      onClick={() => setSelectedPhaseKey("inject")}
                      title="Phase 1: Steam Injection (Days 1–5)"
                      className="h-full bg-accent-thermal hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center border-r border-surface-0/40"
                    >
                      <span className="text-[9px] font-mono text-surface-0 font-bold hidden sm:inline">5d</span>
                    </div>

                    {/* Phase 2: Thermal Soak (5d = 6.6%) */}
                    <div
                      style={{ width: "6.6%" }}
                      onClick={() => setSelectedPhaseKey("soak")}
                      title="Phase 2: Thermal Soak (Days 6–10)"
                      className="h-full bg-status-warn hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center border-r border-surface-0/40"
                    >
                      <span className="text-[9px] font-mono text-surface-0 font-bold hidden sm:inline">5d</span>
                    </div>

                    {/* Phase 3: Production (28d = 37.3%) */}
                    <div
                      style={{ width: "37.3%" }}
                      onClick={() => setSelectedPhaseKey("produce")}
                      title="Phase 3: Peak Heavy Oil Production (Days 11–38)"
                      className="h-full bg-status-safe hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center border-r border-surface-0/40"
                    >
                      <span className="text-[10px] font-mono text-surface-0 font-bold">28d Peak Production</span>
                    </div>

                    {/* Phase 4: Cooling & VFD Damping (7d = 9.3%) */}
                    <div
                      style={{ width: "9.3%" }}
                      onClick={() => setSelectedPhaseKey("cooling")}
                      title="Phase 4: Annular Cooling & VFD Damping (Days 39–45)"
                      className="h-full bg-accent-mechanical hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center border-r border-surface-0/40"
                    >
                      <span className="text-[9px] font-mono text-surface-0 font-bold hidden sm:inline">7d</span>
                    </div>

                    {/* Phase 5: Turnaround (30d = 40.2%) */}
                    <div
                      style={{ width: "40.2%" }}
                      onClick={() => setSelectedPhaseKey("turnaround")}
                      title="Phase 5: Turnaround & Maintenance (Days 46–75)"
                      className="h-full bg-surface-3 hover:bg-line transition-colors cursor-pointer flex items-center justify-center text-text-muted"
                    >
                      <span className="text-[10px] font-mono">30d Turnaround</span>
                    </div>

                    {/* Active day needle indicator */}
                    {isActive && cycle.currentDayInCycle && (
                      <div
                        style={{ left: `${(cycle.currentDayInCycle / 75) * 100}%` }}
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-glowMechanical z-10 flex flex-col items-center justify-center"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-accent-mechanical transform -translate-y-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Phase Inspector Card */}
          <div className="p-3.5 rounded-lg bg-surface-0 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans mt-3">
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded ${selectedPhase.bgSoft} ${selectedPhase.textColor}`}>
                {React.createElement(selectedPhase.icon, { className: "w-4 h-4" })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary text-xs">{selectedPhase.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${selectedPhase.bgSoft} ${selectedPhase.textColor} ${selectedPhase.borderColor}`}>
                    {selectedPhase.days} Days Duration
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{selectedPhase.summary}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-line pt-2 sm:pt-0 sm:pl-4 flex-shrink-0">
              <div>
                <span className="text-[10px] font-sans text-text-muted uppercase">Target Temp:</span>
                <div className="font-bold text-accent-thermal mt-0.5">{selectedPhase.targetTemp}</div>
              </div>
              <div>
                <span className="text-[10px] font-sans text-text-muted uppercase">Operating SPM:</span>
                <div className="font-bold text-accent-mechanical mt-0.5">{selectedPhase.spmRange}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── 4. Alternative View: 75-Day Phase Progression Profile ── */
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
          {Object.entries(PHASES).map(([key, p]) => (
            <div
              key={key}
              onClick={() => setSelectedPhaseKey(key)}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                selectedPhaseKey === key
                  ? `${p.bgSoft} ${p.borderColor} shadow-card`
                  : "bg-surface-0 border-line hover:border-line-strong"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className={`p-1.5 rounded ${p.bgSoft} ${p.textColor}`}>
                    {React.createElement(p.icon, { className: "w-3.5 h-3.5" })}
                  </div>
                  <span className="font-mono text-xs font-bold text-text-primary">{p.days}d</span>
                </div>
                <h4 className="font-sans font-bold text-xs text-text-primary mt-1">{p.name}</h4>
                <p className="text-[11px] font-sans text-text-secondary mt-1 line-clamp-3 leading-relaxed">{p.summary}</p>
              </div>

              <div className="pt-2 border-t border-line/60 text-[10px] font-mono space-y-1">
                <div className="text-accent-thermal font-bold">{p.targetTemp}</div>
                <div className="text-text-muted">{p.flowImpact}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 5. Standardized Color Legend ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line text-xs font-sans text-text-secondary">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setSelectedPhaseKey("inject")}>
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-thermal" />
            <span className="text-[11px] font-medium">Injection (5d)</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setSelectedPhaseKey("soak")}>
            <span className="w-2.5 h-2.5 rounded-sm bg-status-warn" />
            <span className="text-[11px] font-medium">Thermal Soak (5d)</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setSelectedPhaseKey("produce")}>
            <span className="w-2.5 h-2.5 rounded-sm bg-status-safe" />
            <span className="text-[11px] font-medium">Peak Production (28d)</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setSelectedPhaseKey("cooling")}>
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-mechanical" />
            <span className="text-[11px] font-medium">VFD Damping (7d)</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setSelectedPhaseKey("turnaround")}>
            <span className="w-2.5 h-2.5 rounded-sm bg-surface-3 border border-line" />
            <span className="text-[11px] font-medium">Turnaround (30d)</span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-text-muted">
          Standard 75-Day Cyclic Steam Turnaround
        </span>
      </div>
    </div>
  );
}
