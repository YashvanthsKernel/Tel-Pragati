"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, Box, ArrowRight, Thermometer, Droplets, Gauge, ShieldCheck } from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import { EstimatedBadge } from "../../../../components/common/EstimatedBadge";
import { RadialGauge } from "../../../../components/common/RadialGauge";
import { RecommendationCard } from "../../../../components/cards/RecommendationCard";
import { ComponentDossier } from "../../../../components/cards/ComponentDossier";
import { ScenarioPlayer } from "../../../../components/common/ScenarioPlayer";
import dynamic from "next/dynamic";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { SectionCard } from "../../../../components/ui/SectionCard";

const WellboreScene = dynamic(
  () => import("../../../../components/scene/WellboreScene").then((m) => m.WellboreScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full flex flex-col items-center justify-center bg-surface-0 rounded border border-line">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-2">Loading 3D Spatial Visualizer...</span>
      </div>
    ),
  }
);

const SUBSYSTEMS = [
  { id: "surface_pad",    label: "Surface"    },
  { id: "rod_string",     label: "Rod Column" },
  { id: "downhole_pump",  label: "Pump"       },
  { id: "reservoir_slab", label: "Formation"  },
] as const;

export default function WellTwinPage() {
  const { wellId, wellState, isLoading, error } = useWellContext();
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("rod_string");
  const [isDossierOpen, setIsDossierOpen]         = useState(true);

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted">
          Synchronizing Well Twin telemetry for {wellId}...
        </span>
      </div>
    );
  }

  const { observed, inferred, fusion, rodFloatingRiskPct, healthPct, day, cssCycle, phase } = wellState;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ── Page Header ── */}
      <PageHeader
        wellId={wellId}
        icon={<Activity className="w-5 h-5 text-accent-mechanical" />}
        title="Integrated Digital Twin Workstation"
        subtitle="Physics-Informed Real-Time Heavy Oil Reservoir & Sucker Rod Lift Twin"
        status="live"
        badge={`Cycle #${cssCycle} · Day ${day} · ${phase.toUpperCase()}`}
        actions={
          <div className="flex items-center gap-1 bg-surface-1 p-1 rounded-lg border border-line">
            {SUBSYSTEMS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSelectedSubsystem(s.id); setIsDossierOpen(true); }}
                className={`px-3 py-1 rounded text-xs font-sans font-medium transition-all ${
                  selectedSubsystem === s.id
                    ? "bg-accent-mechanical text-surface-0 font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Scenario Player ── */}
      <ScenarioPlayer showTimeline={true} />

      {/* ── Subsurface Operational State Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* BHT Card */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-sans font-medium text-text-secondary uppercase tracking-wide">
              Bottomhole Temp (BHT)
            </span>
            <EstimatedBadge data={inferred.bottomholeTempC} />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-accent-thermal tabular-nums">
              {inferred.bottomholeTempC.value.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-text-muted">°C</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 truncate">
            Surface {observed.surfaceTempC}°C · Thermal Radius {inferred.reservoirThermalRadiusM?.value || 14.2}m
          </div>
        </div>

        {/* Viscosity Card */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-sans font-medium text-text-secondary uppercase tracking-wide">
              In-Situ Oil Viscosity
            </span>
            <EstimatedBadge data={inferred.viscosityCp} />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-accent-mechanical tabular-nums">
              {inferred.viscosityCp.value.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-text-muted">cP</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 truncate">
            Andrade Rheology · 17.2° API Heavy Crude
          </div>
        </div>

        {/* Rod Drag Card */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-sans font-medium text-text-secondary uppercase tracking-wide">
              Downstroke Rod Drag
            </span>
            <EstimatedBadge data={inferred.rodDragLb} />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tabular-nums">
              {inferred.rodDragLb.value.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-text-muted">lb</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 truncate">
            Gibbs 1D Wave · PPRL {observed.polishedRodLoadLb.toLocaleString()} lb
          </div>
        </div>

        {/* Pump Fillage Card */}
        <div className="bg-surface-1 border border-line rounded-lg p-3.5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-sans font-medium text-text-secondary uppercase tracking-wide">
              Downhole Pump Fillage
            </span>
            <EstimatedBadge data={inferred.downholeFillagePct} />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-status-safe tabular-nums">
              {inferred.downholeFillagePct.value}
            </span>
            <span className="text-xs font-mono text-text-muted">%</span>
          </div>
          <div className="text-[11px] font-sans text-text-muted border-t border-line pt-2 mt-1 truncate">
            Gross {observed.flowBopd} BOPD · {observed.spm} SPM · Stroke {observed.strokeLengthIn}in
          </div>
        </div>
      </div>

      {/* ── Row 3: Physics/ML Agreement + Rod Hazard + 3D Preview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Physics vs ML Agreement */}
          <SectionCard accent="mechanical" title="Physics vs. ML Agreement">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-text-secondary">Agreement Score</span>
                <span className={`text-sm font-mono font-bold tabular-nums ${fusion.agreementPct >= 90 ? "text-status-safe" : fusion.agreementPct >= 75 ? "text-status-warn" : "text-status-critical"}`}>
                  {fusion.agreementPct}%
                </span>
              </div>
              {/* Agreement bar */}
              <div className="h-1.5 bg-surface-0 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${fusion.agreementPct >= 90 ? "bg-status-safe" : fusion.agreementPct >= 75 ? "bg-status-warn" : "bg-status-critical"}`}
                  style={{ width: `${fusion.agreementPct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 bg-surface-0 rounded border border-line">
                <div>
                  <span className="text-[10px] font-sans text-text-muted uppercase">Convective Physics</span>
                  <div className="font-bold text-accent-thermal mt-0.5 tabular-nums">{fusion.physicsValue}°C</div>
                </div>
                <div>
                  <span className="text-[10px] font-sans text-text-muted uppercase">Neural Surrogate</span>
                  <div className="font-bold text-accent-mechanical mt-0.5 tabular-nums">{fusion.mlValue}°C</div>
                </div>
              </div>
              <p className="text-[11px] font-sans text-text-muted leading-relaxed">
                First-principles thermal boundary model and deep neural surrogate agree within calibrated 90% confidence envelope.
              </p>
            </div>
          </SectionCard>

          {/* Rod Floating Risk Gauge */}
          <SectionCard accent={rodFloatingRiskPct > 55 ? "warn" : "safe"} title="Rod Floating Hazard">
            <div className="flex items-center justify-around gap-4">
              <RadialGauge
                value={rodFloatingRiskPct}
                label="Risk"
                size={90}
                variant={rodFloatingRiskPct > 55 ? "warn" : "safe"}
              />
              <div className="space-y-1">
                <div className="text-[10px] text-text-muted uppercase font-sans font-semibold">Buckling Severity</div>
                <div className={`font-sans font-bold text-sm ${
                  rodFloatingRiskPct > 70 ? "text-status-critical" :
                  rodFloatingRiskPct > 45 ? "text-status-warn" : "text-status-safe"
                }`}>
                  {rodFloatingRiskPct > 70 ? "Critical Hazard" : rodFloatingRiskPct > 45 ? "Elevated Slack" : "Nominal Tension"}
                </div>
                <p className="text-[11px] text-text-muted max-w-[160px] leading-snug font-sans">
                  {rodFloatingRiskPct > 45
                    ? "Fluid drag counters >40% of buoyant rod weight during downstroke."
                    : "Rod string maintains nominal tension on downstroke."}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Center/Right: 3D Preview */}
        <SectionCard
          className="lg:col-span-2"
          accent="mechanical"
          title="3D Wellbore Spatial Visualizer (Live Stream)"
          icon={<Box className="w-4 h-4 text-accent-mechanical" />}
          action={
            <Link href={`/well/${wellId}/3d`} className="text-xs font-sans text-accent-mechanical hover:underline flex items-center gap-1">
              Full 3D View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="h-72 w-full overflow-hidden rounded relative border border-line">
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
        </SectionCard>
      </div>

      {/* ── Row 4: Component Dossier + AI Recommendation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isDossierOpen && (
          <ComponentDossier
            nodeId={selectedSubsystem}
            wellState={wellState}
            onClose={() => setIsDossierOpen(false)}
          />
        )}
        <RecommendationCard
          recommendation={{
            id: `REC-${wellId}-01`,
            wellId,
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
