"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Map, Bell, FileBarChart, GitCompare,
  Activity, Atom, Stethoscope, Sliders, TrendingUp,
  ShieldAlert, Box, Settings, ChevronLeft, ChevronRight, Layers,
  Cpu, Eye,
} from "lucide-react";
import { useSelectedWellStore } from "../../state/useSelectedWellStore";
import { useAuthStore } from "../../state/useAuthStore";

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedWellId = useSelectedWellStore((s) => s.selectedWellId);
  const role = useAuthStore((s) => s.role);

  const fieldNavItems = [
    { label: "Overview",      href: "/field",         icon: LayoutDashboard },
    { label: "Map",           href: "/field/map",     icon: Map },
    { label: "Alerts",        href: "/field/alerts",  icon: Bell },
    { label: "Reports",       href: "/field/reports", icon: FileBarChart },
    { label: "Compare Wells", href: "/field/compare", icon: GitCompare },
  ];

  const wellNavItems = [
    { label: "Well Twin",   href: `/well/${selectedWellId}/twin`,        icon: Activity },
    { label: "Physics",     href: `/well/${selectedWellId}/physics`,     icon: Atom },
    { label: "Diagnostics", href: `/well/${selectedWellId}/diagnostics`, icon: Stethoscope },
  ];

  const engineeringNavItems = [
    { label: "Simulator",   href: `/well/${selectedWellId}/simulator`,   icon: Sliders },
    { label: "Optimizer",   href: `/well/${selectedWellId}/optimizer`,   icon: TrendingUp },
    { label: "Control",     href: `/well/${selectedWellId}/control`,     icon: ShieldAlert },
  ];

  const visualizationNavItems = [
    { label: "3D View",     href: `/well/${selectedWellId}/3d`,          icon: Box },
  ];

  const isActive = (href: string) => {
    if (href === "/field" && pathname === "/field") return true;
    if (href !== "/field" && pathname.startsWith(href)) return true;
    return false;
  };

  const canAccessAdmin = role === "engineer" || role === "admin";

  /* ── Nav item ── */
  const NavItem = ({
    item,
  }: {
    item: { label: string; href: string; icon: React.ElementType };
  }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        title={!isExpanded ? item.label : undefined}
        className={`flex items-center gap-2.5 px-3 py-1.5 text-xs font-sans font-medium transition-colors border-l-2 ${
          active
            ? "bg-accent-mechanical/10 text-accent-mechanical border-accent-mechanical font-semibold"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-2 border-transparent"
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-accent-mechanical" : "text-text-muted"}`} />
        {isExpanded && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`bg-surface-1 border-r border-line flex flex-col z-20 select-none transition-all duration-150 ${
        isExpanded ? "w-56 min-w-[14rem]" : "w-12 min-w-[3rem]"
      }`}
    >
      <div className="flex-1 overflow-y-auto py-2 space-y-3">

        {/* ── 1. FIELD ── */}
        <div>
          {isExpanded && (
            <div className="px-3 py-1 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                Field
              </span>
            </div>
          )}
          <nav className="mt-0.5">
            {fieldNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 2. WELL: BGW-XX ── */}
        <div>
          {isExpanded && (
            <div className="px-3 py-1 flex items-center justify-between border-t border-line pt-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-accent-mechanical" />
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted truncate">
                  Well: {selectedWellId}
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse-subtle flex-shrink-0" />
            </div>
          )}
          <nav className="mt-0.5">
            {wellNavItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 3. ENGINEERING ── */}
        <div>
          {isExpanded && (
            <div className="px-3 py-1 flex items-center gap-1.5 border-t border-line pt-2">
              <Cpu className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                Engineering
              </span>
            </div>
          )}
          <nav className="mt-0.5">
            {engineeringNavItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 4. VISUALIZATION ── */}
        <div>
          {isExpanded && (
            <div className="px-3 py-1 flex items-center gap-1.5 border-t border-line pt-2">
              <Eye className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                Visualization
              </span>
            </div>
          )}
          <nav className="mt-0.5">
            {visualizationNavItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 5. System / Admin ── */}
        {canAccessAdmin && (
          <div>
            {isExpanded && (
              <div className="px-3 py-1 border-t border-line pt-2">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                  System
                </span>
              </div>
            )}
            <nav className="mt-0.5">
              <NavItem
                item={{ label: "Admin / Settings", href: "/admin", icon: Settings }}
              />
            </nav>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <div className="border-t border-line flex items-center justify-between px-2 py-2">
        {isExpanded && (
          <span className="text-[10px] font-mono text-text-muted ml-1">
            v2.4.1
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 ml-auto"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <>
              <span className="text-[10px] font-sans">Collapse</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </>
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
}
