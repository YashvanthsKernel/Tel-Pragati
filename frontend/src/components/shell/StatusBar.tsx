"use client";

import React, { useEffect, useState } from "react";
import { useSelectedWellStore } from "../../state/useSelectedWellStore";

export function StatusBar() {
  const selectedWellId = useSelectedWellStore((s) => s.selectedWellId);
  const [time, setTime] = useState("");
  const [syncAgo, setSyncAgo] = useState(0);

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setSyncAgo((s) => (s >= 30 ? 0 : s + 1));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="h-8 bg-surface-2 border-t border-line fixed bottom-0 left-0 right-0 z-20 flex items-center px-4 gap-0 text-[11px] font-mono text-text-muted select-none">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 pr-4 border-r border-line">
        <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse-subtle" />
        <span className="text-status-safe font-semibold">LIVE</span>
        <span className="text-text-disabled">·</span>
        <span>MQTT CONNECTED</span>
      </div>

      {/* Well context */}
      <div className="px-4 border-r border-line">
        WELL: <span className="text-text-secondary font-semibold">{selectedWellId || "—"}</span>
      </div>

      {/* Active wells */}
      <div className="px-4 border-r border-line">
        23 WELLS MONITORED
      </div>

      {/* Last sync */}
      <div className="px-4 border-r border-line">
        SYNC: <span className="text-text-secondary">{syncAgo}s AGO</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clock */}
      <div className="px-4 border-l border-line font-mono">
        {time} IST
      </div>

      {/* Version */}
      <div className="pl-4 border-l border-line text-text-muted">
        TEL PRAGATI v2.4.1 · Oil India Limited
      </div>
    </footer>
  );
}
