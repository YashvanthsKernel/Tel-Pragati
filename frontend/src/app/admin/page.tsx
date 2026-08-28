"use client";

import React, { useEffect, useState } from "react";
import {
  Settings, Users, Database, Cpu, History, CheckCircle,
  Lock, Edit2, Check, X, Zap,
} from "lucide-react";
import { useDataProvider } from "../../data/DataProviderContext";
import { useAuthStore } from "../../state/useAuthStore";
import { AuditEvent, InterlockStatus, Role } from "../../data/types";
import { RoleGate } from "../../components/shell/RoleGate";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";

type TabId = "interlocks" | "models" | "users" | "audit";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "interlocks", label: "Interlock Limits", icon: Lock },
  { id: "models",     label: "Model Registry",  icon: Cpu },
  { id: "users",      label: "User RBAC",        icon: Users },
  { id: "audit",      label: "Audit Logs",       icon: History },
];

export default function AdminSettingsPage() {
  const provider = useDataProvider();
  const { role, setRole } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabId>("interlocks");
  const [interlocks, setInterlocks]     = useState<InterlockStatus[]>([]);
  const [auditEvents, setAuditEvents]   = useState<AuditEvent[]>([]);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editLimit, setEditLimit]       = useState<string>("");
  const [message, setMessage]           = useState<string | null>(null);

  const loadData = () => {
    Promise.all([provider.getInterlocks("BGW-08"), provider.getAuditEvents()]).then(
      ([interlockList, auditList]) => {
        setInterlocks(interlockList);
        setAuditEvents(auditList);
      }
    );
  };

  useEffect(() => { loadData(); }, [provider]);

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
    { family: "Thermal State Estimator", stage: "Production", version: "v2.4.1", architecture: "Convective-Diffusion Physics + Neural Surrogate Observer", accuracyMetric: "94.2% Agreement (R² = 0.96)", promotedBy: "Er. Arvind Sharma", promotedAt: "2026-08-20 14:32 IST" },
    { family: "Dynagraph Wave Inversion", stage: "Production", version: "v3.1.0", architecture: "Gibbs 1D Damped Wave Inversion Solver", accuracyMetric: "± 280 lb RMS Error", promotedBy: "Lead Automation Engineer", promotedAt: "2026-08-15 09:10 IST" },
    { family: "Rod Floating Prognostic Guard", stage: "Production", version: "v1.2.8", architecture: "Hydrodynamic Shear Classifier (Random Forest + PINN)", accuracyMetric: "96.8% Precision / 94.1% Recall", promotedBy: "Platform Admin", promotedAt: "2026-08-18 11:45 IST" },
    { family: "Economic Cut-Off Optimizer", stage: "Production", version: "v2.0.2", architecture: "Multi-Objective NSGA-II Pareto Solver", accuracyMetric: "₹1,200/day Revenue Precision", promotedBy: "Chief Reservoir Engineer", promotedAt: "2026-08-22 16:00 IST" },
  ];

  const usersList = [
    { id: "USR-01", name: "Er. Arvind Sharma",      email: "arvind.sharma@oilindia.in",  role: "engineer" as Role, designation: "Senior Production Engineer" },
    { id: "USR-02", name: "P. R. Joshi",            email: "pr.joshi@oilindia.in",       role: "operator" as Role, designation: "Control Room Lead Operator" },
    { id: "USR-03", name: "System Administrator",   email: "admin.scada@oilindia.in",    role: "admin"    as Role, designation: "Principal SCADA Admin" },
    { id: "USR-04", name: "Dr. K. N. Rao",          email: "kn.rao@oilindia.in",         role: "viewer"   as Role, designation: "Director of Exploration & Production" },
  ];

  const roleBadge = (r: Role) => {
    const map: Record<Role, string> = {
      admin:    "bg-accent-thermal/15 text-accent-thermal border-accent-thermal/30",
      engineer: "bg-accent-mechanical/15 text-accent-mechanical border-accent-mechanical/30",
      operator: "bg-status-safe/15 text-status-safe border-status-safe/30",
      viewer:   "bg-surface-2 text-text-muted border-line",
    };
    return map[r];
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 page-enter">

      {/* ── Page Header ───────────────────────────────── */}
      <PageHeader
        title="Administration & Model Registry"
        subtitle="Role-Based Access Control · MLflow Production Model Catalog · Global Safety Interlock Limits"
        status="live"
        actions={
          /* Tab navigation — flat underline style */
          <div className="flex items-center border-b-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all font-mono uppercase tracking-wide ${
                  activeTab === id
                    ? "border-accent-mechanical text-accent-mechanical bg-accent-mechanical/5"
                    : "border-transparent text-text-muted hover:text-text-primary hover:border-line-strong"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        }
      />

      {/* ── Success toast ──────────────────────────────── */}
      {message && (
        <div className="p-3 bg-status-safe/10 border border-status-safe/30 text-xs font-mono text-status-safe flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* ══ Tab 1: Interlock Limits ════════════════════ */}
      {activeTab === "interlocks" && (
        <SectionCard
          accent="warn"
          title="Global Field Safety Interlock Threshold Matrix"
          icon={<Lock className="w-3.5 h-3.5" />}
          action={<span className="text-[10px] font-mono text-text-muted">Modifications are cryptographically signed to SCADA audit log</span>}
        >
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs font-mono border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-line text-text-muted">
                  {["Interlock ID", "Parameter", "Current Limit", "Unit", "Description", "Action"].map((h, i) => (
                    <th key={h} className={`py-2.5 px-3 text-left font-semibold uppercase text-[10px] tracking-wider ${i === 5 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interlocks.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="border-b border-line/40 hover:bg-surface-2/40 transition-colors group">
                      <td className="py-3 px-3 font-bold text-accent-mechanical">{item.id}</td>
                      <td className="py-3 px-3 font-semibold text-text-primary">{item.name}</td>
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            className="w-24 px-2 py-1 bg-surface-0 border border-line text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                            autoFocus
                          />
                        ) : (
                          <span className="font-black text-text-primary">{item.limit.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-text-muted">{item.unit}</td>
                      <td className="py-3 px-3 text-text-muted max-w-sm">{item.description}</td>
                      <td className="py-3 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleSaveInterlock(item.id)} className="p-1.5 bg-status-safe text-white hover:bg-status-safe/80 transition-colors" title="Save">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-surface-2 text-text-muted hover:text-text-primary transition-colors" title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <RoleGate roles={["engineer", "admin"]}>
                            <button
                              onClick={() => { setEditingId(item.id); setEditLimit(item.limit.toString()); }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-surface-2 text-text-muted hover:text-accent-mechanical transition-all"
                              title="Edit Threshold"
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
        </SectionCard>
      )}

      {/* ══ Tab 2: Model Registry ══════════════════════ */}
      {activeTab === "models" && (
        <SectionCard
          accent="mechanical"
          title="MLflow Model Registry & AI Trust Catalog"
          icon={<Cpu className="w-3.5 h-3.5" />}
          action={<span className="text-[10px] font-mono text-status-safe font-bold">4 Models Serving Production Telemetry</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelRegistry.map((m) => (
              <div key={m.family} className="p-4 bg-surface-0 border border-line space-y-3 hover:border-accent-mechanical/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-sm font-bold text-text-primary line-clamp-1">{m.family}</span>
                  <span className="px-2 py-0.5 bg-status-safe/10 text-status-safe border border-status-safe/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse-subtle" />
                    {m.stage} · {m.version}
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-text-muted">Architecture: <span className="text-text-primary">{m.architecture}</span></div>
                  <div className="text-text-muted">Accuracy: <span className="text-accent-thermal font-bold">{m.accuracyMetric}</span></div>
                </div>
                <div className="pt-2 border-t border-line/50 text-[10px] font-mono text-text-muted flex justify-between">
                  <span>By: {m.promotedBy}</span>
                  <span>{m.promotedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ══ Tab 3: User RBAC ═══════════════════════════ */}
      {activeTab === "users" && (
        <SectionCard
          accent="mechanical"
          title="Operational User Roles & Security Matrix (RBAC)"
          icon={<Users className="w-3.5 h-3.5" />}
          action={<span className="text-[10px] font-mono text-text-muted">OIL SCADA Security Boundary</span>}
        >
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs font-mono border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-line text-text-muted">
                  {["User ID", "Name", "Email", "Role", "Designation", "Switch"].map((h, i) => (
                    <th key={h} className={`py-2.5 px-3 text-left font-semibold uppercase text-[10px] tracking-wider ${i === 5 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} className="border-b border-line/40 hover:bg-surface-2/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-text-muted">{u.id}</td>
                    <td className="py-3 px-3 font-semibold text-text-primary">{u.name}</td>
                    <td className="py-3 px-3 text-text-muted">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-muted">{u.designation}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => { setRole(u.role); setMessage(`Switched to ${u.role.toUpperCase()} (${u.name}).`); setTimeout(() => setMessage(null), 3000); }}
                        className={`px-3 py-1 text-xs font-mono transition-colors ${
                          role === u.role
                            ? "bg-status-safe/15 text-status-safe border border-status-safe/30 font-bold"
                            : "bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {role === u.role ? "Active" : "Switch"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ══ Tab 4: Audit Log ═══════════════════════════ */}
      {activeTab === "audit" && (
        <SectionCard
          accent="none"
          title="Complete SCADA Cryptographic Audit Trail"
          icon={<History className="w-3.5 h-3.5" />}
          action={<span className="text-[10px] font-mono text-text-muted">Total Events: {auditEvents.length}</span>}
        >
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs font-mono border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-line text-text-muted">
                  {["Event ID", "Timestamp", "Well", "User / Role", "Action", "Details", "Status"].map((h, i) => (
                    <th key={h} className={`py-2.5 px-3 text-left font-semibold uppercase text-[10px] tracking-wider ${i === 6 ? "text-center" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((a) => (
                  <tr key={a.id} className="border-b border-line/40 hover:bg-surface-2/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-accent-mechanical">{a.id}</td>
                    <td className="py-3 px-3 text-text-muted">{a.timestamp}</td>
                    <td className="py-3 px-3 font-bold text-text-primary">{a.wellId}</td>
                    <td className="py-3 px-3">{a.user} <span className="text-text-muted">({a.role})</span></td>
                    <td className="py-3 px-3 text-accent-thermal font-semibold">{a.action}</td>
                    <td className="py-3 px-3 text-text-muted max-w-xs truncate">{a.details}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-status-safe/10 text-status-safe border border-status-safe/20">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
