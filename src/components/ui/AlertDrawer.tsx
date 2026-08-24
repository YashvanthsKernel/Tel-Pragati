"use client";

import React from "react";
import { AlertOctagon, AlertTriangle, Check, CheckCircle2, ChevronRight, Info, X } from "lucide-react";
import { useTwinStore } from "../../store/useTwinStore";
import { StatusPill } from "./StatusPill";
import { ConfidenceBadge } from "./ConfidenceBadge";
import Link from "next/link";

export const AlertDrawer: React.FC = () => {
  const {
    activeAlerts,
    isAlertDrawerOpen,
    setAlertDrawerOpen,
    acknowledgeAlert,
  } = useTwinStore();

  if (!isAlertDrawerOpen) return null;

  const unackCount = activeAlerts.filter((a) => !a.isAcknowledged).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-[2px] transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-surface border-l border-app-border shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-app-border bg-surface-alt flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-oil-red/10 border border-oil-red/20 flex items-center justify-center text-oil-red">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary tracking-wide uppercase font-mono">
                  Engineering Alert Log
                </h2>
                <p className="text-xs text-text-secondary">
                  Baghewala Digital Twin Diagnostic & Supervisory Events ({unackCount} Unacknowledged)
                </p>
              </div>
            </div>

            <button
              onClick={() => setAlertDrawerOpen(false)}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeAlerts.map((alert) => {
              const isCrit = alert.severity === "CRITICAL";
              const isWarn = alert.severity === "WARNING";

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-md border text-xs space-y-3 transition-all ${
                    alert.isAcknowledged
                      ? "bg-surface-alt/60 border-slate-200 opacity-80"
                      : isCrit
                      ? "bg-red-50/40 border-red-300 ring-1 ring-red-300/40"
                      : isWarn
                      ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/40"
                      : "bg-surface border-slate-200"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusPill variant={alert.severity} size="sm" />
                      <span className="font-mono font-bold text-text-primary text-xs">
                        {alert.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-text-secondary">{alert.timestamp}</span>
                      <ConfidenceBadge value={alert.confidencePercent} size="sm" />
                    </div>
                  </div>

                  {/* Condition & Cause */}
                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-300 font-mono">
                    <div>
                      <span className="font-semibold text-slate-500 uppercase text-[10px] block">Condition:</span>
                      <span className="text-text-primary text-[11px]">{alert.condition}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 uppercase text-[10px] block">Cause (Subsurface Physics):</span>
                      <span className="text-slate-800 text-[11px]">{alert.cause}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 uppercase text-[10px] block">Impact:</span>
                      <span className="text-slate-800 text-[11px]">{alert.impact}</span>
                    </div>
                  </div>

                  {/* Recommendation Box */}
                  <div className="bg-surface p-2.5 rounded border border-slate-200 flex items-start gap-2">
                    <div className="text-oil-red mt-0.5">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-[10px] text-oil-charcoal uppercase tracking-wider block">
                        Recommended Engineering Action:
                      </span>
                      <p className="text-text-primary font-mono text-[11px] mt-0.5">
                        {alert.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    {alert.routeLink ? (
                      <Link
                        href={alert.routeLink}
                        onClick={() => setAlertDrawerOpen(false)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-oil-red hover:underline font-mono"
                      >
                        Investigate in {alert.routeLink.replace("/", "").toUpperCase()}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span />
                    )}

                    {!alert.isAcknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs border border-slate-300 font-medium transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Acknowledge
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-app-border bg-surface-alt flex items-center justify-between text-xs font-mono text-text-secondary">
            <span>SCADA Duplex Polling: 1000ms</span>
            <span>Oil India Limited - Baghewala Ops</span>
          </div>
        </div>
      </div>
    </div>
  );
};
