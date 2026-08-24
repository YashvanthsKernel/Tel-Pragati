"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface TrendIndicatorProps {
  delta: string | number;
  direction?: "up" | "down" | "flat";
  unit?: string;
  isGood?: "up" | "down" | "neutral";
  className?: string;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  delta,
  direction = "down",
  unit = "",
  isGood = "neutral",
  className = "",
}) => {
  let colorClass = "text-slate-600";

  if (isGood === "up") {
    colorClass = direction === "up" ? "text-emerald-600" : "text-rose-600";
  } else if (isGood === "down") {
    colorClass = direction === "down" ? "text-emerald-600" : "text-rose-600";
  }

  return (
    <div className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${colorClass} ${className}`}>
      {direction === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
      {direction === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
      {direction === "flat" && <Minus className="w-3.5 h-3.5" />}
      <span>{delta}{unit}</span>
    </div>
  );
};
