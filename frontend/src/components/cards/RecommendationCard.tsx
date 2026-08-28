"use client";

import React, { useState } from "react";
import { Check, X, Send, Sparkles, TrendingDown, Zap, IndianRupee, Clock } from "lucide-react";
import { Recommendation } from "../../data/types";
import { RoleGate } from "../shell/RoleGate";
import { useDataProvider } from "../../data/DataProviderContext";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onActionComplete?: () => void;
}

export function RecommendationCard({ recommendation, onActionComplete }: RecommendationCardProps) {
  const provider = useDataProvider();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await provider.approveRecommendation(recommendation.id);
      if (onActionComplete) onActionComplete();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setIsProcessing(true);
    try {
      await provider.rejectRecommendation(recommendation.id, rejectReason);
      setIsRejecting(false);
      if (onActionComplete) onActionComplete();
    } finally {
      setIsProcessing(false);
    }
  };

  const isApproved = recommendation.status === "approved";
  const isRejected = recommendation.status === "rejected";

  return (
    <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent-mechanical font-bold">
              SCADA Supervisory Advisory
            </span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-[10px] font-mono text-text-muted">
              {recommendation.actionType}
            </span>
          </div>
          <h3 className="font-sans font-bold text-sm sm:text-base text-text-primary leading-tight">
            {recommendation.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
              isApproved
                ? "bg-status-safe/10 text-status-safe border-status-safe/30"
                : isRejected
                ? "bg-status-critical/10 text-status-critical border-status-critical/30"
                : "bg-surface-2 text-accent-mechanical border-line"
            }`}
          >
            {recommendation.status}
          </span>
        </div>
      </div>

      <p className="text-xs font-sans text-text-secondary leading-relaxed">
        {recommendation.explanation}
      </p>

      {/* Impact metrics pills */}
      <div className="grid grid-cols-3 gap-2 p-2 rounded bg-surface-0 border border-line text-xs font-mono">
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-status-safe" />
            Rod Risk
          </span>
          <span className="font-bold text-status-safe">
            {recommendation.expectedImpact.riskPct > 0
              ? `+${recommendation.expectedImpact.riskPct}%`
              : `${recommendation.expectedImpact.riskPct}%`}
          </span>
        </div>

        <div className="flex flex-col items-center text-center border-x border-line">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Zap className="w-3 h-3 text-accent-mechanical" />
            Lifting Energy
          </span>
          <span className="font-bold text-accent-mechanical">
            {recommendation.expectedImpact.energyPct > 0
              ? `+${recommendation.expectedImpact.energyPct}%`
              : `${recommendation.expectedImpact.energyPct}%`}
          </span>
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-status-safe" />
            Net Value
          </span>
          <span className="font-bold text-status-safe">
            +₹{recommendation.expectedImpact.valueInrDay.toLocaleString()}/d
          </span>
        </div>
      </div>

      {/* Action Buttons (Role gated to Operator, Engineer, Admin) */}
      {!isApproved && !isRejected && (
        <RoleGate
          roles={["operator", "engineer", "admin"]}
          fallback={
            <div className="text-[11px] font-mono text-text-muted italic text-center p-1">
              Viewer role: Actions require Operator or Engineer permissions.
            </div>
          }
        >
          {isRejecting ? (
            <div className="space-y-2 pt-1 border-t border-line">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify rejection reason for SCADA audit log..."
                className="w-full px-2.5 py-1.5 rounded bg-surface-0 border border-line text-xs text-text-primary focus:outline-none focus:border-accent-mechanical font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-2.5 py-1 rounded bg-surface-2 border border-line text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectReason || isProcessing}
                  className="px-3 py-1 rounded bg-status-critical text-white text-xs font-medium hover:bg-status-critical/90 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-surface-2 border border-line text-xs font-medium text-text-muted hover:text-status-critical hover:border-status-critical/40 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-status-safe text-white text-xs font-medium hover:bg-status-safe/90 transition-colors shadow-glowMechanical"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Dispatch VFD</span>
              </button>
            </div>
          )}
        </RoleGate>
      )}
    </div>
  );
}
