"use client";

import React, { useEffect, useState } from "react";
import {
  FileBarChart,
  Download,
  Calendar,
  Layers,
  Activity,
  CheckCircle,
  Flame,
} from "lucide-react";
import { useDataProvider } from "../../../data/DataProviderContext";
import { FleetSummary, WellSummary } from "../../../data/types";
import { FleetHealthHeatmap } from "../../../components/charts/FleetHealthHeatmap";
import { CycleCalendar } from "../../../components/charts/CycleCalendar";
import { TimeSeriesChart } from "../../../components/charts/TimeSeriesChart";

export default function ReportsPage() {
  const provider = useDataProvider();
  const [fleetSummary, setFleetSummary] = useState<FleetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    provider.getFleetSummary().then((res) => {
      setFleetSummary(res);
      setIsLoading(false);
    });
  }, [provider]);

  const wells = fleetSummary?.wells || [];

  const handleExportCSV = () => {
    if (wells.length === 0) return;

    const headers = ["WellID", "Name", "PadID", "Status", "FlowBOPD", "HealthPct", "BHT_Celsius", "Viscosity_cP", "RodRiskPct"];
    const rows = wells.map((w) => [
      w.wellId,
      w.name,
      w.padId,
      w.status,
      w.flowBopd,
      w.healthPct,
      w.bhtCelsius || 74.2,
      w.viscosityCp || 5820,
      w.rodFloatingRiskPct || 64,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Baghewala_Fleet_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportMessage("Exported Baghewala Fleet Telemetry CSV successfully.");
    setTimeout(() => setExportMessage(null), 3000);
  };

  const cumulativeFieldProdData = Array.from({ length: 30 }, (_, i) => ({
    x: `D-${30 - i}`,
    y: Math.round(5200 + Math.sin(i * 0.4) * 450 + i * 25),
    label: `Production: ${(5200 + Math.sin(i * 0.4) * 450 + i * 25).toFixed(0)} BOPD`,
  }));

  const sorTrendData = Array.from({ length: 30 }, (_, i) => ({
    x: `D-${30 - i}`,
    y: Number((7.8 - (i / 30) * 1.0 + Math.sin(i * 0.5) * 0.15).toFixed(2)),
    label: `SOR: ${(7.8 - (i / 30) * 1.0).toFixed(2)} bbl/bbl`,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-accent-thermal" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Field Analytics, Historical Trends & Compliance Reports
            </h1>
          </div>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Jodhpur Sandstone Production Chemistry · CSS Steam Efficiency · Multi-Well Telemetry Exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-accent-mechanical text-surface-0 font-bold text-xs hover:bg-accent-mechanical/90 transition-colors shadow-glowMechanical"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Fleet Telemetry CSV</span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 rounded bg-surface-1 border border-status-safe text-xs font-mono text-status-safe flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Row 1: Production & SOR Historical Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          data={cumulativeFieldProdData}
          title="Field Aggregate Crude Recovery Trend (Trailing 30 Days)"
          xLabel="Trailing Days"
          yLabel="BOPD"
          color="#4FB0C6"
          unit="BOPD"
          height={230}
        />
        <TimeSeriesChart
          data={sorTrendData}
          title="Cumulative Steam-Oil Ratio (SOR) Efficiency Trend"
          xLabel="Trailing Days"
          yLabel="SOR (bbl/bbl)"
          color="#E0793C"
          unit="bbl/bbl"
          height={230}
        />
      </div>

      {/* Row 2: Annual CSS Cycle Calendar Heatmap (§12.2) */}
      <CycleCalendar wellId="Baghewala Fleet Aggregate" year={2026} />

      {/* Row 3: Fleet Health Matrix Heatmap (§12.2) */}
      <FleetHealthHeatmap wells={wells} />
    </div>
  );
}
