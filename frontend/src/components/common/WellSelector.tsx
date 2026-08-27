"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Search, Activity } from "lucide-react";
import WELLS_REGISTRY from "../../config/wells.json";
import { useSelectedWellStore } from "../../state/useSelectedWellStore";

export function WellSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedWellId, setSelectedWellId } = useSelectedWellStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selected well with URL if on a /well/[wellId] route
  useEffect(() => {
    const match = pathname.match(/^\/well\/([^/]+)/);
    if (match && match[1] && match[1] !== selectedWellId) {
      setSelectedWellId(match[1]);
    }
  }, [pathname, selectedWellId, setSelectedWellId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectWell = (wellId: string) => {
    setSelectedWellId(wellId);
    setIsOpen(false);

    // If currently on a well subpage (e.g., /well/BGW-08/optimizer), navigate to the same subpage for the new well
    const match = pathname.match(/^\/well\/[^/]+(\/.*)?$/);
    if (match) {
      const subpage = match[1] || "/twin";
      router.push(`/well/${wellId}${subpage}`);
    } else {
      router.push(`/well/${wellId}/twin`);
    }
  };

  const filteredWells = WELLS_REGISTRY.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.padId.toLowerCase().includes(search.toLowerCase())
  );

  const currentWell = WELLS_REGISTRY.find((w) => w.wellId === selectedWellId) || WELLS_REGISTRY[7];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-2 hover:bg-line border border-line transition-colors text-sm"
        aria-label="Select active well"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-safe animate-pulse-subtle" />
          <span className="font-mono font-semibold text-text-primary">{currentWell.name}</span>
          <span className="text-xs text-text-muted hidden sm:inline font-mono">({currentWell.padId})</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-md bg-surface-1 border border-line shadow-popup z-50 overflow-hidden">
          <div className="p-2 border-b border-line flex items-center gap-2">
            <Search className="w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wells or pads..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none font-mono"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {filteredWells.map((w) => {
              const isSelected = w.wellId === selectedWellId;
              const statusColor =
                w.status === "producing"
                  ? "bg-status-safe"
                  : w.status === "css_active"
                  ? "bg-accent-thermal"
                  : w.status === "alarm"
                  ? "bg-status-critical"
                  : "bg-text-muted";

              return (
                <button
                  key={w.wellId}
                  onClick={() => handleSelectWell(w.wellId)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isSelected ? "bg-surface-2 text-text-primary font-medium" : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                    <span className="font-mono">{w.name}</span>
                    <span className="text-[10px] text-text-muted">{w.padId}</span>
                  </div>
                  <span className="font-mono text-[11px] text-text-primary">{w.flowBopd} bopd</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
