"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, User, ChevronDown, ExternalLink, CheckCircle2,
  Sun, Moon,
} from "lucide-react";
import { WellSelector } from "../common/WellSelector";
import { DataModeToggle } from "../common/DataModeToggle";
import { useAuthStore } from "../../state/useAuthStore";
import { useThemeStore } from "../../state/useThemeStore";
import { AutonomyTier, Role } from "../../data/types";
import { useDataProvider } from "../../data/DataProviderContext";

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-7 h-7 bg-amber/20 border border-amber/40 text-amber flex items-center justify-center text-[11px] font-bold font-mono flex-shrink-0">
      {initials || <User className="w-3.5 h-3.5" />}
    </div>
  );
}

export function TopBar() {
  const router = useRouter();
  const provider = useDataProvider();
  const { user, role, autonomyTier, setRole, setUser, setAutonomyTier, logout } = useAuthStore();
  const { mode: themeMode, toggleTheme } = useThemeStore();

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
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node))
        setIsRoleMenuOpen(false);
      if (alertsMenuRef.current && !alertsMenuRef.current.contains(e.target as Node))
        setIsAlertsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAutonomyStyle = (tier: AutonomyTier) => {
    switch (tier) {
      case "advisory":   return "border-status-safe/50 text-status-safe bg-status-safe/10";
      case "supervised": return "border-status-warn/50 text-status-warn bg-status-warn/10";
      case "automated":  return "border-status-critical/50 text-status-critical bg-status-critical/10";
    }
  };

  const personas: { role: Role; name: string; title: string }[] = [
    { role: "viewer",   name: "Guest Observer",       title: "Viewer (Read Only)" },
    { role: "operator", name: "P. R. Joshi",          title: "Operator (Control & Approvals)" },
    { role: "engineer", name: "Er. Arvind Sharma",    title: "Senior Production Engineer" },
    { role: "admin",    name: "System Administrator", title: "Admin (Full Control)" },
  ];

  return (
    <header className="h-14 bg-surface-1 border-b border-line px-4 flex items-center justify-between z-30 sticky top-0">

      {/* ── LEFT: Brand + Well Selector ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/field")}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-8 h-8 bg-surface-2 border border-line flex items-center justify-center p-1 group-hover:border-amber/50 transition-colors overflow-hidden">
            <img src="/logo_transparent.png" alt="TEL PRAGATI" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-sm tracking-tight text-text-primary leading-none uppercase">
                TEL PRAGATI
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-2 text-accent-mechanical border border-line rounded">
                v2.4
              </span>
            </div>
            <div className="text-[10px] text-text-muted font-sans leading-none mt-1">
              Baghewala · Oil India Limited
            </div>
          </div>
        </button>

        <div className="h-5 w-px bg-line hidden sm:block" />
        <WellSelector />
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="flex items-center gap-1 sm:gap-2">
        <DataModeToggle />

        {/* Autonomy tier */}
        <div className="hidden lg:block">
          <button
            onClick={() => {
              const next: AutonomyTier =
                autonomyTier === "advisory" ? "supervised"
                : autonomyTier === "supervised" ? "automated" : "advisory";
              setAutonomyTier(next);
            }}
            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${getAutonomyStyle(autonomyTier)}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {autonomyTier}
          </button>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Toggle theme"
        >
          {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Alerts */}
        <div className="relative" ref={alertsMenuRef}>
          <button
            type="button"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="p-2 hover:bg-surface-2 text-text-muted hover:text-text-primary relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-status-critical text-[9px] font-mono text-white flex items-center justify-center font-bold">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-surface-1 border border-line shadow-popup z-50 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-line flex items-center justify-between bg-surface-2">
                <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wider">
                  Active Alerts ({activeAlerts.length})
                </span>
                <button
                  onClick={() => { setIsAlertsOpen(false); router.push("/field/alerts"); }}
                  className="text-xs font-sans text-accent-mechanical hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {activeAlerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted font-sans">No unacknowledged alerts.</div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => { setIsAlertsOpen(false); router.push(alert.routeLink || "/field/alerts"); }}
                      className="p-3 border-b border-line hover:bg-surface-2 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-mono uppercase font-bold ${
                          alert.severity === "critical" ? "text-status-critical" :
                          alert.severity === "warning"  ? "text-status-warn" : "text-text-muted"
                        }`}>
                          {alert.wellId} · {alert.severity}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{alert.timestamp}</span>
                      </div>
                      <div className="text-xs font-medium text-text-primary line-clamp-1 font-sans">{alert.title}</div>
                      <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5 font-sans">{alert.condition}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-2 hover:bg-surface-3 border border-line transition-colors text-xs"
          >
            <UserAvatar name={user} />
            <div className="hidden md:block text-left max-w-[120px]">
              <div className="font-medium text-text-primary text-[11px] line-clamp-1 font-sans">{user.split(" (")[0]}</div>
              <div className="text-[9px] font-mono text-accent-mechanical uppercase font-semibold">{role}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted hidden sm:block" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-surface-1 border border-line shadow-popup z-50 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-line bg-surface-2">
                <div className="text-xs font-bold text-text-primary font-sans">{user.split(" (")[0]}</div>
                <div className="text-[11px] text-text-muted mt-0.5 font-sans">
                  Role: <span className="text-accent-mechanical uppercase font-mono font-bold">{role}</span>
                </div>
              </div>
              <div className="p-1">
                <div className="px-2 py-1.5 text-[10px] font-sans uppercase text-text-muted font-semibold tracking-wider border-b border-line mb-1">
                  Switch Persona (Demo)
                </div>
                {personas.map((p) => (
                  <button
                    key={p.role}
                    onClick={() => { setRole(p.role); setUser(p.name); setIsRoleMenuOpen(false); }}
                    className={`w-full text-left px-2 py-2 text-xs rounded transition-colors flex items-center justify-between ${
                      role === p.role
                        ? "bg-accent-mechanical/10 text-accent-mechanical font-semibold"
                        : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                    }`}
                  >
                    <div>
                      <div className="font-medium font-sans">{p.name}</div>
                      <div className="text-[10px] opacity-70 font-sans">{p.title}</div>
                    </div>
                    {role === p.role && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="p-1 border-t border-line">
                <button
                  onClick={() => { logout(); setIsRoleMenuOpen(false); router.push("/login"); }}
                  className="w-full text-left px-2 py-2 text-xs text-status-critical hover:bg-status-critical/10 rounded transition-colors font-sans font-medium"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
