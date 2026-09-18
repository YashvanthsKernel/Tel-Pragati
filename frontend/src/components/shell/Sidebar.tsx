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
        className={`flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg text-[13px] font-sans font-medium transition-colors ${
          active
            ? "bg-brand/15 text-brand font-semibold"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-brand" : "text-text-muted"}`} />
        {isExpanded && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`bg-surface-1 border-r border-line flex flex-col z-20 select-none transition-all duration-150 ${
        isExpanded ? "w-60 min-w-[15rem]" : "w-16 min-w-[4rem]"
      }`}
    >
      {/* ── Logo / brand header ── */}
      <div className={`flex items-center gap-2.5 h-16 px-4 border-b border-line flex-shrink-0 ${!isExpanded && "justify-center px-0"}`}>
        <div className="w-9 h-9 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center flex-shrink-0 shadow-glowBrand">
          <img src="/logo_transparent.png" alt="TEL PRAGATI" className="w-5 h-5 object-contain" />
        </div>
        {isExpanded && (
          <div className="min-w-0">
            <div className="font-sans font-bold text-sm tracking-tight text-text-primary leading-none truncate">
              TEL PRAGATI
            </div>
            <div className="text-[10px] text-text-muted font-sans leading-none mt-1 truncate">
              AI Field Intelligence
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-4">

        {/* ── 1. FIELD ── */}
        <div>
          {isExpanded && (
            <div className="px-4 py-1 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                Field
              </span>
            </div>
          )}
          <nav className="mt-1 space-y-0.5">
            {fieldNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 2. WELL: BGW-XX ── */}
        <div>
          {isExpanded && (
            <div className="px-4 py-1 flex items-center justify-between border-t border-line pt-3">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-accent-mechanical" />
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted truncate">
                  Well: {selectedWellId}
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse-subtle flex-shrink-0" />
            </div>
          )}
          <nav className="mt-1 space-y-0.5">
            {wellNavItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 3. ENGINEERING ── */}
        <div>
          {isExpanded && (
            <div className="px-4 py-1 flex items-center gap-1.5 border-t border-line pt-3">
              <Cpu className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                Engineering
              </span>
            </div>
          )}
          <nav className="mt-1 space-y-0.5">
            {engineeringNavItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 4. VISUALIZATION ── */}
        <div>
          {isExpanded && (
            <div className="px-4 py-1 flex items-center gap-1.5 border-t border-line pt-3">
              <Eye className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                Visualization
              </span>
            </div>
          )}
          <nav className="mt-1 space-y-0.5">
            {visualizationNavItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>

        {/* ── 5. System / Admin ── */}
        {canAccessAdmin && (
          <div>
            {isExpanded && (
              <div className="px-4 py-1 border-t border-line pt-3">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-text-muted">
                  System
                </span>
              </div>
            )}
            <nav className="mt-1 space-y-0.5">
              <NavItem
                item={{ label: "Admin / Settings", href: "/admin", icon: Settings }}
              />
            </nav>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <div className="border-t border-line flex items-center justify-between px-3 py-3">
        {isExpanded && (
          <span className="text-[10px] font-mono text-text-muted ml-1">
            v2.4.1
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 ml-auto"
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
