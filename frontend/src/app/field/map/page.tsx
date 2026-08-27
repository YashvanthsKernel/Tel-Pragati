"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Layers,
  Flame,
  Truck,
  Building2,
  Filter,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowRight,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useDataProvider } from "../../../data/DataProviderContext";
import { FleetSummary, WellSummary } from "../../../data/types";
import { WellSummaryCard } from "../../../components/cards/WellSummaryCard";
import { RadialGauge } from "../../../components/common/RadialGauge";

// Dynamically import Leaflet map with SSR disabled
const RealtimeLeafletMap = dynamic(
  () => import("../../../components/map/RealtimeLeafletMap").then((mod) => mod.RealtimeLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-surface-0">
        <div className="w-10 h-10 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Loading Real-Time Leaflet GIS Satellite Map for Baghewala Field...
        </span>
      </div>
    ),
  }
);

export default function FleetMapPage() {
  const provider = useDataProvider();
  const [fleetSummary, setFleetSummary] = useState<FleetSummary | null>(null);
  const [viewMode, setViewMode] = useState<"geographic" | "schematic">("geographic");
  const [selectedWell, setSelectedWell] = useState<WellSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    provider.getFleetSummary().then((summary) => {
      setFleetSummary(summary);
      if (summary.wells.length > 0 && !selectedWell) {
        setSelectedWell(summary.wells[7] || summary.wells[0]);
      }
    });
  }, [provider, selectedWell]);

  const wells = fleetSummary?.wells || [];
  const filteredWells = wells.filter((w) => statusFilter === "ALL" || w.status === statusFilter);

  return (
    <div className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Controls: Mode Toggle & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-surface-1 rounded-lg border border-line">
            <button
              type="button"
              onClick={() => setViewMode("geographic")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors ${
                viewMode === "geographic"
                  ? "bg-accent-mechanical text-surface-0"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Real-Time Leaflet GIS</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("schematic")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors ${
                viewMode === "schematic"
                  ? "bg-accent-thermal text-surface-0"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Schematic Plant Mimic</span>
            </button>
          </div>

          <span className="text-xs font-mono text-text-muted hidden md:inline">
            Baghewala Heavy Oil PML Lease (Rajasthan)
          </span>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-surface-1 p-0.5 rounded border border-line text-xs font-mono">
          {(["ALL", "producing", "css_active", "alarm", "shut_in"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-2 py-1 rounded uppercase font-bold text-[10px] transition-colors ${
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

      {/* Main Map Area + Slide-in Drawer Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[550px] relative">
        {/* Map Canvas (3 Cols on desktop) */}
        <div className="lg:col-span-3 bg-surface-1 border border-line rounded-lg overflow-hidden relative shadow-card flex flex-col">
          {viewMode === "schematic" && (
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 bg-surface-1/90 backdrop-blur-md p-1 rounded border border-line shadow-popup">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
                className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mode Indicator & Note */}
          <div className="absolute top-3 left-14 z-20 bg-surface-1/90 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-text-muted border border-line">
            {viewMode === "geographic"
              ? "Live Tile Stream · Jaisalmer District GIS · PML Boundary"
              : "SCADA HMI Gathering & Bowser Transport Network"}
          </div>

          {/* Map Rendering Container */}
          <div className="flex-1 w-full h-full min-h-[500px] relative overflow-hidden bg-surface-0 flex items-center justify-center">
            {viewMode === "geographic" ? (
              /* REALTIME LEAFLET GIS MAP */
              <RealtimeLeafletMap
                wells={filteredWells}
                selectedWell={selectedWell}
                onSelectWell={(w) => setSelectedWell(w)}
              />
            ) : (
              /* SCHEMATIC SCADA HMI PLANT MIMIC (§9.2) */
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
                className="w-full h-full relative transition-transform duration-200 p-8 flex items-center justify-center"
              >
                <svg viewBox="0 0 800 500" className="w-full h-full overflow-visible">
                  {/* Gathering line orthogonal paths */}
                  <g stroke="var(--line)" strokeWidth="2.5" fill="none">
                    {/* North gathering line */}
                    <path d="M 120,100 L 400,100 L 400,250" />
                    {/* Central gathering line */}
                    <path d="M 120,250 L 400,250" />
                    {/* South gathering line */}
                    <path d="M 120,400 L 400,400 L 400,250" />
                    {/* Trunk transport line to Bowser bay */}
                    <path d="M 400,250 L 620,250" stroke="var(--accent-thermal)" strokeWidth="3" />
                    {/* Bowser transport line towards Mehsana */}
                    <path d="M 620,250 L 760,250" stroke="var(--accent-mechanical)" strokeWidth="2" strokeDasharray="5 3" />
                  </g>

                  {/* Central Collection & Heating Facility */}
                  <g transform="translate(360, 210)" className="cursor-pointer">
                    <rect width="80" height="80" rx="8" fill="var(--surface-1)" stroke="var(--accent-thermal)" strokeWidth="2" />
                    <text x="40" y="38" fill="var(--accent-thermal)" fontSize="9" fontFamily="var(--font-ibm-plex-mono)" fontWeight="bold" textAnchor="middle">
                      CENTRAL
                    </text>
                    <text x="40" y="52" fill="var(--text-primary)" fontSize="8" fontFamily="var(--font-ibm-plex-mono)" textAnchor="middle">
                      Collection & Heating
                    </text>
                    <text x="40" y="65" fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-ibm-plex-mono)" textAnchor="middle">
                      Facility
                    </text>
                  </g>

                  {/* Bowser Loading Bay */}
                  <g transform="translate(580, 210)">
                    <rect width="80" height="80" rx="8" fill="var(--surface-1)" stroke="var(--accent-mechanical)" strokeWidth="2" />
                    <text x="40" y="38" fill="var(--accent-mechanical)" fontSize="9" fontFamily="var(--font-ibm-plex-mono)" fontWeight="bold" textAnchor="middle">
                      BOWSER
                    </text>
                    <text x="40" y="52" fill="var(--text-primary)" fontSize="8" fontFamily="var(--font-ibm-plex-mono)" textAnchor="middle">
                      Loading Bay
                    </text>
                    <text x="40" y="65" fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-ibm-plex-mono)" textAnchor="middle">
                      Dispatch Station
                    </text>
                  </g>

                  {/* Arrow to Mehsana */}
                  <text x="740" y="240" fill="var(--accent-mechanical)" fontSize="10" fontFamily="var(--font-ibm-plex-mono)" fontWeight="bold">
                    → Mehsana
                  </text>
                  <text x="740" y="255" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-ibm-plex-mono)">
                    Refinery (Road)
                  </text>

                  {/* Well Pad Groups (North, Central, South) */}
                  {filteredWells.map((w, idx) => {
                    const col = idx % 4;
                    const row = Math.floor(idx / 4);
                    const padX = 60 + col * 75;
                    const padY = 70 + row * 150;
                    const isSelected = selectedWell?.wellId === w.wellId;

                    return (
                      <g
                        key={w.wellId}
                        transform={`translate(${padX}, ${padY})`}
                        onClick={() => setSelectedWell(w)}
                        className="cursor-pointer group"
                      >
                        <rect
                          x="-25"
                          y="-20"
                          width="50"
                          height="40"
                          rx="4"
                          fill={isSelected ? "var(--surface-2)" : "var(--surface-1)"}
                          stroke={isSelected ? "var(--accent-mechanical)" : "var(--line)"}
                          strokeWidth={isSelected ? "2" : "1"}
                        />
                        <circle
                          cx="0"
                          cy="-6"
                          r="4"
                          fill={w.status === "alarm" ? "var(--status-critical)" : w.status === "css_active" ? "var(--accent-thermal)" : "var(--status-safe)"}
                        />
                        <text x="0" y="10" fill="var(--text-primary)" fontSize="8" fontFamily="var(--font-ibm-plex-mono)" fontWeight="bold" textAnchor="middle">
                          {w.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Selected Well Detail Slide-In Drawer (1 Col) */}
        <div className="bg-surface-1 border border-line rounded-lg p-4 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
              Selected Well Intelligence
            </span>
            {selectedWell && (
              <span className="text-[10px] font-mono text-accent-mechanical">
                {selectedWell.padId}
              </span>
            )}
          </div>

          {selectedWell ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <WellSummaryCard well={selectedWell} />

              <div className="p-3 rounded bg-surface-0 border border-line space-y-2 text-xs font-mono">
                <div className="text-[10px] text-text-muted uppercase font-bold">Subsurface Telemetry</div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Bottomhole Temp:</span>
                  <span className="font-bold text-accent-thermal">{selectedWell.bhtCelsius || 74.2}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">In-situ Viscosity:</span>
                  <span className="font-bold text-accent-mechanical">{(selectedWell.viscosityCp || 5820).toLocaleString()} cP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Rod Floating Risk:</span>
                  <span className={`font-bold ${(selectedWell.rodFloatingRiskPct || 0) > 50 ? "text-status-warn" : "text-status-safe"}`}>
                    {selectedWell.rodFloatingRiskPct || 64}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">PML GIS Coords:</span>
                  <span className="text-text-primary">{selectedWell.lat.toFixed(4)}°N, {selectedWell.lon.toFixed(4)}°E</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/well/${selectedWell.wellId}/twin`}
                  className="w-full py-2 px-3 rounded bg-accent-mechanical text-surface-0 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-accent-mechanical/90 transition-colors shadow-glowMechanical"
                >
                  <span>Open Full Digital Twin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/well/${selectedWell.wellId}/3d`}
                  className="w-full py-2 px-3 rounded bg-surface-2 border border-line text-text-primary font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-line transition-colors"
                >
                  <span>Launch 3D Wellbore</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-text-muted">
              Select a well marker on the map to inspect telemetry drawer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
