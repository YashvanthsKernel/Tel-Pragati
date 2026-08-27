"use client";

import React from "react";
import { Info } from "lucide-react";
import { StatusPill } from "./StatusPill";
import { ProvenanceMetadata, TelemetrySource } from "../../types/twin";
import { useTwinStore } from "../../store/useTwinStore";

interface TelemetryBadgeProps {
  source: TelemetrySource;
  metadata?: ProvenanceMetadata;
  className?: string;
}

export const TelemetryBadge: React.FC<TelemetryBadgeProps> = ({
  source,
  metadata,
  className = "",
}) => {
  const openProvenance = useTwinStore((state) => state.openProvenance);

  const handleClick = (e: React.MouseEvent) => {
    if (metadata) {
      e.stopPropagation();
      openProvenance(metadata);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={metadata ? `Inspect data provenance for ${metadata.label}` : "Telemetry Source"}
      className={`inline-flex items-center gap-1 group cursor-pointer transition-opacity hover:opacity-80 ${className}`}
    >
      <StatusPill variant={source} size="sm" />
      {metadata && (
        <span className="text-slate-400 group-hover:text-oil-red transition-colors">
          <Info className="w-3 h-3" />
        </span>
      )}
    </button>
  );
};
