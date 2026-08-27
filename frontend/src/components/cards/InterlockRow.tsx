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

  return (
    <div
      className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
        isTripped
          ? "bg-status-critical/10 border-status-critical/40"
          : isNearLimit
          ? "bg-status-warn/5 border-status-warn/30"
          : "bg-surface-1 border-line hover:border-text-muted/30"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">
          {isTripped ? (
            <ShieldAlert className="w-4 h-4 text-status-critical flex-shrink-0 animate-bounce" />
          ) : isNearLimit ? (
            <AlertTriangle className="w-4 h-4 text-status-warn flex-shrink-0" />
          ) : (
            <Shield className="w-4 h-4 text-status-safe flex-shrink-0" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-text-primary">{interlock.name}</span>
            <span
              className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                isTripped
                  ? "bg-status-critical text-white"
                  : interlock.armed
                  ? "bg-status-safe/20 text-status-safe"
                  : "bg-surface-2 text-text-muted"
              }`}
            >
              {isTripped ? "TRIPPED" : interlock.armed ? "ARMED" : "BYPASS"}
            </span>
          </div>
          {interlock.description && (
            <p className="text-[11px] text-text-muted mt-0.5">{interlock.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono">
        <div className="text-right">
          <div className="text-[10px] text-text-muted uppercase">Current Value</div>
          <div
            className={`font-bold text-sm ${
              isTripped
                ? "text-status-critical"
                : isNearLimit
                ? "text-status-warn"
                : "text-text-primary"
            }`}
          >
            {interlock.currentValue.toLocaleString()} {interlock.unit}
          </div>
        </div>

        <div className="text-right border-l border-line pl-3">
          <div className="text-[10px] text-text-muted uppercase">Trip Limit</div>
          {isEditing ? (
            <div className="flex items-center gap-1 mt-0.5">
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
            <div className="flex items-center gap-1.5 text-text-muted">
              <span className="font-semibold text-text-primary">
                {interlock.limit.toLocaleString()} {interlock.unit}
              </span>
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
  );
}
