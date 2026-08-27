"use client";

import React, { useState } from "react";
import { useWellContext } from "../../../../components/well/WellContext";
import { WellboreScene } from "../../../../components/scene/WellboreScene";
import { ComponentDossier } from "../../../../components/cards/ComponentDossier";
import { ScenarioPlayer } from "../../../../components/common/ScenarioPlayer";
import { Box, Layers, Sliders, Info, ShieldCheck } from "lucide-react";

export default function Dedicated3DWellPage() {
  const { wellId, wellState, isLoading } = useWellContext();
  const [selectedNode, setSelectedNode] = useState<string | null>("rod_string");

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Constructing 3D Subsurface Model for {wellId}...
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-accent-mechanical" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              {wellId} Dedicated 3D Subsurface Wellbore Experience
            </h1>
          </div>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Real-Time Data-Bound Three.js WebGL Model · Surface to Reservoir Multi-Layer Spatial Twin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded bg-surface-1 border border-line text-xs font-mono text-text-muted">
            Depth: <span className="text-text-primary font-bold">{wellState.depthM || 1040}m</span>
          </div>
          <div className="px-3 py-1 rounded bg-accent-thermal/10 text-accent-thermal border border-accent-thermal/30 text-xs font-mono font-bold">
            GPU Instanced 60 FPS
          </div>
        </div>
      </div>

      {/* Time Machine Scenario Controller Synchronized (§11.4) */}
      <ScenarioPlayer showTimeline={true} />

      {/* Main 3D Canvas + Component Dossier Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[550px]">
        {/* Fullscreen 3D Scene (3 Cols) */}
        <div className="lg:col-span-3 bg-surface-1 border border-line rounded-lg overflow-hidden shadow-card relative flex flex-col">
          <WellboreScene
            wellState={wellState}
            interactive={true}
            autoRotate={false}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Right Dossier Panel (1 Col) */}
        <div className="space-y-4">
          <ComponentDossier
            nodeId={selectedNode}
            wellState={wellState}
            onClose={() => setSelectedNode(null)}
          />

          <div className="p-3.5 rounded-lg bg-surface-1 border border-line shadow-card space-y-2 text-xs font-mono">
            <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
              3D Navigation & Controls
            </span>
            <div className="space-y-1 text-[11px] text-text-muted leading-relaxed">
              <p>• <strong>Left Click + Drag:</strong> Orbit camera around wellbore</p>
              <p>• <strong>Right Click + Drag:</strong> Pan vertically</p>
              <p>• <strong>Scroll Wheel:</strong> Zoom from surface to reservoir</p>
              <p>• <strong>Click Components:</strong> Open engineering dossier</p>
              <p>• <strong>Mode Pills:</strong> Switch shaders (Thermal, Risk, Drag)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
