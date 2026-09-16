/**
 * useLiveTelemetry - wires the backend WebSocket to WellContext's local state.
 *
 * When data mode is "live":
 *   1. Opens ws://backend/ws/wells/{wellId}/telemetry
 *   2. Parses every incoming JSON message (WellState shape from backend)
 *   3. Calls the onUpdate callback so WellContextProvider can update its local wellState
 *
 * Falls back silently on connection error (caller keeps its current state).
 */

"use client";

import { useEffect, useRef } from "react";
import { useDataModeStore } from "../state/useDataModeStore";
import { WellState } from "../data/types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/ws";
const PING_INTERVAL_MS = 25_000;
const RECONNECT_DELAY_MS = 5_000;

export function useLiveTelemetry(
  wellId: string,
  onUpdate: (state: WellState) => void
) {
  const mode = useDataModeStore((s) => s.mode);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  // Keep a stable ref to the callback so the effect doesn't re-run on every render
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "live" || !wellId) return;

    let shouldReconnect = true;

    function connect() {
      if (!isMountedRef.current || !shouldReconnect) return;

      const url = `${WS_BASE}/wells/${wellId}/telemetry`;
      let ws: WebSocket;

      try {
        ws = new WebSocket(url);
      } catch (e) {
        console.warn("[LiveTelemetry] Could not open WebSocket:", e);
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        console.info(`[LiveTelemetry] Connected to ${url}`);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (event.data === "pong") return;
        try {
          const data = JSON.parse(event.data as string);
          // Skip the connection acknowledgement frame
          if (data?.type === "connected") return;
          // Forward the parsed WellState to the caller
          onUpdateRef.current(data as WellState);
        } catch (err) {
          console.warn("[LiveTelemetry] Parse error:", err);
        }
      };

      ws.onerror = () => {
        console.warn("[LiveTelemetry] WebSocket error - will reconnect");
      };

      ws.onclose = () => {
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = null;
        if (shouldReconnect && isMountedRef.current) {
          reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      shouldReconnect = false;
      if (pingRef.current) clearInterval(pingRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [mode, wellId]); // onUpdate intentionally excluded - we use a ref
}
