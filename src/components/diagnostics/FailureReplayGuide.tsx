"use client";

import React, { useEffect, useState } from "react";
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";

export const FailureReplayGuide: React.FC = () => {
  const { setDemoScenario, setSimulationDay } = useTwinStore();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const steps = [
    {
      step: 1,
      title: "1. Reservoir Thermal Decline",
      headline: "Bottomhole Temperature Falls from 140°C to 74.2°C",
      description: "As steam soaking heat dissipates into Jodhpur Sandstone matrix, the thermal boundary cools exponentially.",
      parameterBadge: "BHT: 74.2°C (-2.1°C/d)",
      action: () => {
        setSimulationDay(20);
      },
    },
    {
      step: 2,
      title: "2. Viscosity Surge (Andrade Rheology)",
      headline: "Oil Viscosity Escalates from 220 cP to 5,820 cP",
      description: "Non-Newtonian heavy oil rheology triggers exponential flow resistance inside production tubing.",
      parameterBadge: "Viscosity: 5,820 cP (+11.4%)",
      action: () => {
        setSimulationDay(25);
      },
    },
    {
      step: 3,
      title: "3. Fluid Drag Surge",
      headline: "Viscous Drag Climbs to 7,840 lb (43% Buoyant Rod Weight)",
      description: "Hydrodynamic wall shear stress opposes the gravitational falling velocity of the 1,040m sucker rod string.",
      parameterBadge: "Drag: 7,840 lb",
      action: () => {
        setSimulationDay(30);
      },
    },
    {
      step: 4,
      title: "4. Downstroke Delay & Dynagraph Sag",
      headline: "Polished Rod Carrier Bar Descends Faster Than Rod String",
      description: "Sucker rod experiences compressive slackline tendency; lower surface dynagraph collapses upwards.",
      parameterBadge: "Minimum Load: 3,420 lb",
      action: () => {
        setSimulationDay(35);
      },
    },
    {
      step: 5,
      title: "5. Rod-Floating & Buckling Hazard Alarm",
      headline: "Twin Prognostic Model Triggers Rod-Floating Critical Warning",
      description: "Compressive rod buckling probability reaches 64%, creating severe shock loads on subsequent upstroke pickup.",
      parameterBadge: "Floating Risk: 64% (CRITICAL)",
      action: () => {
        setSimulationDay(35);
      },
    },
    {
      step: 6,
      title: "6. VFD Advisory Modulation & Stabilization",
      headline: "Supervisory VFD Modulation (-17% Downstroke Deceleration) Restores Positive Tension",
      description: "Asymmetric velocity damping decelerates polished rod, allowing rod column to settle safely without compression slack.",
      parameterBadge: "Remediated Risk: 19% (SAFE)",
      action: () => {
        setDemoScenario("COOLING_RESERVOIR");
      },
    },
  ];

  const activeStepData = steps[currentStep - 1];

  const handleStepChange = (newStep: number) => {
    const clamped = Math.max(1, Math.min(6, newStep));
    setCurrentStep(clamped);
    steps[clamped - 1].action();
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 6) {
          setIsPlaying(false);
          return 6;
        }
        const next = prev + 1;
        steps[next - 1].action();
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="bg-surface rounded-md border-2 border-oil-charcoal p-4 space-y-3 font-mono shadow-panel select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-oil-red text-white flex items-center justify-center font-bold text-xs">
            {currentStep}/6
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
              Guided Physical Failure Replay (SIMULATED SCENARIO)
            </h3>
            <span className="text-[10px] text-text-secondary">
              Observe step-by-step causal mechanics from thermal decline to VFD remediation
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
              isPlaying
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "bg-oil-red text-white hover:bg-oil-redDark"
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? "PAUSE REPLAY" : "PLAY SEQUENCE"}</span>
          </button>

          <button
            onClick={() => handleStepChange(1)}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-6 gap-1">
        {steps.map((s) => (
          <button
            key={s.step}
            onClick={() => handleStepChange(s.step)}
            className={`h-2 rounded transition-all ${
              s.step === currentStep
                ? "bg-oil-red ring-2 ring-oil-red/40"
                : s.step < currentStep
                ? "bg-slate-400"
                : "bg-slate-200"
            }`}
            title={`Jump to ${s.title}`}
          />
        ))}
      </div>

      {/* Active Step Dossier */}
      <div className="p-3.5 bg-surface-alt rounded border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-oil-red uppercase">
            {activeStepData.title}
          </span>
          <span className="text-[10px] font-bold bg-surface px-2 py-0.5 rounded border border-slate-300 text-text-primary">
            {activeStepData.parameterBadge}
          </span>
        </div>

        <h4 className="text-sm font-bold text-text-primary font-mono">
          {activeStepData.headline}
        </h4>

        <p className="text-xs text-slate-700 font-sans leading-relaxed">
          {activeStepData.description}
        </p>
      </div>

      {/* Step Navigation Bar */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          onClick={() => handleStepChange(currentStep - 1)}
          disabled={currentStep === 1}
          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-300 font-medium flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous Step</span>
        </button>

        <span className="text-[11px] text-slate-500 font-bold">
          Step {currentStep} of 6
        </span>

        <button
          onClick={() => handleStepChange(currentStep + 1)}
          disabled={currentStep === 6}
          className="px-3 py-1 rounded bg-oil-charcoal text-white hover:bg-black disabled:opacity-30 font-bold flex items-center gap-1"
        >
          <span>Next Step</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
