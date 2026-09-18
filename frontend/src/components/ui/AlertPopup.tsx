"use client";

/**
 * TEL PRAGATI — Centre-Screen Alert Popup
 *
 * When an alert is raised it now interrupts the operator in the middle of the
 * screen rather than only landing silently in the notification tray.
 * Acknowledging here acknowledges through the same data provider the tray and
 * the alerts page already use, so all three surfaces stay consistent.
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";
import { useAlertFeed, FeedSeverity } from "../providers/AlertFeedProvider";

const SEVERITY_THEME: Record<
  FeedSeverity,
  {
    label: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    ring: string;
    sheen: string;
    bar: string;
  }
> = {
  critical: {
    label: "Critical Alarm",
    accentText: "text-status-critical",
    accentBg: "bg-status-critical/15",
    accentBorder: "border-status-critical/45",
    ring: "ring-status-critical/25",
    sheen: "alert-sheen-critical",
    bar: "bg-status-critical",
  },
  warning: {
    label: "Warning",
    accentText: "text-status-warn",
    accentBg: "bg-status-warn/15",
    accentBorder: "border-status-warn/40",
    ring: "ring-status-warn/20",
    sheen: "alert-sheen-warning",
    bar: "bg-status-warn",
  },
  info: {
    label: "Advisory",
    accentText: "text-status-info",
    accentBg: "bg-status-info/15",
    accentBorder: "border-status-info/40",
    ring: "ring-status-info/20",
    sheen: "alert-sheen-info",
    bar: "bg-status-info",
  },
};

function SeverityGlyph({ severity }: { severity: FeedSeverity }) {
  if (severity === "critical") return <ShieldAlert className="w-5 h-5" />;
  if (severity === "warning") return <AlertTriangle className="w-5 h-5" />;
  return <Info className="w-5 h-5" />;
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <span className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span className="block font-sans text-xs text-text-secondary leading-relaxed">
        {value}
      </span>
    </div>
  );
}

export function AlertPopup() {
  const router = useRouter();
  const { popupAlert, popupQueueLength, dismissPopup, acknowledge } = useAlertFeed();

  /* Escape dismisses; body scroll locks while the popup owns the screen. */
  useEffect(() => {
    if (!popupAlert) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissPopup();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [popupAlert, dismissPopup]);

  if (!popupAlert) return null;

  const theme = SEVERITY_THEME[popupAlert.severity];

  const handleInvestigate = () => {
    const target = popupAlert.routeLink || "/field/alerts";
    dismissPopup();
    router.push(target);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-popup-title"
    >
      {/* Dimmed, blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm alert-overlay-in"
        onClick={dismissPopup}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg rounded-2xl border ${theme.accentBorder} ring-1 ${theme.ring} bg-surface-1 shadow-popup overflow-hidden alert-pop-in`}
      >
        {/* Severity bar */}
        <div className={`h-1 w-full ${theme.bar}`} />

        <div className={theme.sheen}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-line">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${theme.accentBorder} ${theme.accentBg} ${theme.accentText}`}
              >
                <SeverityGlyph severity={popupAlert.severity} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accentText}`}
                  >
                    {theme.label}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-line text-text-secondary">
                    {popupAlert.wellId}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    {popupAlert.timestamp}
                  </span>
                </div>
                <h2
                  id="alert-popup-title"
                  className="mt-1 font-sans text-base font-bold text-text-primary leading-snug"
                >
                  {popupAlert.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissPopup}
              aria-label="Dismiss alert"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-3 max-h-[46vh] overflow-y-auto">
            <DetailRow label="Condition" value={popupAlert.condition} />
            <DetailRow label="Cause (subsurface physics)" value={popupAlert.cause} />
            <DetailRow label="Impact" value={popupAlert.impact} />

            {popupAlert.recommendation && (
              <div
                className={`rounded-xl border ${theme.accentBorder} ${theme.accentBg} p-3`}
              >
                <span className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Recommended engineering action
                </span>
                <p className="mt-1 font-sans text-xs text-text-primary leading-relaxed">
                  {popupAlert.recommendation}
                </p>
              </div>
            )}

            {popupAlert.confidencePercent !== undefined && (
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Model confidence
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className={`h-full ${theme.bar}`}
                    style={{ width: `${popupAlert.confidencePercent}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-bold text-text-secondary">
                  {popupAlert.confidencePercent}%
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-line bg-surface-2 flex items-center justify-between gap-3 flex-wrap">
            <span className="font-mono text-[10px] text-text-muted">
              {popupQueueLength > 0
                ? `${popupQueueLength} more alert${popupQueueLength > 1 ? "s" : ""} queued`
                : "Esc to dismiss"}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInvestigate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-1 border border-line text-xs font-sans font-medium text-text-primary hover:border-line-strong transition-colors"
              >
                <span>Investigate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => acknowledge(popupAlert.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-safe text-surface-0 text-xs font-sans font-semibold hover:bg-status-safe/90 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Acknowledge</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
