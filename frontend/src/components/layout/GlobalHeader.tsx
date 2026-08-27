"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  ChevronDown,
  Cpu,
  Layers,
  MapPin,
  RefreshCw,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { DemoScenarioId } from "../../types/twin";

const NAV_ITEMS = [
  { label: "TWIN", href: "/twin" },
  { label: "PHYSICS", href: "/physics" },
  { label: "DIAGNOSTICS", href: "/diagnostics" },
  { label: "SIMULATOR", href: "/simulator" },
  { label: "OPTIMIZER", href: "/optimizer" },
  { label: "CONTROL", href: "/control" },
];

export const GlobalHeader: React.FC = () => {
  const pathname = usePathname() || "/twin";
  const {
    selectedWellId,
    activeAlerts,
    setAlertDrawerOpen,
    setFieldOverviewOpen,
    demoScenario,
    setDemoScenario,
    twinState,
  } = useTwinStore();

  const unackAlerts = activeAlerts.filter((a) => !a.isAcknowledged).length;

  return (
    <header className="w-full bg-surface border-b border-app-border sticky top-0 z-40 select-none">
      {/* Topmost Brand & Status Strip */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 text-xs">
        {/* Left: OIL Corporate Brand & MoPNG Gov Accent */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 px-2.5 bg-oil-red text-white font-black font-sans tracking-tighter flex items-center justify-center rounded text-sm shadow-sm">
              OIL
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-oil-charcoal tracking-tight font-mono text-xs">
                OIL INDIA LIMITED
              </span>
              <span className="text-[10px] text-text-secondary font-mono -mt-0.5">
                Baghewala Heavy Oil Digital Twin • MoPNG GoI
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Government of India Restrained Accent */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-goi-saffron" />
            <span className="w-1.5 h-1.5 rounded-full bg-white border border-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-goi-green" />
            <span className="font-medium ml-1">SIH-2026 • MoPNG #1789</span>
          </div>
        </div>

        {/* Center: Selected Well Context & Quick Field Switcher */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setFieldOverviewOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-alt hover:bg-slate-200 border border-app-border text-xs font-mono font-semibold text-text-primary transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-oil-red" />
            <span>Well: {selectedWellId}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          <span className="text-slate-300">|</span>

          <span className="text-xs font-mono text-text-secondary">
            CSS Cycle: <strong className="text-text-primary">#04</strong>
          </span>
        </div>

        {/* Right: Telemetry Mode Badge, Demo Preset, Alerts Trigger */}
        <div className="flex items-center gap-2">
          {/* Explicit DEMO MODE Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700 font-bold" title="Digital Twin Prototype: Synthetic & Replay Telemetry Ingestion">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>DEMO MODE: Synthetic Telemetry</span>
          </div>

          {/* Scenario Preset Selector */}
          <div className="flex items-center gap-1 bg-amber-50/70 border border-amber-200 rounded px-2 py-0.5 text-[11px] font-mono text-amber-900">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <select
              value={demoScenario}
              onChange={(e) => setDemoScenario(e.target.value as DemoScenarioId)}
              className="bg-transparent text-amber-950 font-bold outline-none cursor-pointer text-[11px]"
            >
              <option value="NORMAL_OPERATION">Scenario 1: Normal Ops (D14)</option>
              <option value="COOLING_RESERVOIR">Scenario 2: Cooling Phase (D25)</option>
              <option value="ROD_FLOATING_EVENT">Scenario 3: Rod Floating (D35)</option>
              <option value="OPTIMAL_CSS_TIMING">Scenario 4: CSS Cut-Off (D41)</option>
              <option value="ENERGY_OPTIMIZATION">Scenario 5: Energy Min (D18)</option>
            </select>
          </div>

          {/* Alerts Trigger Button */}
          <button
            onClick={() => setAlertDrawerOpen(true)}
            className={`relative flex items-center gap-1 px-2.5 py-1 rounded border font-mono text-xs font-semibold transition-colors ${
              unackAlerts > 0
                ? "bg-red-50 hover:bg-red-100 text-oil-red border-red-300"
                : "bg-surface-alt hover:bg-slate-200 text-text-secondary border-app-border"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>ALERTS</span>
            {unackAlerts > 0 && (
              <span className="px-1.5 py-0.2 bg-oil-red text-white text-[10px] font-bold rounded-full">
                {unackAlerts}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Workstation Navigation Bar */}
      <div className="px-4 flex items-center justify-between">
        <nav className="flex items-center gap-1 py-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === "/twin" && pathname === "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider transition-all ${
                  isActive
                    ? "bg-oil-charcoal text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-alt"
                }`}
              >
                [{item.label}]
              </Link>
            );
          })}
        </nav>

        {/* Workstation Health & Ingestion Pipeline Readout */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>ThermalTwin Core v0.8.4</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-semibold">
            Health: {twinState.confidence.overall}%
          </span>
        </div>
      </div>
    </header>
  );
};
