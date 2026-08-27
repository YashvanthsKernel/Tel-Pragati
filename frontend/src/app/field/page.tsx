"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Flame,
  Layers,
  MapPin,
  TrendingUp,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useDataProvider } from "../../data/DataProviderContext";
import { AlertItem, FleetSummary, WellSummary } from "../../data/types";
import { StatCard } from "../../components/cards/StatCard";
import { WellSummaryCard } from "../../components/cards/WellSummaryCard";
import { TreemapChart } from "../../components/charts/TreemapChart";
import { DonutChart } from "../../components/charts/DonutChart";

export default function FleetOverviewPage() {
  const router = useRouter();
  const provider = useDataProvider();

  const [fleetSummary, setFleetSummary] = useState<FleetSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsLoading(true);
    Promise.all([provider.getFleetSummary(), provider.getAlerts()])
      .then(([summary, alertList]) => {
        setFleetSummary(summary);
        setAlerts(alertList);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load fleet data", err);
        setIsLoading(false);
      });
  }, [provider]);

  const wells = fleetSummary?.wells || [];
  const kpis = fleetSummary?.fieldKpis || {
    totalBopd: 5980,
    avgSorTrailing30d: 6.8,
    activeAlerts: 3,
    wellsInAlarm: 1,
  };

  const filteredWells = wells.filter((w) => {
    const matchesStatus = statusFilter === "ALL" || w.status === statusFilter;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.padId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-safe animate-pulse-subtle" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Fleet Operations & Telemetry Overview
            </h1>
          </div>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Baghewala Field (PML Lease) · Jodhpur Sandstone Heavy Oil Development · Rajasthan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/field/map"
            className="px-3 py-1.5 rounded bg-surface-1 hover:bg-surface-2 border border-line text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-accent-mechanical" />
            <span>Interactive Fleet Map</span>
          </Link>
          <Link
            href="/field/reports"
            className="px-3 py-1.5 rounded bg-accent-thermal text-white text-xs font-medium hover:bg-accent-thermal/90 transition-colors shadow-glowThermal"
          >
            Analytics & Reports
          </Link>
        </div>
      </div>

      {/* Row 1: 4 Top Stat Cards (§9.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Field Gross Production"
          value={kpis.totalBopd.toLocaleString()}
          unit="BOPD"
          trendPct={3.4}
          variant="mechanical"
          sparklineData={[5400, 5600, 5800, 5750, 5900, 5980]}
          subtext="12 Active Producing Wells"
          isLoading={isLoading}
        />
        <StatCard
          label="Avg SOR (Trailing 30d)"
          value={kpis.avgSorTrailing30d.toFixed(1)}
          unit="bbl/bbl"
          trendPct={-1.8}
          variant="thermal"
          sparklineData={[7.4, 7.2, 7.0, 6.9, 6.8]}
          subtext="Cumulative Steam Efficiency"
          isLoading={isLoading}
        />
        <StatCard
          label="Active Engineering Alerts"
          value={kpis.activeAlerts}
          unit="Events"
          trendPct={0}
          variant={kpis.activeAlerts > 0 ? "warn" : "safe"}
          sparklineData={[1, 2, 4, 3, 3]}
          subtext="Requires Supervisor Review"
          isLoading={isLoading}
        />
        <StatCard
          label="Wells in Warning / Alarm"
          value={kpis.wellsInAlarm}
          unit="Wells"
          trendPct={0}
          variant={kpis.wellsInAlarm > 0 ? "critical" : "safe"}
          sparklineData={[0, 0, 1, 1, 1]}
          subtext="BGW-04 Rod Floating Threshold"
          isLoading={isLoading}
        />
      </div>

      {/* Row 2: 2/3 Map Preview + 1/3 Alerts Feed (§9.1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Mini Map Preview */}
        <div className="lg:col-span-2 bg-surface-1 border border-line rounded-lg p-4 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-mechanical" />
              <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
                Field Geographic & Pad Layout
              </span>
            </div>
            <Link
              href="/field/map"
              className="text-xs font-mono text-accent-mechanical hover:underline flex items-center gap-1"
            >
              <span>Launch Fullscreen Map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Stylized Mini Map Canvas */}
          <div
            onClick={() => router.push("/field/map")}
            className="relative h-56 bg-surface-0 rounded border border-line cursor-pointer overflow-hidden p-3 group hover:border-accent-mechanical/50 transition-colors"
          >
            <div className="absolute inset-0 opacity-20 depth-rail-bg" />

            {/* Simulated well markers in spatial relation */}
            <div className="relative w-full h-full">
              {wells.map((w) => {
                // Normalized relative position
                const left = ((w.lon - 72.41) / 0.03) * 80 + 10;
                const top = ((w.lat - 27.805) / 0.02) * 75 + 10;

                const color =
                  w.status === "producing"
                    ? "bg-status-safe"
                    : w.status === "css_active"
                    ? "bg-accent-thermal"
                    : w.status === "alarm"
                    ? "bg-status-critical"
                    : "bg-text-muted";

                return (
                  <div
                    key={w.wellId}
                    style={{ left: `${Math.max(5, Math.min(90, left))}%`, top: `${Math.max(5, Math.min(85, top))}%` }}
                    className="absolute flex items-center gap-1 transform -translate-x-1/2 -translate-y-1/2 group/marker"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${color} ring-2 ring-surface-0 animate-pulse-subtle`} />
                    <span className="text-[10px] font-mono text-text-primary bg-surface-1/90 px-1 rounded border border-line shadow-card hidden sm:inline">
                      {w.name}
                    </span>
                  </div>
                );
              })}

              {/* Central Facility Marker */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 p-1.5 rounded bg-surface-1 border border-accent-thermal shadow-popup flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-accent-thermal" />
                <span className="text-[9px] font-mono font-bold text-accent-thermal">Central Gathering & Heating</span>
              </div>
            </div>

            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-surface-1/90 text-[10px] font-mono text-text-muted border border-line">
              Click to open Interactive GIS / SCADA Plant Mimic →
            </div>
          </div>
        </div>

        {/* Right: Live Alerts Feed */}
        <div className="bg-surface-1 border border-line rounded-lg p-4 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-status-warn" />
              <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
                Live Field Alerts
              </span>
            </div>
            <Link
              href="/field/alerts"
              className="text-xs font-mono text-accent-mechanical hover:underline"
            >
              View All ({alerts.length})
            </Link>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-56">
            {alerts.slice(0, 4).map((a) => (
              <div
                key={a.id}
                onClick={() => router.push(a.routeLink || "/field/alerts")}
                className="p-2.5 rounded bg-surface-0 hover:bg-surface-2 border border-line cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-1 rounded ${
                      a.severity === "critical"
                        ? "bg-status-critical/20 text-status-critical"
                        : a.severity === "warning"
                        ? "bg-status-warn/20 text-status-warn"
                        : "bg-surface-2 text-text-muted"
                    }`}
                  >
                    {a.wellId} · {a.severity}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">{a.timestamp}</span>
                </div>
                <div className="text-xs font-semibold text-text-primary line-clamp-1">{a.title}</div>
                <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">{a.condition}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Well Grid with Filters (§9.1) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-thermal" />
            <h2 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide">
              Well Twin Directory ({filteredWells.length})
            </h2>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-1 border border-line">
              <Search className="w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search well or pad..."
                className="bg-transparent text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none w-32 sm:w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-surface-1 p-0.5 rounded border border-line text-xs font-mono">
              {(["ALL", "producing", "css_active", "alarm", "shut_in"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] transition-colors ${
                    statusFilter === status
                      ? "bg-surface-2 text-accent-mechanical border border-line"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Well Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredWells.map((w) => (
            <WellSummaryCard key={w.wellId} well={w} />
          ))}
        </div>
      </div>

      {/* Row 4: Field Production Treemap + Status Donut Side by Side (§9.1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TreemapChart wells={wells} height={250} />
        </div>
        <div>
          <DonutChart wells={wells} size={160} />
        </div>
      </div>
    </div>
  );
}
