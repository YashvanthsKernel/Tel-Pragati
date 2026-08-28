"use client";

import React from "react";

interface PageHeaderProps {
  wellId?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: "live" | "warn" | "offline" | "safe" | "critical";
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  wellId,
  icon,
  title,
  subtitle,
  status = "live",
  badge,
  actions,
  className = "",
}: PageHeaderProps) {
  const statusDotColor =
    status === "live" || status === "safe"
      ? "bg-status-safe"
      : status === "warn"
      ? "bg-status-warn"
      : status === "critical"
      ? "bg-status-critical"
      : "bg-text-disabled";

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line mb-5 ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {wellId && (
            <span className="px-2 py-0.5 rounded bg-surface-2 border border-line text-xs font-mono font-bold text-accent-mechanical">
              {wellId}
            </span>
          )}
          {icon && <span className="text-text-muted flex-shrink-0">{icon}</span>}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusDotColor} animate-pulse-subtle flex-shrink-0`} />
            <h1 className="text-xl sm:text-2xl font-sans font-bold text-text-primary tracking-tight">
              {title}
            </h1>
          </div>
          {badge && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-accent-thermal border border-accent-thermal/30 font-medium">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs font-sans text-text-secondary leading-relaxed pl-4 sm:pl-0">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0 pt-0.5">
          {actions}
        </div>
      )}
    </div>
  );
}

