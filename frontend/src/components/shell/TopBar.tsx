"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Bell,
  Shield,
  User,
  ChevronDown,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { WellSelector } from "../common/WellSelector";
import { DataModeToggle } from "../common/DataModeToggle";
import { useAuthStore } from "../../state/useAuthStore";
import { AutonomyTier, Role } from "../../data/types";
import { useDataProvider } from "../../data/DataProviderContext";

export function TopBar() {
  const router = useRouter();
  const provider = useDataProvider();
  const { user, role, autonomyTier, setRole, setUser, setAutonomyTier } = useAuthStore();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const alertsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    provider.getAlerts().then((alerts) => {
      setActiveAlerts(alerts.filter((a) => !a.isAcknowledged));
    });
  }, [provider]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
      if (alertsMenuRef.current && !alertsMenuRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAutonomyBadgeColor = (tier: AutonomyTier) => {
    switch (tier) {
      case "advisory":
        return "border-status-safe/40 text-status-safe bg-status-safe/10";
      case "supervised":
        return "border-status-warn/40 text-status-warn bg-status-warn/10";
      case "automated":
        return "border-status-critical/40 text-status-critical bg-status-critical/10";
    }
  };

  const personas: { role: Role; name: string; title: string }[] = [
    { role: "viewer", name: "Guest Observer", title: "Viewer (Read Only)" },
    { role: "operator", name: "P. R. Joshi (Lead Operator)", title: "Operator (Control & Approvals)" },
    { role: "engineer", name: "Er. Arvind Sharma", title: "Senior Production Engineer" },
    { role: "admin", name: "System Administrator", title: "Admin (Full Control)" },
  ];

  return (
    <header className="h-14 bg-surface-1 border-b border-line px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Left side: Brand + Field Name + Well Selector */}
      <div className="flex items-center gap-3 md:gap-5">
        <button
          onClick={() => router.push("/field")}
          className="flex items-center gap-2 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-surface-2/60 border border-line flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/logo_transparent.png" alt="TEL PRAGATI" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-tight text-text-primary">
                TEL PRAGATI
              </span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-surface-2 text-accent-mechanical border border-line">
                OIL v2.4
              </span>
            </div>
            <div className="text-[10px] text-text-muted font-mono leading-none hidden sm:block">
              Baghewala Field · Jodhpur Sandstone
            </div>
          </div>
        </button>

        <div className="h-5 w-px bg-line hidden sm:block" />

        {/* Well Switcher */}
        <WellSelector />
      </div>

      {/* Right side: Data Mode + Autonomy Badge + Alerts Bell + User Role Menu */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Data Mode Switch */}
        <DataModeToggle />

        {/* Autonomy Tier Badge */}
        <div className="relative group hidden lg:block">
          <div
            className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border flex items-center gap-1.5 cursor-pointer ${getAutonomyBadgeColor(
              autonomyTier
            )}`}
            onClick={() => {
              const next: AutonomyTier =
                autonomyTier === "advisory"
                  ? "supervised"
                  : autonomyTier === "supervised"
                  ? "automated"
                  : "advisory";
              setAutonomyTier(next);
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>Tier: {autonomyTier}</span>
          </div>
        </div>

        {/* Alerts Bell */}
        <div className="relative" ref={alertsMenuRef}>
          <button
            type="button"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary relative transition-colors"
            aria-label="Active field alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-status-critical text-[10px] font-mono text-white flex items-center justify-center font-bold">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-md bg-surface-1 border border-line shadow-popup z-50 overflow-hidden">
              <div className="p-3 border-b border-line flex items-center justify-between">
                <span className="font-display text-xs font-semibold text-text-primary">
                  Active Field Alerts ({activeAlerts.length})
                </span>
                <button
                  onClick={() => {
                    setIsAlertsOpen(false);
                    router.push("/field/alerts");
                  }}
                  className="text-[11px] text-accent-mechanical hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
                {activeAlerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted">
                    No unacknowledged alerts.
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setIsAlertsOpen(false);
                        if (alert.routeLink) router.push(alert.routeLink);
                        else router.push("/field/alerts");
                      }}
                      className="p-2 rounded bg-surface-2 hover:bg-line border border-line cursor-pointer transition-colors text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-mono uppercase px-1 rounded ${
                            alert.severity === "critical"
                              ? "bg-status-critical/20 text-status-critical"
                              : alert.severity === "warning"
                              ? "bg-status-warn/20 text-status-warn"
                              : "bg-surface-0 text-text-muted"
                          }`}
                        >
                          {alert.wellId} · {alert.severity}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{alert.timestamp}</span>
                      </div>
                      <div className="text-xs text-text-primary font-medium line-clamp-1">{alert.title}</div>
                      <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">{alert.condition}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / Role Menu */}
        <div className="relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded bg-surface-2 hover:bg-line border border-line transition-colors text-xs"
          >
            <div className="w-5 h-5 rounded-full bg-accent-mechanical/20 text-accent-mechanical flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
            <div className="hidden md:block text-left">
              <div className="font-medium text-text-primary text-[11px] line-clamp-1">{user}</div>
              <div className="text-[9px] font-mono text-accent-mechanical uppercase leading-none">{role}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted hidden sm:block" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-md bg-surface-1 border border-line shadow-popup z-50 overflow-hidden">
              <div className="p-2.5 border-b border-line">
                <div className="text-xs font-semibold text-text-primary">{user}</div>
                <div className="text-[11px] font-mono text-text-muted mt-0.5">Role: <span className="text-accent-mechanical uppercase font-bold">{role}</span></div>
              </div>

              <div className="p-1">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-text-muted tracking-wider">
                  Switch Persona (Demo RBAC)
                </div>
                {personas.map((p) => (
                  <button
                    key={p.role}
                    onClick={() => {
                      setRole(p.role);
                      setUser(p.name);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                      role === p.role ? "bg-surface-2 text-text-primary font-medium" : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
                    }`}
                  >
                    <div>
                      <div>{p.name}</div>
                      <div className="text-[10px] text-text-muted">{p.title}</div>
                    </div>
                    {role === p.role && <CheckCircle2 className="w-3.5 h-3.5 text-accent-mechanical" />}
                  </button>
                ))}
              </div>

              <div className="p-1 border-t border-line">
                <button
                  onClick={() => {
                    setIsRoleMenuOpen(false);
                    router.push("/login");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-status-critical hover:bg-surface-2 transition-colors"
                >
                  Log out / Relogin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
