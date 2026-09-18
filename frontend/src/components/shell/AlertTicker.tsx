"use client";

/**
 * TEL PRAGATI — Alert Ticker Rail
 *
 * A thin, always-scrolling marquee carrying every open alert and warning.
 * Sits directly beneath the TopBar on every authenticated page.
 * Hovering pauses the scroll; clicking an item jumps to its investigation route.
 */

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Info, Radio, ShieldAlert } from "lucide-react";
import { useAlertFeed, FeedAlert, FeedSeverity } from "../providers/AlertFeedProvider";

const SEVERITY_STYLE: Record<FeedSeverity, { text: string; dot: string; label: string }> = {
  critical: { text: "text-status-critical", dot: "bg-status-critical", label: "CRITICAL" },
  warning: { text: "text-status-warn", dot: "bg-status-warn", label: "WARNING" },
  info: { text: "text-status-info", dot: "bg-status-info", label: "INFO" },
};

function SeverityIcon({ severity }: { severity: FeedSeverity }) {
  if (severity === "critical") return <ShieldAlert className="w-3 h-3 flex-shrink-0" />;
  if (severity === "warning") return <AlertTriangle className="w-3 h-3 flex-shrink-0" />;
  return <Info className="w-3 h-3 flex-shrink-0" />;
}

function TickerItem({
  alert,
  onSelect,
}: {
  alert: FeedAlert;
  onSelect: (alert: FeedAlert) => void;
}) {
  const style = SEVERITY_STYLE[alert.severity];

  return (
    <button
      type="button"
      onClick={() => onSelect(alert)}
      className="group inline-flex items-center gap-2 px-4 h-7 whitespace-nowrap border-r border-line/70 hover:bg-surface-2/60 transition-colors"
      title={alert.condition}
    >
      <span className={`flex items-center gap-1.5 ${style.text}`}>
        <SeverityIcon severity={alert.severity} />
        <span className="font-mono text-[10px] font-bold tracking-widest">{style.label}</span>
      </span>

      <span className="font-mono text-[10px] text-text-muted">·</span>

      <span className="font-mono text-[10px] font-bold text-text-secondary tracking-wide">
        {alert.wellId}
      </span>

      <span className="font-sans text-[11px] text-text-primary group-hover:underline decoration-dotted underline-offset-2">
        {alert.title}
      </span>

      {alert.condition && (
        <span className="font-sans text-[11px] text-text-muted">— {alert.condition}</span>
      )}

      <span className="font-mono text-[10px] text-text-disabled">{alert.timestamp}</span>
    </button>
  );
}

export function AlertTicker() {
  const router = useRouter();
  const { unacknowledged, criticalCount, warningCount, alertLevel } = useAlertFeed();

  const items = unacknowledged;

  // Duplicate the run so the -50% keyframe loops seamlessly.
  const track = useMemo(() => [...items, ...items], [items]);

  // Longer feeds need proportionally longer cycles to keep a constant speed.
  const duration = useMemo(() => {
    const perItemSeconds = 7;
    return `${Math.max(28, items.length * perItemSeconds)}s`;
  }, [items.length]);

  const handleSelect = (alert: FeedAlert) => {
    router.push(alert.routeLink || "/field/alerts");
  };

  const railAccent =
    alertLevel === "critical"
      ? "border-status-critical/35"
      : alertLevel === "warning"
      ? "border-status-warn/30"
      : "border-line";

  return (
    <div
      className={`h-7 flex-shrink-0 bg-surface-2 border-b ${railAccent} flex items-stretch select-none z-20`}
      role="status"
      aria-live="polite"
      aria-label="Live alert ticker"
    >
      {/* Fixed leading badge */}
      <div className="flex items-center gap-2 px-3 border-r border-line flex-shrink-0 bg-surface-3/60">
        <span className="relative flex items-center">
          <Radio
            className={`w-3 h-3 ${
              alertLevel === "critical"
                ? "text-status-critical"
                : alertLevel === "warning"
                ? "text-status-warn"
                : "text-status-safe"
            }`}
          />
        </span>
        <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-text-secondary hidden sm:inline">
          LIVE ALERTS
        </span>
        <span className="flex items-center gap-1">
          {criticalCount > 0 && (
            <span className="font-mono text-[9px] font-bold px-1.5 rounded-full bg-status-critical/20 text-status-critical">
              {criticalCount}C
            </span>
          )}
          {warningCount > 0 && (
            <span className="font-mono text-[9px] font-bold px-1.5 rounded-full bg-status-warn/20 text-status-warn">
              {warningCount}W
            </span>
          )}
        </span>
      </div>

      {/* Scrolling body */}
      <div className="ticker-viewport flex-1">
        {items.length === 0 ? (
          <div className="h-7 flex items-center px-4 gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse-subtle" />
            <span className="font-mono text-[10px] tracking-wide text-text-muted">
              ALL SYSTEMS NOMINAL · NO UNACKNOWLEDGED ALERTS ACROSS MONITORED WELLS
            </span>
          </div>
        ) : (
          <div
            className="ticker-track"
            style={{ ["--ticker-duration" as string]: duration }}
          >
            {track.map((alert, index) => (
              <TickerItem
                key={`${alert.id}-${index}`}
                alert={alert}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed trailing action */}
      <button
        type="button"
        onClick={() => router.push("/field/alerts")}
        className="px-3 border-l border-line flex-shrink-0 bg-surface-3/60 font-mono text-[10px] font-bold tracking-widest text-text-muted hover:text-text-primary transition-colors hidden sm:block"
      >
        VIEW ALL
      </button>
    </div>
  );
}
