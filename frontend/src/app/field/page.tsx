"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, Flame, MapPin, Search, ExternalLink, ShieldAlert, ArrowRight,
} from "lucide-react";
import { useDataProvider } from "../../data/DataProviderContext";
import { AlertItem, FleetSummary, WellSummary } from "../../data/types";
import { StatCard } from "../../components/cards/StatCard";
import { WellSummaryCard } from "../../components/cards/WellSummaryCard";
import { TreemapChart } from "../../components/charts/TreemapChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";

export default function FleetOverviewPage() {
  const router = useRouter();
  const provider = useDataProvider();

  const [fleetSummary, setFleetSummary] = useState<FleetSummary | null>(null);
  const [alerts, setAlerts]             = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery]   = useState("");

  useEffect(() => {
    setIsLoading(true);
    Promise.all([provider.getFleetSummary(), provider.getAlerts()])
      .then(([summary, alertList]) => {
        setFleetSummary(summary);
        setAlerts(alertList);
        setIsLoading(false);
      })
      .catch((err) => { console.error("Failed to load fleet data", err); setIsLoading(false); });
  }, [provider]);

  const wells = fleetSummary?.wells || [];
  const kpis  = fleetSummary?.fieldKpis || {
    totalBopd: 5980, avgSorTrailing30d: 6.8, activeAlerts: 3, wellsInAlarm: 1,
  };

  const filteredWells = wells.filter((w) => {
    const matchesStatus = statusFilter === "ALL" || w.status === statusFilter;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.padId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  /* ── Fleet health bar segments ── */
  const HealthBar = ({ wells }: { wells: WellSummary[] }) => {
    const total = wells.length || 1;
    return (
      <div className="flex gap-0.5 rounded-full overflow-hidden h-2 w-full">
        {wells.map((w) => (
          <div
            key={w.wellId}
            title={`${w.name}: ${w.healthPct}%`}
            className="flex-1 cursor-default transition-opacity hover:opacity-80"
            style={{
              backgroundColor:
                w.status === "alarm"        ? "var(--status-critical)" :
                w.status === "css_active"   ? "var(--accent-thermal)"  :
                w.status === "producing"    ? "var(--status-safe)"     :
                "var(--text-disabled)",
            }}
          />
        ))}
      </div>
    );
  };

  const STATUS_TABS = ["ALL", "producing", "css_active", "alarm", "shut_in"] as const;

  return (
    <div className="p-4 sm:p-6 space-y-6 page-enter">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Fleet Operations Overview"
        subtitle="Baghewala Field (PML Lease) · Jodhpur Sandstone Heavy Oil Development · Rajasthan"
        status="live"
        badge={`${wells.length} Wells`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/field/map"
              className="px-3 py-1.5 bg-surface-1 hover:bg-surface-2 border border-line text-xs font-sans font-medium text-text-primary rounded-lg flex items-center gap-1.5 transition-colors shadow-card"
            >
              <MapPin className="w-3.5 h-3.5 text-accent-mechanical" />
              <span>Fleet Map</span>
            </Link>
            <Link
              href="/field/reports"
              className="px-3 py-1.5 bg-accent-mechanical text-surface-0 text-xs font-sans font-semibold rounded-lg hover:bg-accent-mechanical/90 transition-colors"
            >
              Analytics & Reports
            </Link>
          </div>
        }
      />

      {/* ── Row 1: KPI Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Field Gross Production"
          value={kpis.totalBopd.toLocaleString()}
          unit="BOPD"
          trendPct={3.4}
          variant="mechanical"
          sparklineData={[5400, 5600, 5800, 5750, 5900, 5980]}
          subtext={`${wells.filter((w) => w.status === "producing").length} Active Producing Wells (${wells.length} Total)`}
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

      {/* ── Fleet Health Bar ──────────────────────────────────────────── */}
      {wells.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
            <span className="uppercase tracking-wider">Fleet Health Snapshot — {wells.length} Wells</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-status-safe inline-block" />Producing</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent-thermal inline-block" />CSS Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-status-critical inline-block" />Alarm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-text-disabled inline-block" />Shut-In</span>
            </div>
          </div>
          <HealthBar wells={wells} />
        </div>
      )}

      {/* ── Row 2: Map Preview + Alerts Feed ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map preview */}
        <SectionCard
          className="lg:col-span-2"
          accent="mechanical"
          title="Field Geographic & Pad Layout"
          icon={<MapPin className="w-3.5 h-3.5" />}
          action={
            <Link href="/field/map" className="text-xs font-mono text-accent-mechanical hover:underline flex items-center gap-1">
              <span>Fullscreen Map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          }
        >
          <div
            onClick={() => router.push("/field/map")}
            className="relative h-56 bg-surface-0 border border-line cursor-pointer overflow-hidden group hover:border-accent-mechanical/50 transition-colors"
          >
            <div className="absolute inset-0 opacity-20 depth-rail-bg" />
            <div className="relative w-full h-full p-3">
              {wells.map((w) => {
                const left = ((w.lon - 72.41) / 0.03) * 80 + 10;
                const top  = ((w.lat - 27.805) / 0.02) * 75 + 10;
                const color =
                  w.status === "producing"  ? "bg-status-safe"     :
                  w.status === "css_active" ? "bg-accent-thermal"  :
                  w.status === "alarm"      ? "bg-status-critical" : "bg-text-muted";
                return (
                  <div
                    key={w.wellId}
                    style={{ left: `${Math.max(5, Math.min(90, left))}%`, top: `${Math.max(5, Math.min(85, top))}%` }}
                    className="absolute flex items-center gap-1 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${color} ring-2 ring-surface-0 animate-pulse-subtle`} />
                    <span className="text-[10px] font-mono text-text-primary bg-surface-1/90 px-1 rounded border border-line hidden sm:inline">
                      {w.name}
                    </span>
                  </div>
                );
              })}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-surface-1 border border-accent-thermal shadow-popup flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-accent-thermal" />
                <span className="text-[9px] font-mono font-bold text-accent-thermal">Central Gathering</span>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-surface-1/90 text-[10px] font-mono text-text-muted border border-line">
              Click → Interactive GIS / SCADA
            </div>
          </div>
        </SectionCard>

        {/* Alerts feed */}
        <SectionCard
          accent="warn"
          title="Live Field Alerts"
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          action={
            <Link href="/field/alerts" className="text-xs font-mono text-accent-mechanical hover:underline">
              View All ({alerts.length})
            </Link>
          }
        >
          <div className="space-y-2 overflow-y-auto max-h-56">
            {alerts.slice(0, 4).map((a) => (
              <div
                key={a.id}
                onClick={() => router.push(a.routeLink || "/field/alerts")}
                className="p-2.5 bg-surface-0 hover:bg-surface-2 border border-line cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 ${
                    a.severity === "critical" ? "bg-status-critical/15 text-status-critical" :
                    a.severity === "warning"  ? "bg-status-warn/15 text-status-warn" :
                    "bg-surface-2 text-text-muted"
                  }`}>
                    {a.wellId} · {a.severity}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">{a.timestamp}</span>
                </div>
                <div className="text-xs font-semibold text-text-primary line-clamp-1">{a.title}</div>
                <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">{a.condition}</div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-6 text-xs text-text-muted font-mono">No active alerts</div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Row 3: Well Grid ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-mechanical" />
            <h2 className="font-sans text-sm font-bold text-text-primary uppercase tracking-wide">
              Well Twin Directory ({filteredWells.length})
            </h2>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-1 border border-line rounded-lg shadow-card">
              <Search className="w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search well or pad..."
                className="bg-transparent text-xs font-sans text-text-primary placeholder:text-text-muted focus:outline-none w-32 sm:w-44"
              />
            </div>

            <div className="flex items-center gap-0.5 bg-surface-1 p-1 rounded-lg border border-line text-xs font-sans shadow-card">
              {STATUS_TABS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-0.5 rounded uppercase font-semibold text-[10px] transition-all ${
                    statusFilter === status
                      ? "bg-accent-mechanical text-surface-0 font-bold"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                  }`}
                >
                  {status === "ALL" ? "All" : status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredWells.map((w) => (
            <WellSummaryCard key={w.wellId} well={w} />
          ))}
          {filteredWells.length === 0 && (
            <div className="col-span-full text-center py-12 text-xs text-text-muted font-mono">
              No wells match the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Treemap + Donut ────────────────────────────────────── */}
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
