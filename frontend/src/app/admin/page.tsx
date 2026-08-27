"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Users,
  Database,
  Cpu,
  History,
  CheckCircle,
  AlertTriangle,
  Lock,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { useDataProvider } from "../../data/DataProviderContext";
import { useAuthStore } from "../../state/useAuthStore";
import { AuditEvent, InterlockStatus, Role } from "../../data/types";
import { RoleGate } from "../../components/shell/RoleGate";

export default function AdminSettingsPage() {
  const provider = useDataProvider();
  const { role, setRole } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"interlocks" | "models" | "users" | "audit">("interlocks");
  const [interlocks, setInterlocks] = useState<InterlockStatus[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([provider.getInterlocks("BGW-08"), provider.getAuditEvents()]).then(
      ([interlockList, auditList]) => {
        setInterlocks(interlockList);
        setAuditEvents(auditList);
      }
    );
  };

  useEffect(() => {
    loadData();
  }, [provider]);

  const handleSaveInterlock = async (id: string) => {
    const parsed = parseFloat(editLimit);
    if (isNaN(parsed)) return;

    await provider.updateInterlock("BGW-08", id, parsed);
    setEditingId(null);
    setMessage(`Updated interlock threshold for ${id} to ${parsed}.`);
    setTimeout(() => setMessage(null), 3000);
    loadData();
  };

  const modelRegistry = [
    {
      family: "Thermal State Estimator",
      stage: "Production",
      version: "v2.4.1",
      architecture: "Convective-Diffusion Physics + Neural Surrogate Observer",
      accuracyMetric: "94.2% Agreement (R² = 0.96)",
      promotedBy: "Er. Arvind Sharma (Senior Production Engineer)",
      promotedAt: "2026-08-20 14:32 IST",
    },
    {
      family: "Dynagraph Wave Inversion",
      stage: "Production",
      version: "v3.1.0",
      architecture: "Gibbs 1D Damped Wave Inversion Solver",
      accuracyMetric: "± 280 lb RMS Error",
      promotedBy: "Lead Automation Engineer",
      promotedAt: "2026-08-15 09:10 IST",
    },
    {
      family: "Rod Floating Prognostic Guard",
      stage: "Production",
      version: "v1.2.8",
      architecture: "Hydrodynamic Shear Classifier (Random Forest + PINN)",
      accuracyMetric: "96.8% Precision / 94.1% Recall",
      promotedBy: "Platform Admin",
      promotedAt: "2026-08-18 11:45 IST",
    },
    {
      family: "Economic Cut-Off Optimizer",
      stage: "Production",
      version: "v2.0.2",
      architecture: "Multi-Objective NSGA-II Pareto Solver",
      accuracyMetric: "₹ 1,200/day Revenue Precision",
      promotedBy: "Chief Reservoir Engineer",
      promotedAt: "2026-08-22 16:00 IST",
    },
  ];

  const usersList = [
    { id: "USR-01", name: "Er. Arvind Sharma", email: "arvind.sharma@oilindia.in", role: "engineer" as Role, designation: "Senior Production Engineer" },
    { id: "USR-02", name: "P. R. Joshi", email: "pr.joshi@oilindia.in", role: "operator" as Role, designation: "Control Room Lead Operator" },
    { id: "USR-03", name: "System Administrator", email: "admin.scada@oilindia.in", role: "admin" as Role, designation: "Principal SCADA Admin" },
    { id: "USR-04", name: "Dr. K. N. Rao", email: "kn.rao@oilindia.in", role: "viewer" as Role, designation: "Director of Exploration & Production" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent-mechanical" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-text-primary tracking-tight">
              Digital Twin Administration & Model Registry
            </h1>
          </div>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Role-Based Access Control · MLflow Production Model Catalog · Global Safety Interlock Limits
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-surface-1 p-1 rounded-lg border border-line text-xs font-mono">
          {(
            [
              { id: "interlocks", label: "Interlock Limits", icon: Lock },
              { id: "models", label: "Model Registry", icon: Cpu },
              { id: "users", label: "User RBAC", icon: Users },
              { id: "audit", label: "Audit Logs", icon: History },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors font-bold ${
                  activeTab === tab.id
                    ? "bg-accent-mechanical text-surface-0 font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="p-3 rounded bg-surface-1 border border-status-safe text-xs font-mono text-status-safe flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Tab 1: Global Safety Interlock Threshold Editor */}
      {activeTab === "interlocks" && (
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
              Global Field Safety Interlock Threshold Matrix
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              Threshold modifications are cryptographically signed to SCADA audit log
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-line text-text-muted">
                  <th className="py-2.5 px-3 text-left">Interlock ID</th>
                  <th className="py-2.5 px-3 text-left">Parameter Name</th>
                  <th className="py-2.5 px-3 text-left">Current Limit</th>
                  <th className="py-2.5 px-3 text-left">Unit</th>
                  <th className="py-2.5 px-3 text-left">Description</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {interlocks.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-surface-2 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-accent-mechanical">{item.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-text-primary">{item.name}</td>
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            className="w-24 px-2 py-0.5 rounded bg-surface-0 border border-line text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                            autoFocus
                          />
                        ) : (
                          <span className="font-bold text-text-primary">{item.limit.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">{item.unit}</td>
                      <td className="py-2.5 px-3 text-text-muted max-w-sm">{item.description}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveInterlock(item.id)}
                              className="p-1 rounded bg-status-safe text-white hover:bg-status-safe/90"
                              title="Save Limit"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-surface-2 text-text-muted hover:text-text-primary"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <RoleGate roles={["engineer", "admin"]}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditLimit(item.limit.toString());
                              }}
                              className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-accent-mechanical transition-colors"
                              title="Edit Threshold Limit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </RoleGate>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Model Registry Status View */}
      {activeTab === "models" && (
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
              MLflow Model Registry & AI Trust Catalog
            </span>
            <span className="text-[10px] font-mono text-status-safe font-bold">
              4 Models Serving Production Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelRegistry.map((m) => (
              <div key={m.family} className="p-4 rounded-lg bg-surface-0 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-text-primary">{m.family}</span>
                  <span className="px-2 py-0.5 rounded bg-status-safe/10 text-status-safe border border-status-safe/30 text-[10px] font-mono font-bold uppercase">
                    {m.stage} ({m.version})
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="text-text-muted">
                    Architecture: <span className="text-text-primary">{m.architecture}</span>
                  </div>
                  <div className="text-text-muted">
                    Accuracy Metric: <span className="text-accent-thermal font-bold">{m.accuracyMetric}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60 text-[11px] font-mono text-text-muted flex justify-between">
                  <span>Promoted by: {m.promotedBy}</span>
                  <span>{m.promotedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: User RBAC Management */}
      {activeTab === "users" && (
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
              Operational User Roles & Security Matrix (RBAC)
            </span>
            <span className="text-[10px] font-mono text-text-muted">OIL SCADA Security Boundary</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-line text-text-muted">
                  <th className="py-2.5 px-3 text-left">User ID</th>
                  <th className="py-2.5 px-3 text-left">Name</th>
                  <th className="py-2.5 px-3 text-left">Email</th>
                  <th className="py-2.5 px-3 text-left">Role</th>
                  <th className="py-2.5 px-3 text-left">Designation</th>
                  <th className="py-2.5 px-3 text-right">Switch Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-text-muted">{u.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-text-primary">{u.name}</td>
                    <td className="py-2.5 px-3 text-text-muted">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          u.role === "admin"
                            ? "bg-accent-thermal/20 text-accent-thermal"
                            : u.role === "engineer"
                            ? "bg-accent-mechanical/20 text-accent-mechanical"
                            : u.role === "operator"
                            ? "bg-status-safe/20 text-status-safe"
                            : "bg-surface-2 text-text-muted"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">{u.designation}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setRole(u.role);
                          setMessage(`Switched active operational role to ${u.role.toUpperCase()} (${u.name}).`);
                          setTimeout(() => setMessage(null), 3000);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                          role === u.role
                            ? "bg-status-safe text-white font-bold"
                            : "bg-surface-2 hover:bg-line text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {role === u.role ? "Active Persona" : "Switch"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Audit Log */}
      {activeTab === "audit" && (
        <div className="p-4 rounded-lg bg-surface-1 border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wide">
              Complete SCADA Cryptographic Audit Trail
            </span>
            <span className="text-[10px] font-mono text-text-muted">Total Events: {auditEvents.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-line text-text-muted">
                  <th className="py-2.5 px-3 text-left">Event ID</th>
                  <th className="py-2.5 px-3 text-left">Timestamp</th>
                  <th className="py-2.5 px-3 text-left">Well</th>
                  <th className="py-2.5 px-3 text-left">User / Role</th>
                  <th className="py-2.5 px-3 text-left">Action</th>
                  <th className="py-2.5 px-3 text-left">Details</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {auditEvents.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-accent-mechanical">{a.id}</td>
                    <td className="py-2.5 px-3 text-text-muted">{a.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-text-primary">{a.wellId}</td>
                    <td className="py-2.5 px-3 text-text-primary">
                      {a.user} <span className="text-text-muted">({a.role})</span>
                    </td>
                    <td className="py-2.5 px-3 text-accent-thermal font-medium">{a.action}</td>
                    <td className="py-2.5 px-3 text-text-muted max-w-xs truncate">{a.details}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-status-safe/20 text-status-safe">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
