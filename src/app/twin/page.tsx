"use client";

import React from "react";
import { Well3DSectionalViewer } from "../../components/twin/Well3DSectionalViewer";
import { SubsurfaceStateDeck } from "../../components/twin/SubsurfaceStateDeck";
import { TwinDecisionPanel } from "../../components/twin/TwinDecisionPanel";

export default function TwinPage() {
  return (
    <div className="space-y-4">
      {/* 3-Column Industrial Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (5 cols): Interactive 3D Sectional Well Digital Twin */}
        <div className="lg:col-span-5 space-y-2">
          <Well3DSectionalViewer />
        </div>

        {/* Center Column (4 cols): Invisible Subsurface State Inferred Variables */}
        <div className="lg:col-span-4 space-y-4">
          <SubsurfaceStateDeck />
        </div>

        {/* Right Column (3 cols): Twin Decision & Autonomous Advisory Control */}
        <div className="lg:col-span-3 space-y-4">
          <TwinDecisionPanel />
        </div>
      </div>
    </div>
  );
}
