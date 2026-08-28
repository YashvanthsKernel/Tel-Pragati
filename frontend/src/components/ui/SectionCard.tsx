"use client";

import React from "react";

interface SectionCardProps {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  accent?: "amber" | "mechanical" | "thermal" | "critical" | "warn" | "safe" | "none";
}

const accentPill: Record<string, string> = {
  amber:      "text-accent-amber",
  mechanical: "text-accent-mechanical",
  thermal:    "text-accent-thermal",
  critical:   "text-status-critical",
  warn:       "text-status-warn",
  safe:       "text-status-safe",
  none:       "text-text-muted",
};

export function SectionCard({
  title,
  icon,
  action,
  children,
  className = "",
  noPadding = false,
  accent = "none",
}: SectionCardProps) {
  return (
    <div
      className={`bg-surface-1 border border-line rounded-lg shadow-card ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-surface-2/60 rounded-t-lg">
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
