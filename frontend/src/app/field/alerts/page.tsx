"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Filter,
  Check,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useDataProvider } from "../../../data/DataProviderContext";
import { AlertItem } from "../../../data/types";
import { PageHeader } from "../../../components/ui/PageHeader";

export default function FieldAlertsPage() {
  const provider = useDataProvider();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [wellFilter, setWellFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = () => {
    setIsLoading(true);
    provider.getAlerts().then((res) => {
      setAlerts(res);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadAlerts();
  }, [provider]);

  const handleAcknowledge = async (alertId: string) => {
    await provider.acknowledgeAlert(alertId);
    loadAlerts();
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = severityFilter === "ALL" || a.severity === severityFilter;
    const matchesWell = wellFilter === "ALL" || a.wellId === wellFilter;
    return matchesSev && matchesWell;
  });

  const uniqueWells = Array.from(new Set(alerts.map((a) => a.wellId)));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        icon={<Bell className="w-5 h-5 text-status-warn" />}
        title="Cross-Well Engineering Alerts & Operational Events"
        subtitle="Real-Time SCADA Alarms · Prognostic Mechanical Faults · Economic Cut-Off Notifications"
        actions={
          <div className="flex items-center gap-1 bg-surface-1 p-1 rounded-lg border border-line text-xs font-sans">
            {(["ALL", "critical", "warning", "info"] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-0.5 rounded uppercase font-semibold text-[10px] transition-colors ${
                  severityFilter === sev
                    ? "bg-accent-mechanical text-surface-0 font-bold"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        }
      />

      {/* Main Alerts List & Details */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-surface-1 border border-line rounded-lg text-text-muted font-sans text-xs">
            No active alerts match the selected criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === "critical";
            const isWarn = alert.severity === "warning";

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-colors shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCrit
                    ? "bg-status-critical/5 border-status-critical/40"
                    : isWarn
                    ? "bg-status-warn/5 border-status-warn/30"
                    : "bg-surface-1 border-line hover:border-line-strong"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {isCrit ? (
                      <ShieldAlert className="w-5 h-5 text-status-critical animate-pulse" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-5 h-5 text-status-warn" />
                    ) : (
                      <Info className="w-5 h-5 text-status-info" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-text-primary px-1.5 py-0.5 rounded bg-surface-0 border border-line">
                        {alert.wellId}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          isCrit
                            ? "bg-status-critical/20 text-status-critical"
                            : isWarn
                            ? "bg-status-warn/20 text-status-warn"
                            : "bg-status-info/20 text-status-info"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[11px] font-mono text-text-muted">{alert.timestamp}</span>
                    </div>

                    <h3 className="font-sans font-bold text-sm text-text-primary leading-snug">
                      {alert.title}
                    </h3>
                    <p className="text-xs font-sans text-text-secondary leading-relaxed">
                      {alert.condition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  {alert.routeLink && (
                    <Link
                      href={alert.routeLink}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-xs font-sans font-medium text-text-primary hover:text-accent-mechanical transition-colors"
                    >
                      <span>Investigate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {!alert.isAcknowledged && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-safe text-surface-0 text-xs font-sans font-semibold hover:bg-status-safe/90 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
