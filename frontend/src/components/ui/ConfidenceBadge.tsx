"use client";

import React from "react";

interface ConfidenceBadgeProps {
  value: number; // 0 - 100
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  value,
  label = "Conf",
  size = "sm",
  className = "",
}) => {
  const getColor = () => {
    if (value >= 88) return "text-status-safe bg-status-safe-soft border-status-safe/30";
    if (value >= 75) return "text-status-warn bg-status-warn-soft border-status-warn/30";
    return "text-status-critical bg-status-critical-soft border-status-critical/30";
  };

  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono ${getColor()} ${textSize} ${className}`}
      title={`Model Statistical Confidence: ${value}%`}
    >
      <span className="text-[10px] text-slate-500 font-sans">{label}:</span>
      <span className="font-semibold">{value}%</span>
    </div>
  );
};
