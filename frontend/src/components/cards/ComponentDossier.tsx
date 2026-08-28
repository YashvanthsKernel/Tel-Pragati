"use client";

import React from "react";
import { X, Layers, Activity, ShieldCheck, Cpu } from "lucide-react";
import { WellState } from "../../data/types";
import { RadialGauge } from "../common/RadialGauge";

interface ComponentDossierProps {
  nodeId: string | null;
  wellState: WellState;
  onClose: () => void;
}

export function ComponentDossier({ nodeId, wellState, onClose }: ComponentDossierProps) {
  if (!nodeId) return null;

  const getDossierData = (id: string) => {
    switch (id) {
      case "pumping_unit":
      case "surface_pad":
        return {
          title: "Surface Pumping Unit & Wellhead",
          depthRange: "0m (Surface)",
          status: "OPTIMAL",
          description: "Conventional C-640-305-144 beam pumping unit equipped with 45 kW VFD drive and polished rod load cell.",
          specs: [
            { label: "Surface Temp", value: `${wellState.observed.surfaceTempC}°C` },
            { label: "Nominal SPM", value: `${wellState.observed.spm} SPM` },
            { label: "Stroke Length", value: `${wellState.observed.strokeLengthIn} in` },
            { label: "Motor Current", value: `${wellState.observed.motorCurrentA} A` },
            { label: "Casing Pressure", value: `${wellState.observed.casingPressurePsi} psi` },
          ],
          healthPct: 96,
        };
      case "rod_string":
        return {
          title: "Tapered Sucker Rod Column",
          depthRange: "0m – 1,040m",
          status: wellState.rodFloatingRiskPct > 55 ? "COMPRESSION HAZARD" : "NOMINAL",
          description: "API Grade D 1-inch and 7/8-inch high-strength rod string traversing non-Newtonian heavy crude column.",
          specs: [
            { label: "Peak Polished Rod Load", value: `${wellState.observed.polishedRodLoadLb.toLocaleString()} lb` },
            { label: "Downstroke Viscous Drag", value: `${wellState.inferred.rodDragLb.value.toLocaleString()} lb` },
            { label: "Buoyant String Weight", value: "18,240 lb" },
            { label: "Rod Floating Risk", value: `${wellState.rodFloatingRiskPct}%` },
            { label: "Downhole Stroke", value: "128 in" },
          ],
          healthPct: Math.max(20, 100 - wellState.rodFloatingRiskPct),
        };
      case "wellbore":
      case "tubing":
        return {
          title: "Tubing String & Production Casing",
          depthRange: "0m – 1,050m",
          status: "NORMAL",
          description: "3-1/2 inch EUE J-55 tubing set within 7-inch production casing with continuous annular fluid monitoring.",
          specs: [
            { label: "Tubing Pressure", value: `${wellState.observed.tubingPressurePsi} psi` },
            { label: "Casing Pressure", value: `${wellState.observed.casingPressurePsi} psi` },
            { label: "Total Depth", value: `${wellState.depthM} m` },
            { label: "Flow Velocity", value: "1.42 m/s" },
          ],
          healthPct: 92,
        };
      case "downhole_pump":
      case "pump":
        return {
          title: "Downhole Insert Sucker Rod Pump",
          depthRange: "1,040m",
          status: wellState.inferred.downholeFillagePct.value < 80 ? "FLUID POUND" : "NORMAL",
          description: "API 25-175 RHBC heavy oil insert pump with hardened barrel and tungsten carbide double ball valves.",
          specs: [
            { label: "Pump Fillage", value: `${wellState.inferred.downholeFillagePct.value}%` },
            { label: "Plunger Diameter", value: "1.75 in" },
            { label: "Gross Lift Rate", value: `${wellState.observed.flowBopd} BOPD` },
            { label: "Valve Clearance", value: "0.003 in" },
          ],
          healthPct: wellState.inferred.downholeFillagePct.value,
        };
      case "reservoir_slab":
      case "formation":
      default:
        return {
          title: "Jodhpur Sandstone Heavy Oil Formation",
          depthRange: "1,025m – 1,055m",
          status: "THERMAL RECOVERY",
          description: "Glauconitic sandstone pay zone saturated with 17.2° API extra-heavy crude subjected to cyclic steam stimulation.",
          specs: [
            { label: "Bottomhole Temp (BHT)", value: `${wellState.inferred.bottomholeTempC.value}°C` },
            { label: "In-situ Viscosity", value: `${wellState.inferred.viscosityCp.value.toLocaleString()} cP` },
            { label: "Thermal Radius", value: `${wellState.inferred.reservoirThermalRadiusM?.value || 14.2} m` },
            { label: "CSS Cycle", value: `Cycle #${wellState.cssCycle} (Day ${wellState.day})` },
          ],
          healthPct: 94,
        };
    }
  };

  const dossier = getDossierData(nodeId);

  return (
    <div className="p-3.5 rounded-lg bg-surface-1 border border-line shadow-card space-y-3 animate-fade-in text-left">
      <div className="flex items-start justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-accent-mechanical/10 text-accent-mechanical">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-accent-mechanical font-bold">
              Subsurface Node Inspector
            </span>
            <h4 className="font-sans font-bold text-sm text-text-primary leading-tight">{dossier.title}</h4>
            <div className="text-[10px] font-mono text-text-muted">Interval: {dossier.depthRange}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-sans text-text-secondary leading-relaxed">{dossier.description}</p>

      <div className="grid grid-cols-2 gap-1.5">
        {dossier.specs.map((s) => (
          <div key={s.label} className="p-2 rounded bg-surface-0 border border-line">
            <div className="text-[10px] font-sans text-text-muted truncate">{s.label}</div>
            <div className="font-mono text-xs font-bold text-text-primary mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-line text-xs font-mono">
        <span className="text-text-muted">Status: <strong className="text-text-primary font-bold">{dossier.status}</strong></span>
        <span className="text-accent-mechanical font-bold">Health: {Math.round(dossier.healthPct)}%</span>
      </div>
    </div>
  );
}
