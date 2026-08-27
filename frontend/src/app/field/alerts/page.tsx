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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-status-warn" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Cross-Well Engineering Alerts & Operational Events
            </h1>
          </div>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Real-Time SCADA Alarms · Prognostic Mechanical Faults · Economic Cut-Off Notifications
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1 bg-surface-1 p-0.5 rounded border border-line text-xs font-mono">
          {(["ALL", "critical", "warning", "info"] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded uppercase font-bold text-[10px] transition-colors ${
                severityFilter === sev
                  ? "bg-surface-2 text-accent-mechanical border border-line"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Main Alerts List & Details */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-surface-1 border border-line rounded-lg text-text-muted font-mono text-xs">
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
                    ? "bg-status-critical/10 border-status-critical/40"
                    : isWarn
                    ? "bg-status-warn/5 border-status-warn/30"
                    : "bg-surface-1 border-line"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        isCrit
                          ? "bg-status-critical text-white"
                          : isWarn
                          ? "bg-status-warn/20 text-status-warn font-bold"
                          : "bg-surface-2 text-text-muted"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-mono text-xs font-bold text-accent-mechanical">
                      {alert.wellId}
                    </span>
                    <span className="text-xs text-text-muted font-mono">• {alert.timestamp}</span>
                    {alert.isAcknowledged && (
                      <span className="text-[10px] font-mono text-status-safe bg-status-safe/10 px-1.5 py-0.2 rounded border border-status-safe/30">
                        Acknowledged
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm text-text-primary leading-tight">
                    {alert.title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-text-muted pt-1">
                    <div>
                      <strong className="text-text-primary">Condition: </strong>
                      {alert.condition}
                    </div>
                    <div>
                      <strong className="text-accent-thermal">Recommended Action: </strong>
                      {alert.recommendation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  {alert.routeLink && (
                    <Link
                      href={alert.routeLink}
                      className="px-3 py-1.5 rounded bg-surface-2 hover:bg-line border border-line text-xs font-mono text-text-primary flex items-center gap-1 transition-colors"
                    >
                      <span>Inspect Twin</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {!alert.isAcknowledged && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-status-safe text-white text-xs font-medium hover:bg-status-safe/90 transition-colors shadow-glowMechanical"
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
