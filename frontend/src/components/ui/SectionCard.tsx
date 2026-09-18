"use client";

import React from "react";

interface SectionCardProps {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  accent?: "amber" | "mechanical" | "thermal" | "critical" | "warn" | "safe" | "brand" | "none";
  /** Colour + translucent wash applied when this panel is itself reporting an alert. */
  status?: "critical" | "warn" | "safe" | "info" | "none";
  /** Breathing rim for a panel that is the live source of an unacknowledged alert. */
  pulse?: boolean;
  /** Opt out of the translucent glass treatment (charts, maps, canvases). */
  solid?: boolean;
}

const accentPill: Record<string, string> = {
  amber:      "text-accent-amber",
  mechanical: "text-accent-mechanical",
  thermal:    "text-accent-thermal",
  critical:   "text-status-critical",
  warn:       "text-status-warn",
  safe:       "text-status-safe",
  brand:      "text-brand",
  none:       "text-text-muted",
};

/* Severity washes are defined once in globals.css so every surface matches. */
const statusPanel: Record<string, string> = {
  critical: "panel-critical",
  warn:     "panel-warn",
  safe:     "panel-safe",
  info:     "panel-info",
  none:     "",
};

const statusHeader: Record<string, string> = {
  critical: "border-status-critical/30",
  warn:     "border-status-warn/30",
  safe:     "border-status-safe/30",
  info:     "border-status-info/30",
  none:     "border-line",
};

export function SectionCard({
  title,
  icon,
  action,
  children,
  className = "",
  noPadding = false,
  accent = "none",
  status = "none",
  pulse = false,
  solid = false,
}: SectionCardProps) {
  const pulseClass =
    pulse && status === "critical"
      ? "panel-pulse-critical"
      : pulse && status === "warn"
      ? "panel-pulse-warn"
      : "";

  return (
    <div
      className={`bg-surface-1 border border-line rounded-xl shadow-card transition-colors duration-300 ${
        solid ? "no-glass" : ""
      } ${statusPanel[status]} ${pulseClass} ${className}`}
    >
      {title && (
        <div
          className={`flex items-center justify-between px-4 py-3 border-b rounded-t-xl ${statusHeader[status]}`}
        >
          <div className="flex items-center gap-2">
            {icon && <span className={`${accentPill[accent]} flex-shrink-0`}>{icon}</span>}
            <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              {title}
            </span>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </div>
  );
}
