"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Flame,
  Atom,
  TrendingDown,
  ShieldAlert,
  Sliders,
  Box,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import { StatCard } from "../../../../components/cards/StatCard";
import { EstimatedBadge } from "../../../../components/common/EstimatedBadge";
import { RadialGauge } from "../../../../components/common/RadialGauge";
import { RecommendationCard } from "../../../../components/cards/RecommendationCard";
import { ComponentDossier } from "../../../../components/cards/ComponentDossier";
import { ScenarioPlayer } from "../../../../components/common/ScenarioPlayer";
import { WellboreScene } from "../../../../components/scene/WellboreScene";
import { TimeSeriesChart } from "../../../../components/charts/TimeSeriesChart";

export default function WellTwinPage() {
  const { wellId, wellState, isLoading, error } = useWellContext();
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("rod_string");
  const [isDossierOpen, setIsDossierOpen] = useState(true);

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Synchronizing Well Twin telemetry stream for {wellId}...
        </span>
      </div>
    );
  }

  const { observed, inferred, fusion, rodFloatingRiskPct, healthPct, day, cssCycle, phase } = wellState;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Top Header & Subsystem Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-safe animate-pulse-subtle" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              {wellId} Digital Twin Observer
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-2 text-accent-mechanical border border-line">
              Cycle #{cssCycle} · Day {day} ({phase.toUpperCase()})
            </span>
          </div>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Physics-Informed Real-Time Heavy Oil Reservoir & Sucker Rod Lift Twin
          </p>
        </div>

        {/* Subsystem Pills */}
        <div className="flex items-center gap-1 bg-surface-1 p-1 rounded-lg border border-line">
          {(
            [
              { id: "surface_pad", label: "Surface" },
              { id: "rod_string", label: "Rod Column" },
              { id: "downhole_pump", label: "Pump" },
              { id: "reservoir_slab", label: "Formation" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedSubsystem(s.id);
                setIsDossierOpen(true);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                selectedSubsystem === s.id
                  ? "bg-accent-mechanical text-surface-0"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Time Machine Scenario Controller (§10.1) */}
      <ScenarioPlayer showTimeline={true} />

      {/* Row 2: Subsurface State Cards (Bottomhole Temp, Viscosity, Rod Drag, Fillage) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bottomhole Temperature */}
        <div className="p-4 rounded-lg bg-surface-1 border border-accent-thermal/30 shadow-card flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">Bottomhole Temp (BHT)</span>
            <EstimatedBadge data={inferred.bottomholeTempC} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-accent-thermal">
              {inferred.bottomholeTempC.value}°C
            </span>
            <span className="text-xs font-mono text-text-muted">
              ({inferred.bottomholeTempC.trendPctPerDay && inferred.bottomholeTempC.trendPctPerDay > 0 ? "+" : ""}
              {inferred.bottomholeTempC.trendPctPerDay}%/d)
            </span>
          </div>
          <div className="text-[11px] font-mono text-text-muted">
            Surface: {observed.surfaceTempC}°C · Thermal Radius: {inferred.reservoirThermalRadiusM?.value || 14.2}m
          </div>
        </div>

        {/* Card 2: In-Situ Viscosity */}
        <div className="p-4 rounded-lg bg-surface-1 border border-accent-mechanical/30 shadow-card flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">In-Situ Oil Viscosity</span>
            <EstimatedBadge data={inferred.viscosityCp} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-accent-mechanical">
              {inferred.viscosityCp.value.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-text-muted">cP</span>
          </div>
          <div className="text-[11px] font-mono text-text-muted">
            Andrade Rheology · 17.2° API Heavy Crude
          </div>
        </div>

        {/* Card 3: Viscous Rod Drag */}
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">Downstroke Rod Drag</span>
            <EstimatedBadge data={inferred.rodDragLb} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-text-primary">
              {inferred.rodDragLb.value.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-text-muted">lb</span>
          </div>
          <div className="text-[11px] font-mono text-text-muted">
            Gibbs 1D Wave Shear · Peak PPRL: {observed.polishedRodLoadLb.toLocaleString()} lb
          </div>
        </div>

        {/* Card 4: Downhole Pump Fillage */}
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase">Downhole Pump Fillage</span>
            <EstimatedBadge data={inferred.downholeFillagePct} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-status-safe">
              {inferred.downholeFillagePct.value}%
            </span>
            <span className="text-xs font-mono text-text-muted">
              Gross: {observed.flowBopd} BOPD
            </span>
          </div>
          <div className="text-[11px] font-mono text-text-muted">
            SPM: {observed.spm} · Stroke: {observed.strokeLengthIn} in
          </div>
        </div>
      </div>

      {/* Row 3: Physics/ML Agreement + Rod Floating Risk Gauge + 3D Embedded Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Physics/ML Fusion & Risk Gauge */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Physics vs ML Agreement Card */}
          <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
                Physics vs. ML Agreement Envelope
              </span>
              <span className="text-xs font-mono font-bold text-status-safe">
                {fusion.agreementPct}% Agreement
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded bg-surface-0 border border-line">
              <div>
                <span className="text-[10px] text-text-muted uppercase">Convective Physics</span>
                <div className="font-bold text-accent-thermal mt-0.5">{fusion.physicsValue}°C</div>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase">Neural Surrogate</span>
                <div className="font-bold text-accent-mechanical mt-0.5">{fusion.mlValue}°C</div>
              </div>
            </div>

            <div className="text-[11px] text-text-muted leading-relaxed">
              First-principles thermal boundary model and deep neural surrogate agree within calibrated 90% confidence envelope.
            </div>
          </div>

          {/* Rod Floating Risk & Buckling Tendency Gauge */}
          <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card flex items-center justify-around gap-4">
            <RadialGauge
              value={rodFloatingRiskPct}
              label="Rod Floating Hazard"
              size={90}
              variant={rodFloatingRiskPct > 55 ? "warn" : "safe"}
            />
            <div className="space-y-1 text-xs font-mono">
              <div className="text-[10px] text-text-muted uppercase">Buckling Severity</div>
              <div
                className={`font-bold text-sm ${
                  rodFloatingRiskPct > 70
                    ? "text-status-critical"
                    : rodFloatingRiskPct > 45
                    ? "text-status-warn"
                    : "text-status-safe"
                }`}
              >
                {rodFloatingRiskPct > 70 ? "CRITICAL HAZARD" : rodFloatingRiskPct > 45 ? "ELEVATED SLACK" : "NOMINAL TENSION"}
              </div>
              <p className="text-[11px] text-text-muted max-w-[160px] leading-tight">
                {rodFloatingRiskPct > 45
                  ? "Fluid viscous drag counters >40% of buoyant rod weight during downstroke."
                  : "Rod string maintains sufficient tension on downstroke."}
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right: Embedded 3D Preview Panel (§10.1 & §11.7) */}
        <div className="lg:col-span-2 bg-surface-1 border border-line rounded-lg p-3 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-accent-mechanical" />
              <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
                3D Wellbore Spatial Visualizer (Live Stream)
              </span>
            </div>
            <Link
              href={`/well/${wellId}/3d`}
              className="text-xs font-mono text-accent-mechanical hover:underline flex items-center gap-1"
            >
              <span>Open Dedicated 3D Experience</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full rounded overflow-hidden relative">
            <WellboreScene
              wellState={wellState}
              interactive={true}
              autoRotate={true}
              onSelectNode={(nodeId) => {
                setSelectedSubsystem(nodeId);
                setIsDossierOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Row 4: Component Dossier & Decision Engine Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Component Dossier */}
        {isDossierOpen && (
          <ComponentDossier
            nodeId={selectedSubsystem}
            wellState={wellState}
            onClose={() => setIsDossierOpen(false)}
          />
        )}

        {/* AI Decision Advisory Card */}
        <RecommendationCard
          recommendation={{
            id: `REC-${wellId}-01`,
            wellId: wellId,
            ts: new Date().toISOString(),
            actionType: "VFD_DAMPING",
            title: "Apply Asymmetric Downstroke Velocity Damping (-17%)",
            proposedParams: { downstrokeDampingPct: 17, spm: 4.8 },
            expectedImpact: { energyPct: -8.3, riskPct: -29.4, valueInrDay: 18500, productionBopd: -2.0 },
            autonomyTier: "advisory",
            status: "pending",
            explanation: `Reservoir cooling to ${inferred.bottomholeTempC.value}°C increased viscosity to ${inferred.viscosityCp.value.toLocaleString()} cP. Decelerating VFD downstroke prevents compressive rod buckling and traveling valve pickup shock.`,
          }}
        />
      </div>
    </div>
  );
}
