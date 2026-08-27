"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  Atom,
  Flame,
  Gauge,
  Layers,
  Scale,
  ShieldCheck,
  Thermometer,
  Zap,
} from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { MetricCard } from "../ui/MetricCard";
import { EngineeringGauge } from "../ui/EngineeringGauge";
import { StatusPill } from "../ui/StatusPill";

export const SubsurfaceStateDeck: React.FC = () => {
  const {
    twinState,
    selectedWellNode,
    provenanceMap,
    openProvenance,
  } = useTwinStore();

  const getNodeDossier = () => {
    switch (selectedWellNode) {
      case "reservoir":
        return {
          title: "Reservoir Formation (Jodhpur Sandstone)",
          depth: "1,020m - 1,060m TVD",
          thermal: `${twinState.bottomholeTemperatureC}°C (Steam Zone: ${twinState.reservoirThermalRadiusMeters}m)`,
          pressure: `${twinState.bottomholePressurePsi} psi`,
          viscosity: `${twinState.oilViscosityCentipoise.toLocaleString()} cP`,
          status: twinState.phase === "COOLING" ? "Thermal Decline Active" : "Nominal Production",
        };
      case "downhole_pump":
        return {
          title: "Sucker Rod Pump (SRP Plunger & Barrel)",
          depth: "1,038m Depth",
          thermal: `${twinState.bottomholeTemperatureC}°C`,
          pressure: "Intake: 840 psi | Discharge: 1,820 psi",
          viscosity: `Fillage: ${twinState.pumpFillagePercent}% | Stroke: ${twinState.downholeStrokeInches}"`,
          status: twinState.pumpFillagePercent < 80 ? "Fluid Pound Warning" : "Normal Fillage",
        };
      case "rod_string":
        return {
          title: "Tapered Sucker Rod String (7/8\" & 3/4\" API Grade D)",
          depth: "0m to 1,038m (1,040m length)",
          thermal: `Average: ${((twinState.bottomholeTemperatureC + twinState.wellheadTemperatureC) / 2).toFixed(1)}°C`,
          pressure: `Buoyant Wt: 18,240 lb | Drag: ${twinState.rodFluidDragPounds.toLocaleString()} lb`,
          viscosity: `Floating Risk: ${twinState.rodFloatingRiskPercent}%`,
          status: twinState.rodFloatingRiskPercent > 60 ? "WARNING: Compressive Slack" : "Nominal Tension",
        };
      default:
        return {
          title: "Surface Pumping Unit & Wellhead",
          depth: "0m (Surface)",
          thermal: `Wellhead Temp: ${twinState.wellheadTemperatureC}°C`,
          pressure: `Wellhead Press: ${twinState.wellheadPressurePsi} psi`,
          viscosity: `Motor: ${twinState.motorPowerKw} kW (${twinState.motorCurrentAmps} A)`,
          status: "Duplex SCADA Ingestion Online",
        };
    }
  };

  const dossier = getNodeDossier();

  return (
    <div className="space-y-4 select-none">
      {/* Invisible Subsurface Telemetry Header */}
      <div className="flex items-center justify-between border-b border-app-border pb-2">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
            Invisible Subsurface State
          </h2>
          <p className="text-xs text-text-secondary font-mono">
            Inferred Physics, State Observer & ML Surrogate
          </p>
        </div>
        <StatusPill variant="ESTIMATED" size="sm" />
      </div>

      {/* Grid of 4 Core Inferred Variables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricCard
          label="Bottomhole Temperature"
          value={twinState.bottomholeTemperatureC}
          unit="°C"
          source="ESTIMATED"
          trend={{
            delta: "-2.1",
            direction: "down",
            unit: "°C/day",
            isGood: "neutral",
          }}
          confidence={twinState.confidence.thermalModel}
          metadata={provenanceMap.BHT}
        />

        <MetricCard
          label="Inferred Viscosity"
          value={twinState.oilViscosityCentipoise.toLocaleString()}
          unit="cP"
          source="ESTIMATED"
          trend={{
            delta: "+11.4",
            direction: "up",
            unit: "%",
            isGood: "down",
          }}
          confidence={twinState.confidence.rheologyModel}
          metadata={provenanceMap.VISCOSITY}
        />

        <MetricCard
          label="Rod Viscous Drag"
          value={twinState.rodFluidDragPounds.toLocaleString()}
          unit="lb"
          source="ESTIMATED"
          trend={{
            delta: "+8.2",
            direction: "up",
            unit: "%",
            isGood: "down",
          }}
          confidence={twinState.confidence.wellboreModel}
          metadata={provenanceMap.DRAG}
        />

        <MetricCard
          label="Downhole Fillage"
          value={twinState.pumpFillagePercent}
          unit="%"
          source="ESTIMATED"
          trend={{
            delta: "-1.5",
            direction: "down",
            unit: "%",
            isGood: "up",
          }}
          confidence={92}
          statusBadge={
            <StatusPill
              variant={twinState.pumpFillagePercent < 80 ? "WARNING" : "NOMINAL"}
              size="sm"
            />
          }
        />
      </div>

      {/* Model Agreement & Digital Twin Divergence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        {/* Model Agreement */}
        <div className="p-2.5 rounded bg-blue-50/50 border border-blue-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase">Physics + ML Agreement</span>
            <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded text-[10px]">
              {twinState.modelAgreement.agreementPercent}% HIGH
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-700 pt-0.5">
            <span>Physics: {twinState.modelAgreement.physicsEstimate}°C</span>
            <span>ML Surrogate: {twinState.modelAgreement.mlSurrogateEstimate}°C</span>
          </div>
        </div>

        {/* Digital Twin Divergence */}
        <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-900 uppercase">Twin Divergence</span>
            <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
              {twinState.divergence.productionDivergencePercent}% {twinState.divergence.status}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-700 pt-0.5">
            <span>Observed: {twinState.divergence.observedProductionBopd} BOPD</span>
            <span>Twin: {twinState.divergence.predictedProductionBopd} BOPD</span>
          </div>
        </div>
      </div>

      {/* Rod Floating Risk Precision Gauge */}
      <div
        className="cursor-pointer"
        onClick={() => openProvenance(provenanceMap.ROD_RISK)}
        title="Inspect Rod Floating Prognostic Model Lineage"
      >
        <EngineeringGauge
          value={twinState.rodFloatingRiskPercent}
          label="Rod-Floating & Buckling Risk"
          warningThreshold={45}
          criticalThreshold={75}
          statusText={
            twinState.rodFloatingRiskPercent >= 75
              ? "CRITICAL HAZARD"
              : twinState.rodFloatingRiskPercent >= 45
              ? "WARNING: HIGH DRAG"
              : "SAFE ENVELOPE"
          }
          size="md"
        />
      </div>

      {/* Selected Component Engineering Dossier */}
      <div className="bg-surface rounded-md border border-app-border p-3.5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-oil-red" />
            <span className="text-xs font-bold font-mono text-text-primary uppercase">
              Component Dossier: {dossier.title}
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-secondary">{dossier.depth}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-surface-alt border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Thermal Condition:</span>
            <span className="font-bold text-text-primary">{dossier.thermal}</span>
          </div>

          <div className="p-2 rounded bg-surface-alt border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Pressure State:</span>
            <span className="font-bold text-text-primary">{dossier.pressure}</span>
          </div>

          <div className="p-2 rounded bg-surface-alt border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Rheology & Mechanics:</span>
            <span className="font-bold text-text-primary">{dossier.viscosity}</span>
          </div>

          <div className="p-2 rounded bg-surface-alt border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase block">Subsystem Status:</span>
            <span className="font-bold text-oil-charcoal">{dossier.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
