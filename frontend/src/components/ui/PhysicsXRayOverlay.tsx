"use client";

import React from "react";
import { ArrowRight, Atom, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";

export const PhysicsXRayOverlay: React.FC = () => {
  const { isPhysicsXRayOpen, setPhysicsXRayOpen, twinState } = useTwinStore();
  const [selectedNodeIndex, setSelectedNodeIndex] = React.useState<number>(0);

  if (!isPhysicsXRayOpen) return null;

  const causalNodes = [
    {
      id: "reservoir_cooling",
      title: "1. Reservoir Cooling",
      subtitle: "Thermal convective-diffusion decay in Jodhpur Sandstone",
      equation: "T_BHT(t) = T_res + (T_peak - T_res) * exp(-? * t)",
      currentVal: `${twinState.bottomholeTemperatureC}Ãƒâ€šÃ‚Â°C`,
      inputVars: "CSS Day (t=25), Injection Peak (195Ãƒâ€šÃ‚Â°C), Reservoir (35Ãƒâ€šÃ‚Â°C)",
      confidence: `${twinState.confidence.thermalModel}%`,
      nextImpact: "Drives oil viscosity up exponentially via Andrade rheology",
    },
    {
      id: "viscosity_rise",
      title: "2. Viscosity Rise",
      subtitle: "Heavy crude non-Newtonian Andrade/Vogel rheology",
      equation: "Ãƒâ€šÃ‚Âµ(T) = A * exp(B / (T + C))",
      currentVal: `${twinState.oilViscosityCentipoise.toLocaleString()} cP`,
      inputVars: "BHT = 74.2Ãƒâ€šÃ‚Â°C, Baghewala 17Ãƒâ€šÃ‚Â° API Crude Constants",
      confidence: `${twinState.confidence.rheologyModel}%`,
      nextImpact: "Amplifies hydrodynamic boundary shear drag against sucker rod string",
    },
    {
      id: "drag_surge",
      title: "3. Fluid Drag Surge",
      subtitle: "Viscous wall shear stress & rod annular displacement drag",
      equation: "F_drag = C_geom * Ãƒâ€šÃ‚Âµ^0.62 * v_downstroke * L_rod",
      currentVal: `${twinState.rodFluidDragPounds.toLocaleString()} lb`,
      inputVars: "Ãƒâ€šÃ‚Âµ = 5,820 cP, SPM = 5.2, L = 1040m, Rod = 7/8 in",
      confidence: `${twinState.confidence.wellboreModel}%`,
      nextImpact: "Opposes downward gravitational falling velocity of sucker rod string",
    },
    {
      id: "rod_dynamics",
      title: "4. Rod Dynamics (Gibbs Wave)",
      subtitle: "1D damped wave equation propagation along 1,040m rod column",
      equation: "?Ãƒâ€šÃ‚Â²u/?tÃƒâ€šÃ‚Â² = aÃƒâ€šÃ‚Â² ?Ãƒâ€šÃ‚Â²u/?xÃƒâ€šÃ‚Â² - c ?u/?t + F_drag/?A",
      currentVal: `${twinState.polishedRodLoadLb.toLocaleString()} lb Peak`,
      inputVars: "E = 30x106 psi, Damping c = 0.048, Stroke = 144 in",
      confidence: "91%",
      nextImpact: "Causes compressive rod slack on downstroke when F_drag > 45% W_buoyant",
    },
    {
      id: "rod_floating",
      title: "5. Rod-Floating & Buckling Risk",
      subtitle: "Compressive rod slackening and valve pickup shock hazard",
      equation: "Risk = f(F_drag / W_rod,buoyant, v_polished_rod)",
      currentVal: `${twinState.rodFloatingRiskPercent}% (WARNING)`,
      inputVars: "W_buoyant = 18,240 lb, F_drag = 7,840 lb (Ratio = 0.43)",
      confidence: "88%",
      nextImpact: "Loss of effective downhole stroke and mechanical fatigue",
    },
    {
      id: "optimizer_remedy",
      title: "6. Optimizer Supervisory Remedy",
      subtitle: "Asymmetric VFD Velocity Profile Modulation",
      equation: "v_downstroke(t) = v_nominal * (1 - 0.17 * sin(pt/T_down))",
      currentVal: "VFD Delta: -17%",
      inputVars: "Target Risk < 25%, Energy Delta: -8.3%, Production Delta: -1.1%",
      confidence: "93%",
      nextImpact: "Returns wellbore to stable, fatigue-free operating envelope",
    },
  ];

  const activeNode = causalNodes[selectedNodeIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-surface rounded-lg border border-app-border shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-app-border bg-surface-alt flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-oil-red text-white flex items-center justify-center font-bold">
              <Atom className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
                Physics X-Ray: Causal Propagation Engine
              </h2>
              <p className="text-xs text-text-secondary font-mono">
                Observe the physics-based chain connecting reservoir thermal decay to SRP rod floating
              </p>
            </div>
          </div>

          <button
            onClick={() => setPhysicsXRayOpen(false)}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Causal Chain Nodes Bar */}
        <div className="p-4 border-b border-app-border bg-slate-50 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {causalNodes.map((node, index) => {
              const isSelected = index === selectedNodeIndex;
              return (
                <React.Fragment key={node.id}>
                  <button
                    onClick={() => setSelectedNodeIndex(index)}
                    className={`p-2.5 rounded border text-left transition-all ${
                      isSelected
                        ? "bg-surface border-oil-red shadow-sm ring-1 ring-oil-red/30"
                        : "bg-surface-alt border-slate-200 hover:bg-surface hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold font-mono text-text-primary">
                        {node.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-oil-red bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        {node.currentVal}
                      </span>
                    </div>
                  </button>
                  {index < causalNodes.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Active Node Detail Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-xs text-oil-red font-bold uppercase tracking-wider">
                  Active Causal Step
                </span>
                <h3 className="text-xl font-bold text-text-primary">{activeNode.title}</h3>
                <p className="text-xs text-text-secondary mt-1 font-sans">{activeNode.subtitle}</p>
              </div>

              {/* Governing Mathematical Formulation */}
              <div className="p-3.5 rounded-md border border-slate-300 bg-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                  Governing Differential Equation / Model:
                </span>
                <code className="text-sm font-bold text-slate-900 block bg-surface p-2 rounded border border-slate-200">
                  {activeNode.equation}
                </code>
              </div>

              {/* Input Variables */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Input State Variables:
                </span>
                <div className="p-2.5 rounded bg-surface border border-slate-200 text-xs text-slate-800">
                  {activeNode.inputVars}
                </div>
              </div>
            </div>

            {/* Right Card: State & Propagation */}
            <div className="space-y-4 bg-surface-alt p-4 rounded-md border border-app-border">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">
                  Current Evaluated State
                </span>
                <div className="text-2xl font-black text-text-primary mt-1">
                  {activeNode.currentVal}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Confidence: {activeNode.confidence}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider block">
                  Forward Causal Impact
                </span>
                <p className="text-xs text-slate-800 mt-1 font-sans">
                  {activeNode.nextImpact}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    if (selectedNodeIndex < causalNodes.length - 1) {
                      setSelectedNodeIndex(selectedNodeIndex + 1);
                    }
                  }}
                  disabled={selectedNodeIndex === causalNodes.length - 1}
                  className="w-full py-2 rounded bg-oil-red hover:bg-oil-redDark disabled:opacity-40 text-white text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1"
                >
                  <span>Next Causal Stage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-app-border bg-surface-alt flex items-center justify-between text-xs font-mono text-text-secondary">
          <span>Baghewala Heavy Oil Jodhpur Sandstone Model (v0.8)</span>
          <button
            onClick={() => setPhysicsXRayOpen(false)}
            className="px-4 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-text-primary font-medium transition-colors"
          >
            Close X-Ray
          </button>
        </div>
      </div>
    </div>
  );
};
