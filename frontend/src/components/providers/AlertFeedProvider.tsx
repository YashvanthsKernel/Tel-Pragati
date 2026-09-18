"use client";

/**
 * TEL PRAGATI — Unified Alert Feed
 *
 * Single subscription point for every alert surface in the shell:
 *   · the scrolling ticker rail          (AlertTicker)
 *   · the centre-screen popup            (AlertPopup)
 *   · the app-wide severity wash on panels (data-alert-level on <html>)
 *
 * Purely additive: it reads from the existing DigitalTwinDataProvider and the
 * existing twin store. No provider contract, route or page structure changes.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDataProvider } from "../../data/DataProviderContext";
import { AlertItem } from "../../data/types";
import { useTwinStore } from "../../store/useTwinStore";

export type FeedSeverity = "critical" | "warning" | "info";

export interface FeedAlert {
  id: string;
  wellId: string;
  severity: FeedSeverity;
  title: string;
  timestamp: string;
  condition: string;
  cause?: string;
  impact?: string;
  recommendation?: string;
  confidencePercent?: number;
  isAcknowledged: boolean;
  routeLink?: string;
}

interface AlertFeedContextValue {
  /** Every known alert, highest severity first. */
  alerts: FeedAlert[];
  /** Unacknowledged subset — what the ticker and badges care about. */
  unacknowledged: FeedAlert[];
  criticalCount: number;
  warningCount: number;
  /** Worst unacknowledged severity, or "none". Mirrored onto <html data-alert-level>. */
  alertLevel: FeedSeverity | "none";
  /** Alert currently demanding a centre-screen popup, if any. */
  popupAlert: FeedAlert | null;
  /** How many more are waiting behind the current popup. */
  popupQueueLength: number;
  dismissPopup: () => void;
  acknowledge: (alertId: string) => void;
  refresh: () => void;
}

const SEVERITY_RANK: Record<FeedSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const POLL_INTERVAL_MS = 20_000;

const AlertFeedContext = createContext<AlertFeedContextValue>({
  alerts: [],
  unacknowledged: [],
  criticalCount: 0,
  warningCount: 0,
  alertLevel: "none",
  popupAlert: null,
  popupQueueLength: 0,
  dismissPopup: () => {},
  acknowledge: () => {},
  refresh: () => {},
});

function normaliseSeverity(raw: string): FeedSeverity {
  const value = String(raw || "").toLowerCase();
  if (value === "critical") return "critical";
  if (value === "warning" || value === "warn") return "warning";
  return "info";
}

function fromAlertItem(item: AlertItem): FeedAlert {
  return {
    id: item.id,
    wellId: item.wellId,
    severity: normaliseSeverity(item.severity),
    title: item.title,
    timestamp: item.timestamp,
    condition: item.condition,
    cause: item.cause,
    impact: item.impact,
    recommendation: item.recommendation,
    confidencePercent: item.confidencePercent,
    isAcknowledged: item.isAcknowledged,
    routeLink: item.routeLink,
  };
}

export function AlertFeedProvider({ children }: { children: React.ReactNode }) {
  const provider = useDataProvider();

  // Physics-derived alerts from the twin store (these change with scenario/day)
  const twinAlerts = useTwinStore((s) => s.activeAlerts);
  const twinWellId = useTwinStore((s) => s.selectedWellId);
  const acknowledgeTwinAlert = useTwinStore((s) => s.acknowledgeAlert);

  const [providerAlerts, setProviderAlerts] = useState<FeedAlert[]>([]);
  const [popupQueue, setPopupQueue] = useState<FeedAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const hasSeededRef = useRef(false);

  /* ── Poll the active data provider ─────────────────────── */
  const refresh = useCallback(() => {
    let cancelled = false;
    provider
      .getAlerts()
      .then((items) => {
        if (cancelled) return;
        setProviderAlerts(items.map(fromAlertItem));
      })
      .catch(() => {
        /* transport hiccup — keep the last good feed on screen */
      });
    return () => {
      cancelled = true;
    };
  }, [provider]);

  useEffect(() => {
    const cancel = refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancel?.();
      clearInterval(id);
    };
  }, [refresh]);

  /* ── Merge both sources into one ordered feed ──────────── */
  const alerts = useMemo(() => {
    const merged = new Map<string, FeedAlert>();

    providerAlerts.forEach((a) => merged.set(a.id, a));

    twinAlerts.forEach((a) => {
      const key = `twin:${a.id}`;
      merged.set(key, {
        id: key,
        wellId: twinWellId,
        severity: normaliseSeverity(a.severity),
        title: a.title,
        timestamp: a.timestamp,
        condition: a.condition,
        cause: a.cause,
        impact: a.impact,
        recommendation: a.recommendation,
        confidencePercent: a.confidencePercent,
        isAcknowledged: a.isAcknowledged,
        routeLink: a.routeLink,
      });
    });

    return Array.from(merged.values()).sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    );
  }, [providerAlerts, twinAlerts, twinWellId]);

  const unacknowledged = useMemo(
    () => alerts.filter((a) => !a.isAcknowledged),
    [alerts]
  );

  /* ── Queue popups ──────────────────────────────────────────
     First sync surfaces the single most severe open alert so the
     operator is never blind on entry. After that, only genuinely
     new alert IDs interrupt the screen.                          */
  useEffect(() => {
    if (alerts.length === 0) return;

    const seen = seenIdsRef.current;

    if (!hasSeededRef.current) {
      hasSeededRef.current = true;
      alerts.forEach((a) => seen.add(a.id));

      const opening = unacknowledged.find((a) => a.severity !== "info");
      if (opening) setPopupQueue([opening]);
      return;
    }

    const arrivals = alerts.filter(
      (a) => !seen.has(a.id) && !a.isAcknowledged && a.severity !== "info"
    );
    alerts.forEach((a) => seen.add(a.id));

    if (arrivals.length > 0) {
      setPopupQueue((prev) => {
        const known = new Set(prev.map((p) => p.id));
        return [...prev, ...arrivals.filter((a) => !known.has(a.id))];
      });
    }
  }, [alerts, unacknowledged]);

  /* ── Keep <html data-alert-level> in sync ───────────────── */
  const alertLevel: FeedSeverity | "none" = useMemo(() => {
    if (unacknowledged.some((a) => a.severity === "critical")) return "critical";
    if (unacknowledged.some((a) => a.severity === "warning")) return "warning";
    if (unacknowledged.length > 0) return "info";
    return "none";
  }, [unacknowledged]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-alert-level", alertLevel);
    return () => {
      document.documentElement.removeAttribute("data-alert-level");
    };
  }, [alertLevel]);

  /* ── Actions ───────────────────────────────────────────── */
  const dismissPopup = useCallback(() => {
    setPopupQueue((prev) => prev.slice(1));
  }, []);

  const acknowledge = useCallback(
    (alertId: string) => {
      setDismissedIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]));
      setPopupQueue((prev) => prev.filter((a) => a.id !== alertId));

      if (alertId.startsWith("twin:")) {
        acknowledgeTwinAlert(alertId.replace("twin:", ""));
        return;
      }

      setProviderAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isAcknowledged: true } : a))
      );
      provider.acknowledgeAlert(alertId).catch(() => {
        /* optimistic — the next poll reconciles */
      });
    },
    [provider, acknowledgeTwinAlert]
  );

  const visibleQueue = useMemo(
    () => popupQueue.filter((a) => !dismissedIds.includes(a.id)),
    [popupQueue, dismissedIds]
  );

  const value = useMemo<AlertFeedContextValue>(
    () => ({
      alerts,
      unacknowledged,
      criticalCount: unacknowledged.filter((a) => a.severity === "critical").length,
      warningCount: unacknowledged.filter((a) => a.severity === "warning").length,
      alertLevel,
      popupAlert: visibleQueue[0] ?? null,
      popupQueueLength: Math.max(0, visibleQueue.length - 1),
      dismissPopup,
      acknowledge,
      refresh: () => {
        refresh();
      },
    }),
    [alerts, unacknowledged, alertLevel, visibleQueue, dismissPopup, acknowledge, refresh]
  );

  return (
    <AlertFeedContext.Provider value={value}>{children}</AlertFeedContext.Provider>
  );
}

export function useAlertFeed(): AlertFeedContextValue {
  return useContext(AlertFeedContext);
}
