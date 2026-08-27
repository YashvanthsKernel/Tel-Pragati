"use client";

import React, { useState } from "react";
import { Info, Sparkles, Database } from "lucide-react";
import { EstimatedValue } from "../../data/types";

interface EstimatedBadgeProps {
  label?: string;
  data: EstimatedValue;
  className?: string;
  showTooltip?: boolean;
}

export function EstimatedBadge({
  label,
  data,
  className = "",
  showTooltip = true,
}: EstimatedBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isGroundTruth = data.labelSource === "ground_truth";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors border ${
          isGroundTruth
            ? "bg-accent-mechanical/10 text-accent-mechanical border-accent-mechanical/30 hover:bg-accent-mechanical/20"
            : "bg-status-warn/10 text-status-warn border-status-warn/30 hover:bg-status-warn/20"
        }`}
        title="Click to inspect model provenance & confidence"
      >
        {isGroundTruth ? (
          <Database className="w-2.5 h-2.5 flex-shrink-0 text-accent-mechanical" />
        ) : (
          <Sparkles className="w-2.5 h-2.5 flex-shrink-0 text-status-warn" />
        )}
        <span>{isGroundTruth ? "GROUND TRUTH" : "ML WEAK"}</span>
        <span className="opacity-80">
          ({Math.round((data.confidence <= 1 ? data.confidence * 100 : data.confidence))}%)
        </span>
      </div>

      {showTooltip && isOpen && (
        <div className="absolute bottom-full left-0 mb-1.5 w-64 p-2.5 rounded-md bg-surface-1 border border-line shadow-popup z-50 text-left text-xs font-sans animate-fade-in">
          <div className="flex items-center justify-between border-b border-line pb-1 mb-1.5">
            <span className="font-mono text-[10px] text-accent-mechanical font-bold uppercase">
              {isGroundTruth ? "Ground-Truth Calibrated" : "Weak Supervised Inferred"}
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {Math.round(data.confidence <= 1 ? data.confidence * 100 : data.confidence)}% conf
            </span>
          </div>

          {label && <div className="font-semibold text-text-primary text-xs mb-1">{label}</div>}

          {data.uncertaintyMargin && (
            <div className="text-[11px] text-text-muted font-mono mb-1">
              Margin: <span className="text-text-primary">{data.uncertaintyMargin}</span>
            </div>
          )}

          {data.equation && (
            <div className="p-1 rounded bg-surface-0 border border-line font-mono text-[10px] text-accent-thermal mb-1.5 overflow-x-auto">
              {data.equation}
            </div>
          )}

          {data.description && (
            <div className="text-[11px] text-text-muted leading-relaxed">
              {data.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
