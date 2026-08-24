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
    if (value >= 88) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (value >= 75) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
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
