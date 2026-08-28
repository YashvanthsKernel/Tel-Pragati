"use client";

import React, { useState } from "react";
import { Shield, ShieldAlert, CheckCircle, AlertTriangle, Edit2, Check } from "lucide-react";
import { InterlockStatus } from "../../data/types";
import { RoleGate } from "../shell/RoleGate";

interface InterlockRowProps {
  interlock: InterlockStatus;
  onUpdateLimit?: (newLimit: number) => Promise<void>;
}

export function InterlockRow({ interlock, onUpdateLimit }: InterlockRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(interlock.limit.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(newLimit);
    if (isNaN(parsed) || !onUpdateLimit) return;
    setIsSaving(true);
    try {
      await onUpdateLimit(parsed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isTripped = interlock.tripped;
  const isNearLimit = interlock.currentValue >= interlock.limit * 0.85;
  const marginVal = interlock.limit - interlock.currentValue;
  const marginPct = ((marginVal / Math.max(1, interlock.limit)) * 100).toFixed(0);

  return (
    <div
      className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
        isTripped
          ? "bg-status-critical/10 border-status-critical/40"
          : isNearLimit
          ? "bg-status-warn/5 border-status-warn/30"
          : "bg-surface-1 border-line hover:border-line-strong"
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="mt-0.5 flex-shrink-0">
          {isTripped ? (
            <ShieldAlert className="w-4 h-4 text-status-critical animate-pulse" />
          ) : isNearLimit ? (
            <AlertTriangle className="w-4 h-4 text-status-warn" />
          ) : (
            <Shield className="w-4 h-4 text-status-safe" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-sans font-semibold text-xs text-text-primary">{interlock.name}</span>
            <span
              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                isTripped
                  ? "bg-status-critical text-white"
                  : interlock.armed
                  ? "bg-status-safe/10 text-status-safe border border-status-safe/30"
                  : "bg-surface-2 text-text-muted"
              }`}
            >
              {isTripped ? "TRIPPED" : interlock.armed ? "ARMED" : "BYPASS"}
            </span>
          </div>
          {interlock.description && (
            <p className="text-[11px] font-sans text-text-muted mt-0.5 truncate">{interlock.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-5 text-xs font-mono flex-shrink-0">
        {/* Margin to Trip */}
        <div className="text-right hidden sm:block">
          <div className="text-[9px] font-mono text-text-muted uppercase">Margin to Trip</div>
          <div className={`font-mono text-xs font-bold ${isTripped ? "text-status-critical" : isNearLimit ? "text-status-warn" : "text-status-safe"}`}>
            {isTripped ? "0% (EXCEEDED)" : `+${marginVal > 0 ? marginVal.toLocaleString() : 0} ${interlock.unit} (${marginPct}%)`}
          </div>
        </div>

        {/* Current vs Trip limit */}
        <div className="text-right border-l border-line pl-4">
          <div className="text-[9px] font-mono text-text-muted uppercase">Current / Threshold</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`font-bold font-mono text-sm ${
                isTripped
                  ? "text-status-critical"
                  : isNearLimit
                  ? "text-status-warn"
                  : "text-text-primary"
              }`}
            >
              {interlock.currentValue.toLocaleString()}
            </span>
            <span className="text-text-muted">/</span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-16 px-1.5 py-0.5 rounded bg-surface-0 border border-line text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-1 rounded bg-status-safe text-white hover:bg-status-safe/90"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 font-mono text-text-muted">
                <span>{interlock.limit.toLocaleString()} {interlock.unit}</span>
                <RoleGate roles={["engineer", "admin"]}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-accent-mechanical transition-colors"
                    title="Modify Safety Trip Limit (Engineer/Admin)"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </RoleGate>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
