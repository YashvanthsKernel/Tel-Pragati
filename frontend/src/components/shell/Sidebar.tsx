"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bell,
  FileBarChart,
  GitCompare,
  Activity,
  Atom,
  Stethoscope,
  Sliders,
  TrendingUp,
  ShieldAlert,
  Box,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useSelectedWellStore } from "../../state/useSelectedWellStore";
import { useAuthStore } from "../../state/useAuthStore";

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedWellId = useSelectedWellStore((s) => s.selectedWellId);
  const role = useAuthStore((s) => s.role);

  const fieldNavItems = [
    { label: "Overview", href: "/field", icon: LayoutDashboard },
    { label: "Map", href: "/field/map", icon: Map },
    { label: "Alerts", href: "/field/alerts", icon: Bell },
    { label: "Reports", href: "/field/reports", icon: FileBarChart },
    { label: "Compare Wells", href: "/field/compare", icon: GitCompare },
  ];

  const wellNavItems = [
    { label: "Well Twin", href: `/well/${selectedWellId}/twin`, icon: Activity },
    { label: "Physics", href: `/well/${selectedWellId}/physics`, icon: Atom },
    { label: "Diagnostics", href: `/well/${selectedWellId}/diagnostics`, icon: Stethoscope },
    { label: "Simulator", href: `/well/${selectedWellId}/simulator`, icon: Sliders },
    { label: "Optimizer", href: `/well/${selectedWellId}/optimizer`, icon: TrendingUp },
    { label: "Control", href: `/well/${selectedWellId}/control`, icon: ShieldAlert },
    { label: "3D View", href: `/well/${selectedWellId}/3d`, icon: Box },
  ];

  const isActive = (href: string) => {
    if (href === "/field" && pathname === "/field") return true;
    if (href !== "/field" && pathname.startsWith(href)) return true;
    return false;
  };

  const canAccessAdmin = role === "engineer" || role === "admin";

  return (
    <aside
      className={`bg-surface-1 border-r border-line flex flex-col justify-between transition-all duration-200 z-20 select-none ${
        isExpanded ? "w-60 min-w-[15rem]" : "w-16 min-w-[4rem]"
      }`}
    >
      <div className="p-3 flex-1 overflow-y-auto space-y-5">
        {/* Field Level Navigation Section */}
        <div>
          {isExpanded && (
            <div className="px-2 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-accent-mechanical" />
              <span>Field Level</span>
            </div>
          )}
          <nav className="space-y-0.5">
            {fieldNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                    active
                      ? "bg-surface-2 text-accent-mechanical font-semibold border-l-2 border-accent-mechanical"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-accent-mechanical" : "text-text-muted"}`} />
                  {isExpanded && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-line/60" />

        {/* Well Level Navigation Section */}
        <div>
          {isExpanded && (
            <div className="px-2 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Activity className="w-3 h-3 text-accent-thermal" />
                <span className="truncate">Well: {selectedWellId}</span>
              </div>
            </div>
          )}
          <nav className="space-y-0.5">
            {wellNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                    active
                      ? "bg-surface-2 text-accent-thermal font-semibold border-l-2 border-accent-thermal"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                  }`}
                  title={!isExpanded ? `${item.label} (${selectedWellId})` : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-accent-thermal" : "text-text-muted"}`} />
                  {isExpanded && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation Section */}
        {canAccessAdmin && (
          <>
            <div className="border-t border-line/60" />
            <div>
              {isExpanded && (
                <div className="px-2 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                  System
                </div>
              )}
              <nav className="space-y-0.5">
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-surface-2 text-text-primary font-semibold border-l-2 border-text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                  }`}
                  title={!isExpanded ? "Admin / Settings" : undefined}
                >
                  <Settings className="w-4 h-4 flex-shrink-0 text-text-muted" />
                  {isExpanded && <span>Admin / Settings</span>}
                </Link>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-line flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors text-xs flex items-center gap-2"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <>
              <span className="text-[11px] font-mono">Collapse</span>
              <ChevronLeft className="w-4 h-4" />
            </>
          ) : (
            <ChevronRight className="w-4 h-4 mx-auto" />
          )}
        </button>
      </div>
    </aside>
  );
}
