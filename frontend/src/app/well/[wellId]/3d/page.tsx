"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useWellContext } from "../../../../components/well/WellContext";
import { ComponentDossier } from "../../../../components/cards/ComponentDossier";
import { ScenarioPlayer } from "../../../../components/common/ScenarioPlayer";
import { Box, Compass } from "lucide-react";
import { PageHeader } from "../../../../components/ui/PageHeader";

// Dynamically import Three.js WebGL scene with SSR disabled
const WellboreScene = dynamic(
  () => import("../../../../components/scene/WellboreScene").then((m) => m.WellboreScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-surface-0 rounded-lg border border-line">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Initializing 3D Subsurface GPU WebGL Context...
        </span>
      </div>
    ),
  }
);

export default function Dedicated3DWellPage() {
  const { wellId, wellState, isLoading } = useWellContext();
  const [selectedNode, setSelectedNode] = useState<string | null>("rod_string");

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Constructing 3D Subsurface Model for {wellId}...
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* ── Page Header ── */}
      <PageHeader
        wellId={wellId}
        icon={<Box className="w-5 h-5 text-accent-mechanical" />}
        title="Dedicated 3D Subsurface Wellbore Experience"
        subtitle="Real-Time Data-Bound Three.js WebGL Model · Surface to Reservoir Multi-Layer Spatial Twin"
        badge={`Depth: ${wellState.depthM || 1040}m`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-surface-2 border border-line text-text-secondary">
              GPU Instanced · 60 FPS
            </span>
          </div>
        }
      />

      {/* ── Time Machine Scenario Controller Synchronized (§11.4) ── */}
      <ScenarioPlayer showTimeline={true} />

      {/* ── Main 3D Canvas + Contextual Inspector ── */}
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

        {/* Right Dossier / Inspector Panel (1 Col) */}
        <div className="space-y-3">
          <ComponentDossier
            nodeId={selectedNode}
            wellState={wellState}
            onClose={() => setSelectedNode(null)}
          />

          <div className="p-3.5 rounded-lg bg-surface-1 border border-line shadow-card space-y-2 text-xs font-sans">
            <div className="flex items-center gap-1.5 font-bold text-text-primary uppercase tracking-wide text-xs border-b border-line pb-1.5">
              <Compass className="w-3.5 h-3.5 text-accent-mechanical" />
              <span>3D Navigation & Controls</span>
            </div>
            <div className="space-y-1 text-[11px] text-text-secondary leading-relaxed font-sans">
              <p>• <strong className="text-text-primary">Orbit:</strong> Left-click and drag camera around wellbore</p>
              <p>• <strong className="text-text-primary">Pan:</strong> Right-click and drag vertically</p>
              <p>• <strong className="text-text-primary">Zoom:</strong> Scroll wheel from surface to reservoir</p>
              <p>• <strong className="text-text-primary">Inspect:</strong> Click any component to load telemetry dossier</p>
              <p>• <strong className="text-text-primary">Shaders:</strong> Toggle Thermal, Drag & Risk color profiles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
