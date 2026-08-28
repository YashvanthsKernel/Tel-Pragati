"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, ChevronRight, Phone, Mail, FileText,
  Languages, X, Server, ShieldCheck, Cpu,
} from "lucide-react";
import { Role } from "../../data/types";
import { useAuthStore } from "../../state/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<Role>("operator");
  const [userId, setUserId]             = useState("Operator");
  const [password, setPassword]         = useState("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLoading, setIsLoading]       = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);

  const handleRoleChange = (newRole: Role) => {
    setSelectedRole(newRole);
    if      (newRole === "engineer") { setUserId("Tech");    setPassword("Engineer@123"); }
    else if (newRole === "operator") { setUserId("Operator");setPassword("Admin"); }
    else if (newRole === "admin")    { setUserId("Admin");   setPassword("Admin@2026"); }
    else                             { setUserId("Auditor"); setPassword("Auditor@MoPNG"); }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let displayName = "Er. Arvind Sharma";
    let roleDesignation = "Senior Production Engineer";
    if      (selectedRole === "operator") { displayName = "P. R. Joshi";           roleDesignation = "Control Room Lead Operator"; }
    else if (selectedRole === "admin")    { displayName = "Dr. M. S. Rathore";     roleDesignation = "Chief General Manager (Production)"; }
    else if (selectedRole === "viewer")   { displayName = "Guest Auditor (MoPNG)"; roleDesignation = "Technical Inspection Officer"; }

    setTimeout(() => {
      login(`${displayName} (${roleDesignation})`, selectedRole);
      setIsLoading(false);
      router.push("/field");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col font-sans antialiased text-text-primary selection:bg-accent-amber/30 selection:text-white">

      {/* ── Top Strip ─────────────────────────────────────────── */}
      <div className="h-10 bg-surface-1 border-b border-line px-6 flex items-center justify-between flex-shrink-0">
        {/* Left: OIL India / MoPNG badge */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          <span className="font-bold text-text-primary">OIL INDIA LIMITED</span>
          <span className="text-line">·</span>
          <span>MoPNG</span>
          <span className="text-line">·</span>
          <span>Baghewala Asset</span>
        </div>
        {/* Right: language selector */}
        <div className="flex items-center gap-2">
          <Languages className="w-3 h-3 text-text-muted" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border border-line rounded-sm py-0.5 px-1.5 text-[11px] text-text-primary bg-surface-2 focus:outline-none focus:border-accent-amber cursor-pointer font-medium"
          >
            <option value="English">English</option>
            <option value="Hindi">हिन्दी</option>
            <option value="Assamese">অসমীয়া</option>
            <option value="Rajasthani">राजस्थानी</option>
          </select>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* ═══ LEFT PANEL — Brand showcase ════════════════════════ */}
        <div className="hidden md:flex w-[45%] bg-surface-1 border-r border-line p-8 flex-col gap-6 flex-shrink-0">

          {/* Government badge block */}
          <div className="border border-line bg-surface-2 p-4 flex items-center gap-3.5">
            {/* Ashoka emblem */}
            <div className="w-12 h-14 flex-shrink-0 text-text-primary">
              <svg viewBox="0 0 100 120" className="w-full h-full fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5 C40 5 35 15 35 25 C35 32 40 38 45 40 C38 42 30 48 30 58 C30 70 42 78 50 80 C58 78 70 70 70 58 C70 48 62 42 55 40 C60 38 65 32 65 25 C65 15 60 5 50 5 Z M50 12 C55 12 58 18 58 24 C58 30 54 34 50 34 C46 34 42 30 42 24 C42 18 45 12 50 12 Z M50 82 C38 82 25 88 25 98 L75 98 C75 88 62 82 50 82 Z" />
                <circle cx="50" cy="108" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="50" y="118" textAnchor="middle" fontSize="7" fontFamily="serif" fontWeight="bold">सत्यमेव जयते</text>
              </svg>
            </div>
            <div className="leading-snug">
              <div className="text-[11px] font-bold text-text-primary">Government of India · MoPNG</div>
              <div className="text-[10px] text-text-secondary mt-0.5">Directorate General of Hydrocarbons (DGH)</div>
              <div className="text-[10px] text-text-muted">Oil India Limited · Baghewala Asset</div>
            </div>
          </div>

          {/* Logo block */}
          <div className="border border-line bg-surface-2 p-5 flex items-center justify-center min-h-[110px]">
            <img
              src="/logo_transparent_name.png"
              alt="TEL PRAGATI"
              className="max-h-20 w-auto object-contain"
            />
          </div>

          {/* Platform title block */}
          <div className="border border-line bg-surface-2 p-4 text-center rounded-lg">
            <h3 className="text-text-primary font-bold text-sm tracking-wide uppercase font-sans">
              TEL PRAGATI DIGITAL TWIN
            </h3>
            <p className="text-accent-amber font-bold text-[10px] tracking-wider uppercase font-mono mt-1">
              Well-to-Surface Heavy Oil O&M Platform
            </p>
          </div>

          {/* Bottom: tech stack indicators */}
          <div className="mt-auto flex items-center gap-4 text-[10px] font-mono text-text-muted border-t border-line pt-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse-subtle" />
              MQTT Live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mechanical animate-pulse-subtle" />
              TimescaleDB
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-telemetry animate-pulse-subtle" />
              MLflow
            </span>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Auth form ════════════════════════════ */}
        <div className="flex-1 bg-surface-0 p-8 sm:p-10 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">

            {/* Header */}
            <div className="mb-6 pb-3 border-b border-line-strong">
              <h2 className="text-text-primary text-lg font-black tracking-widest uppercase font-mono">
                SECURE ACCESS PORTAL
              </h2>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mt-1">
                TEL PRAGATI · OIL INDIA LIMITED
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">

              {/* Role select */}
              <div>
                <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-widest mb-1.5">
                  SELECT ROLE
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                  className="w-full border border-line rounded-sm py-2.5 px-3 text-sm text-text-primary bg-surface-2 focus:outline-none focus:border-accent-amber cursor-pointer font-medium"
                >
                  <option value="operator">Technician / Control Room Operator</option>
                  <option value="engineer">Senior Production Engineer</option>
                  <option value="admin">Chief General Manager / Asset Administrator</option>
                  <option value="viewer">Statutory Auditor (MoPNG Inspection)</option>
                </select>
              </div>

              {/* User ID */}
              <div>
                <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-widest mb-1.5">
                  USER ID
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter User ID"
                  className="w-full border border-line rounded-sm py-2.5 px-3 text-sm text-text-primary font-semibold focus:outline-none focus:border-accent-amber bg-surface-2 placeholder:text-text-disabled"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-extrabold text-text-secondary uppercase tracking-widest mb-1.5">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full border border-line rounded-sm py-2.5 pl-3 pr-10 text-sm text-text-primary font-medium focus:outline-none focus:border-accent-amber bg-surface-2 placeholder:text-text-disabled"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent-amber hover:opacity-90 text-surface-0 font-black text-sm tracking-widest uppercase py-3 px-6 rounded-sm flex items-center justify-center gap-2 transition-opacity cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-surface-0/40 border-t-surface-0 rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>ACCESS DASHBOARD</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>

              {/* Loading progress bar */}
              {isLoading && (
                <div className="h-0.5 bg-surface-2 overflow-hidden">
                  <div className="h-full bg-accent-amber animate-[shimmer_1s_ease_infinite] w-full" />
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="pt-5 mt-6 border-t border-line">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                <div className="flex items-center gap-3">
                  <a href="tel:18003453477" className="flex items-center gap-1 hover:text-text-primary transition-colors">
                    <Phone className="w-3 h-3" />1800-345-3477
                  </a>
                  <span className="text-line">|</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />help@telpragati.oilindia.in
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIntegrationsModal(true)}
                  className="flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  <FileText className="w-3 h-3" />Integrations
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Integrations Modal ─────────────────────────────────── */}
      {showIntegrationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-lg bg-surface-1 rounded-sm shadow-popup border border-line p-6 space-y-4 text-text-primary">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-mechanical-soft text-accent-mechanical flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">TEL PRAGATI — Active Integrations</h3>
                  <p className="text-[10px] text-text-muted font-mono">Baghewala Asset Real-Time Topology</p>
                </div>
              </div>
              <button onClick={() => setShowIntegrationsModal(false)} className="p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { icon: <Cpu className="w-4 h-4 text-accent-mechanical" />, name: "Baghewala Wellhead IoT Broker", detail: "MQTT TCP:1883 / WS:9001 (Active)" },
                { icon: <Server className="w-4 h-4 text-accent-telemetry" />, name: "TimescaleDB Telemetry Historian", detail: "PostgreSQL 16 :5432 (Hypertable Synced)" },
                { icon: <ShieldCheck className="w-4 h-4 text-accent-thermal" />, name: "MLflow Model Registry", detail: "Port :5000 (Physics + ML Fusion Engine)" },
              ].map((item) => (
                <div key={item.name} className="p-3 rounded-sm bg-surface-2 border border-line flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <div>
                      <div className="text-xs font-semibold text-text-primary">{item.name}</div>
                      <div className="text-[10px] text-text-muted font-mono">{item.detail}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-sm bg-status-safe/10 text-status-safe text-[10px] font-bold border border-status-safe/20">ONLINE</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1 border-t border-line">
              <button
                onClick={() => setShowIntegrationsModal(false)}
                className="px-4 py-2 rounded-sm bg-accent-amber hover:opacity-90 text-surface-0 text-xs font-bold transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
