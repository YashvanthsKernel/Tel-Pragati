"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Sliders,
  Shield,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useWellContext } from "../../../../components/well/WellContext";
import { useDataProvider } from "../../../../data/DataProviderContext";
import { AuditEvent, InterlockStatus } from "../../../../data/types";
import { InterlockRow } from "../../../../components/cards/InterlockRow";
import { RecommendationCard } from "../../../../components/cards/RecommendationCard";
import { RoleGate } from "../../../../components/shell/RoleGate";
import { PageHeader } from "../../../../components/ui/PageHeader";

export default function ControlPage() {
  const { wellId, wellState, isLoading } = useWellContext();
  const provider = useDataProvider();

  const [interlocks, setInterlocks] = useState<InterlockStatus[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [vfdFrequencyHz, setVfdFrequencyHz] = useState(42.5);
  const [isDispatching, setIsDispatching] = useState(false);

  const loadData = () => {
    Promise.all([provider.getInterlocks(wellId), provider.getAuditEvents(wellId)]).then(
      ([interlockList, auditList]) => {
        setInterlocks(interlockList);
        setAuditEvents(auditList);
      }
    );
  };

  useEffect(() => {
    loadData();
  }, [provider, wellId]);

  const handleUpdateLimit = async (interlockId: string, limit: number) => {
    await provider.updateInterlock(wellId, interlockId, limit);
    loadData();
  };

  const handleDispatchVfd = async () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      loadData();
    }, 400);
  };

  const hasTrippedInterlock = interlocks.some((i) => i.tripped);

  if (isLoading || !wellState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent-mechanical border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-text-muted mt-3">
          Loading SCADA Control & Safety Matrix for {wellId}...
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        wellId={wellId}
        icon={<ShieldAlert className="w-5 h-5 text-accent-mechanical" />}
        title="SCADA Supervisory Control & Safety Interlocks"
        subtitle="Deterministic Hardware Safety Interlock Matrix · VFD Setpoint Modulation & Audit Trail"
        status={hasTrippedInterlock ? "critical" : "safe"}
        badge={hasTrippedInterlock ? "Interlock Trip Active" : "Interlocks Armed & Healthy"}
      />

      {/* ── VFD Modulation Advisory & Manual Setpoint ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecommendationCard
            recommendation={{
              id: `REC-${wellId}-01`,
              wellId: wellId,
              ts: new Date().toISOString(),
              actionType: "VFD_DAMPING",
              title: "Apply Asymmetric Downstroke Velocity Damping (-17%)",
              proposedParams: { downstrokeDampingPct: 17, spm: 4.8 },
              expectedImpact: { energyPct: -8.3, riskPct: -29.4, valueInrDay: 18500, productionBopd: -2.0 },
              autonomyTier: "advisory",
              status: "pending",
              explanation: `Reservoir cooling to ${wellState.inferred.bottomholeTempC.value}°C increased viscosity to ${wellState.inferred.viscosityCp.value.toLocaleString()} cP. Decelerating VFD downstroke prevents compressive rod buckling and valve pickup shock.`,
            }}
            onActionComplete={loadData}
          />
        </div>

        {/* Manual VFD Supervisory Modulation Panel */}
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              VFD Drive Frequency Setpoint
            </span>
            <span className="text-[10px] font-mono text-accent-mechanical font-semibold">45 kW Drive</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-sans text-text-secondary">Command Frequency:</span>
              <span className="font-mono text-2xl font-bold text-accent-mechanical tabular-nums">
                {vfdFrequencyHz.toFixed(1)} <span className="text-xs text-text-muted font-normal">Hz</span>
              </span>
            </div>

            <input
              type="range"
              min="30.0"
              max="50.0"
              step="0.5"
              value={vfdFrequencyHz}
              onChange={(e) => setVfdFrequencyHz(parseFloat(e.target.value))}
              className="w-full h-1 bg-surface-0 rounded appearance-none accent-accent-mechanical cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2 rounded bg-surface-0 border border-line">
              <div>
                <span className="text-[10px] text-text-muted font-sans uppercase">Pumping SPM:</span>
                <div className="font-bold text-text-primary mt-0.5 tabular-nums">{(vfdFrequencyHz / 8.5).toFixed(1)} SPM</div>
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-sans uppercase">Motor Current:</span>
                <div className="font-bold text-text-primary mt-0.5 tabular-nums">{wellState.observed.motorCurrentA} A</div>
              </div>
            </div>
          </div>

          <RoleGate
            roles={["operator", "engineer", "admin"]}
            fallback={
              <div className="text-[11px] font-sans text-text-muted italic text-center p-1">
                Dispatching setpoints requires Operator or Engineer credentials.
              </div>
            }
          >
            <button
              type="button"
              onClick={handleDispatchVfd}
              disabled={isDispatching}
              className="w-full py-2 px-4 rounded bg-accent-mechanical text-surface-0 font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:bg-accent-mechanical/90 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isDispatching ? "Transmitting Setpoint to SCADA..." : "Dispatch Setpoint to Wellsite VFD"}</span>
            </button>
          </RoleGate>
        </div>
      </div>

      {/* ── Deterministic 7-Point Safety Interlock Matrix ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent-thermal" />
            <h2 className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Deterministic 7-Point Safety Interlock Matrix
            </h2>
          </div>
          <span className="text-xs font-sans text-text-muted">
            Directly hardwired to emergency shutdown (ESD) loop
          </span>
        </div>

        <div className="space-y-2">
          {interlocks.map((item) => (
            <InterlockRow
              key={item.id}
              interlock={item}
              onUpdateLimit={(limit) => handleUpdateLimit(item.id, limit)}
            />
          ))}
        </div>
      </div>

      {/* ── Wellsite SCADA & Supervisory Audit Trail ── */}
      <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent-mechanical" />
            <span className="font-sans text-xs font-bold text-text-primary uppercase tracking-wide">
              Wellsite SCADA & Supervisory Audit Trail (Last 10 Events)
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            Air-Gapped Cryptographic SCADA Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-line text-text-muted font-medium">
                <th className="py-2 px-3 text-left font-mono">Timestamp</th>
                <th className="py-2 px-3 text-left">Operator / User</th>
                <th className="py-2 px-3 text-left">Action</th>
                <th className="py-2 px-3 text-left">Details</th>
                <th className="py-2 px-3 text-center font-mono">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {auditEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-text-muted">
                    No recent audit events for this well.
                  </td>
                </tr>
              ) : (
                auditEvents.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-2 px-3 text-text-muted font-mono whitespace-nowrap">{a.timestamp}</td>
                    <td className="py-2 px-3 font-medium text-text-primary whitespace-nowrap">
                      {a.user} <span className="text-[10px] text-text-muted font-mono">({a.role})</span>
                    </td>
                    <td className="py-2 px-3 text-accent-thermal font-medium">{a.action}</td>
                    <td className="py-2 px-3 text-text-secondary max-w-xs truncate">{a.details}</td>
                    <td className="py-2 px-3 text-center font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          a.status === "SUCCESS" || a.status === "DISPATCHED"
                            ? "bg-status-safe/15 text-status-safe"
                            : "bg-status-critical/15 text-status-critical"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
