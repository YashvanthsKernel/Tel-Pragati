"use client";

import React from "react";
import { WellState } from "../../data/types";

interface Wellbore2DFallbackProps {
  wellState: WellState;
  onTry3d?: () => void;
}

export function Wellbore2DFallback({ wellState, onTry3d }: Wellbore2DFallbackProps) {
  const depth = wellState.depthM || 1040;
  const bht = wellState.inferred.bottomholeTempC.value;
  const visc = wellState.inferred.viscosityCp.value;
  const drag = wellState.inferred.rodDragLb.value;
  const risk = wellState.rodFloatingRiskPct;

  return (
    <div className="w-full h-full bg-surface-1 border border-line rounded-lg p-4 flex flex-col justify-between select-none">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div>
          <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide">
            2D Subsurface Wellbore Schematic (Low-Power / A11y Mode)
          </h3>
          <span className="text-xs font-mono text-text-muted">
            {wellState.wellName} · {depth}m Depth
          </span>
        </div>
        {onTry3d && (
          <button
            type="button"
            onClick={onTry3d}
            className="px-3 py-1 rounded bg-accent-mechanical text-surface-0 text-xs font-bold hover:bg-accent-mechanical/90"
          >
            Launch Full 3D View
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <svg viewBox="0 0 320 480" className="max-h-[420px] w-auto overflow-visible">
          {/* Surface Ground Line */}
          <line x1="20" y1="40" x2="300" y2="40" stroke="var(--line)" strokeWidth="3" />
          <text x="30" y="32" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-ibm-plex-mono)">
            Surface (0m)
          </text>

          {/* Surface Pumping Unit Silhouette */}
          <path d="M 120,40 L 140,15 L 160,15 L 180,40 Z" fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1.5" />
          <line x1="150" y1="15" x2="150" y2="40" stroke="var(--accent-mechanical)" strokeWidth="2.5" />

          {/* Depth Rail (0 to 1040m) */}
          <line x1="60" y1="40" x2="60" y2="420" stroke="var(--line)" strokeWidth="2" />
          {[0, 200, 400, 600, 800, 1000].map((d) => {
            const y = 40 + (d / 1000) * 380;
            return (
              <g key={d}>
                <line x1="55" y1={y} x2="65" y2={y} stroke="var(--text-muted)" strokeWidth="1.5" />
                <text x="48" y={y + 3} fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-ibm-plex-mono)" textAnchor="end">
                  {d}m
                </text>
              </g>
            );
          })}

          {/* Outer Casing */}
          <rect x="135" y="40" width="30" height="380" fill="var(--surface-0)" stroke="var(--line)" strokeWidth="1.5" />

          {/* Inner Tubing */}
          <rect x="142" y="40" width="16" height="360" fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1" />

          {/* Sucker Rod String */}
          <line
            x1="150"
            y1="40"
            x2="150"
            y2="390"
            stroke={risk > 55 ? "var(--status-warn)" : "var(--accent-mechanical)"}
            strokeWidth="3"
          />

          {/* Downhole Pump Barrel */}
          <rect x="140" y="380" width="20" height="25" fill="var(--accent-thermal)" stroke="var(--line)" strokeWidth="1" />
          <text x="175" y="395" fill="var(--accent-thermal)" fontSize="10" fontFamily="var(--font-ibm-plex-mono)">
            Pump (1,040m)
          </text>

          {/* Reservoir Slab Band */}
          <rect x="80" y="400" width="140" height="30" fill="var(--accent-thermal)" fillOpacity="0.25" stroke="var(--accent-thermal)" strokeDasharray="3 3" />
          <text x="230" y="418" fill="var(--accent-thermal)" fontSize="10" fontFamily="var(--font-ibm-plex-mono)">
            Jodhpur Pay Zone ({bht}°C)
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-4 gap-2 p-2 rounded bg-surface-0 border border-line text-xs font-mono text-center">
        <div>
          <span className="text-[10px] text-text-muted">BHT</span>
          <div className="font-bold text-accent-thermal">{bht}°C</div>
        </div>
        <div>
          <span className="text-[10px] text-text-muted">Viscosity</span>
          <div className="font-bold text-accent-mechanical">{visc.toLocaleString()} cP</div>
        </div>
        <div>
          <span className="text-[10px] text-text-muted">Rod Drag</span>
          <div className="font-bold text-text-primary">{drag.toLocaleString()} lb</div>
        </div>
        <div>
          <span className="text-[10px] text-text-muted">Rod Risk</span>
          <div className={`font-bold ${risk > 50 ? "text-status-warn" : "text-status-safe"}`}>{risk}%</div>
        </div>
      </div>
    </div>
  );
}
