"use client";

import React, { useState } from "react";
import { Database, Radio, CheckCircle, AlertTriangle } from "lucide-react";
import { useDataModeStore } from "../../state/useDataModeStore";

export function DataModeToggle() {
  const { mode, toggleMode } = useDataModeStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggle = () => {
    toggleMode();
    const nextMode = mode === "demo" ? "live" : "demo";
    if (nextMode === "live") {
      setToastMessage("Connecting to Live SCADA backend telemetry channel...");
    } else {
      setToastMessage("Switched to Synthetic Demo Mode (deterministic physics simulation).");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
          mode === "live"
            ? "bg-accent-thermal/10 text-accent-thermal border-accent-thermal/40 hover:bg-accent-thermal/20"
            : "bg-surface-2 text-text-muted border-line hover:text-text-primary hover:bg-line"
        }`}
        title="Toggle between Synthetic Demo Mode and Live SCADA Backend Telemetry"
      >
        {mode === "live" ? (
          <Radio className="w-3.5 h-3.5 animate-pulse text-accent-thermal" />
        ) : (
          <Database className="w-3.5 h-3.5 text-accent-mechanical" />
        )}
        <span>{mode === "live" ? "LIVE SCADA" : "DEMO SYNTHETIC"}</span>
      </button>

      {toastMessage && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-surface-1 border border-line shadow-popup p-2.5 rounded text-xs text-text-primary flex items-center gap-2 whitespace-nowrap animate-fade-in">
          {mode === "live" ? (
            <AlertTriangle className="w-4 h-4 text-status-warn flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-status-safe flex-shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
