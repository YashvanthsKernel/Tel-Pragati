"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Languages,
  X,
  Server,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { Role } from "../../data/types";
import { useAuthStore } from "../../state/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { setRole, setUser } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<Role>("operator");
  const [userId, setUserId] = useState("Operator");
  const [password, setPassword] = useState("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showErrorBox, setShowErrorBox] = useState(true);
  const [errorMessage] = useState(
    "Invalid Credentials. Please check your inputs."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);

  // Role switching
  const handleRoleChange = (newRole: Role) => {
    setSelectedRole(newRole);
    if (newRole === "engineer") {
      setUserId("Tech");
      setPassword("Engineer@123");
    } else if (newRole === "operator") {
      setUserId("Operator");
      setPassword("Admin");
    } else if (newRole === "admin") {
      setUserId("Admin");
      setPassword("Admin@2026");
    } else {
      setUserId("Auditor");
      setPassword("Auditor@MoPNG");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let displayName = "Er. Arvind Sharma";
    let roleDesignation = "Senior Production Engineer";
    if (selectedRole === "operator") {
      displayName = "P. R. Joshi";
      roleDesignation = "Control Room Lead Operator";
    } else if (selectedRole === "admin") {
      displayName = "Dr. M. S. Rathore";
      roleDesignation = "Chief General Manager (Production)";
    } else if (selectedRole === "viewer") {
      displayName = "Guest Auditor (MoPNG)";
      roleDesignation = "Technical Inspection Officer";
    }

    setTimeout(() => {
      setRole(selectedRole);
      setUser(`${displayName} (${roleDesignation})`);
      setIsLoading(false);
      router.push("/field");
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-surface-0 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased text-text-primary selection:bg-accent-mechanical/30 selection:text-white">
      {/* ─── MAIN FLOATING 2-PANEL CONTAINER (MATCHING SITE DESIGN SYSTEM) ─────────── */}
      <div className="w-full max-w-4xl bg-surface-1 rounded-2xl shadow-card overflow-hidden flex flex-col md:flex-row border border-line">
        {/* ════════════════════════════════════════════════════════════════════════════
            LEFT COLUMN: THEMED INDUSTRIAL SURFACE WITH 3 STACKED CARDS
           ════════════════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[48%] bg-surface-2/90 border-b md:border-b-0 md:border-r border-line p-6 sm:p-8 flex flex-col justify-center items-center gap-4 sm:gap-5 select-none relative overflow-hidden">
          {/* Subtle Ambient Brand Glows matching site tokens */}
          <div className="absolute top-0 -left-10 w-48 h-48 bg-accent-mechanical/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -right-10 w-48 h-48 bg-accent-thermal/10 rounded-full blur-3xl pointer-events-none" />

          {/* CARD 1: Government / Ministry Credentials with Mechanical Teal Accent Border */}
          <div className="w-full bg-surface-1 rounded-xl border-2 border-accent-mechanical p-3.5 sm:p-4 shadow-sm flex items-center gap-3.5 transition-transform hover:scale-[1.01]">
            {/* Ashoka Lion Emblem Illustration */}
            <div className="w-12 h-14 flex-shrink-0 flex items-center justify-center text-text-primary">
              <svg
                viewBox="0 0 100 120"
                className="w-full h-full fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M50 5 C40 5 35 15 35 25 C35 32 40 38 45 40 C38 42 30 48 30 58 C30 70 42 78 50 80 C58 78 70 70 70 58 C70 48 62 42 55 40 C60 38 65 32 65 25 C65 15 60 5 50 5 Z M50 12 C55 12 58 18 58 24 C58 30 54 34 50 34 C46 34 42 30 42 24 C42 18 45 12 50 12 Z M50 82 C38 82 25 88 25 98 L75 98 C75 88 62 82 50 82 Z" />
                <circle cx="50" cy="108" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <text
                  x="50"
                  y="118"
                  textAnchor="middle"
                  fontSize="7"
                  fontFamily="serif"
                  fontWeight="bold"
                >
                  सत्यमेव जयते
                </text>
              </svg>
            </div>

            {/* Ministry Typography */}
            <div className="flex flex-col justify-center leading-snug">
              <div className="text-[12px] font-bold text-text-primary">
                Government of India | Ministry of Petroleum & Natural Gas
              </div>
              <div className="text-[11px] font-semibold text-text-secondary">
                Directorate General of Hydrocarbons (DGH)
              </div>
              <div className="text-[10px] text-text-muted font-medium">
                Oil India Limited · Baghewala Heavy Oil Asset
              </div>
            </div>
          </div>

          {/* CARD 2: Project Logo & Slogan with Thermal Rust Accent Border */}
          <div className="w-full bg-surface-1 rounded-xl border-2 border-accent-thermal p-4 sm:p-5 shadow-sm flex items-center justify-center transition-transform hover:scale-[1.01] overflow-hidden min-h-[110px]">
            <img
              src="/logo_transparent_name.png"
              alt="TEL PRAGATI - PROGRESS IN OIL PRODUCTION"
              className="max-h-20 w-auto object-contain"
            />
          </div>

          {/* CARD 3: Project Title Banner with Site Palette Styling */}
          <div className="w-full bg-surface-1 border border-line rounded-xl p-3.5 shadow-sm text-center transition-transform hover:scale-[1.01]">
            <h3 className="text-text-primary font-extrabold text-sm sm:text-base tracking-wider uppercase font-display">
              TEL PRAGATI DIGITAL TWIN
            </h3>
            <p className="text-accent-thermal font-bold text-[10px] sm:text-[11px] tracking-wider uppercase font-mono mt-0.5">
              WELL-TO-SURFACE HEAVY OIL O&amp;M PLATFORM
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: AUTHENTICATION FORM (USING SITE DESIGN TOKENS)
           ════════════════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[52%] bg-surface-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
          <div>
            {/* Header Row: Title & Language Selector */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-text-primary text-2xl sm:text-3xl font-black tracking-tight leading-none uppercase font-display">
                  WELCOME
                  <br />
                  <span className="text-text-primary">BACK</span>
                </h1>
                <div className="text-[11px] font-bold tracking-wider text-text-muted uppercase mt-2 font-mono">
                  SECURE AUTHENTICATION PORTAL
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex flex-col items-end">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Languages className="w-3.5 h-3.5 text-text-muted" />
                  <span>LANGUAGE</span>
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  aria-label="Select Language"
                  className="border border-line rounded-lg py-1 px-2.5 text-xs text-text-primary bg-surface-0 focus:outline-none focus:border-accent-mechanical cursor-pointer font-medium"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
                  <option value="Assamese">অসমীয়া (Assamese)</option>
                  <option value="Rajasthani">राजस्थानी (Rajasthani)</option>
                </select>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Field 1: Select Role */}
              <div>
                <label className="block text-[11px] font-extrabold text-text-primary uppercase tracking-wider mb-1">
                  SELECT ROLE
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                  className="w-full border border-line rounded-lg py-2.5 px-3 text-sm text-text-primary bg-surface-0 focus:outline-none focus:border-accent-mechanical focus:ring-1 focus:ring-accent-mechanical cursor-pointer font-medium"
                >
                  <option value="operator">Technician / Control Room Operator</option>
                  <option value="engineer">Senior Production Engineer</option>
                  <option value="admin">Chief General Manager / Asset Administrator</option>
                  <option value="viewer">Statutory Auditor (MoPNG Inspection)</option>
                </select>
              </div>

              {/* Field 2: User ID (with mechanical accent border matching site theme) */}
              <div>
                <label className="block text-[11px] font-extrabold text-text-primary uppercase tracking-wider mb-1">
                  USER ID
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter User ID"
                  className="w-full border-2 border-accent-mechanical rounded-lg py-2.5 px-3.5 text-sm text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent-mechanical/25 bg-surface-0"
                />
              </div>

              {/* Field 3: Password */}
              <div>
                <label className="block text-[11px] font-extrabold text-text-primary uppercase tracking-wider mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full border border-line rounded-lg py-2.5 pl-3.5 pr-10 text-sm text-text-primary font-medium focus:outline-none focus:border-accent-mechanical focus:ring-1 focus:ring-accent-mechanical bg-surface-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Helpdesk Notice / Notification Card (Styled with site status-critical-soft) */}
              {showErrorBox && (
                <div className="bg-status-critical-soft border border-status-critical/30 rounded-lg p-3.5 text-xs text-text-secondary space-y-1 relative">
                  <div className="flex items-center gap-1.5 text-status-critical font-bold text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-text-secondary leading-relaxed font-sans">
                    <div className="font-semibold text-text-primary">
                      Trouble Logging in? Contact Ministry / Asset NOC:
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-text-secondary">
                      <Phone className="w-3 h-3 text-text-muted" />
                      <span>Helpline: <strong>1800-345-OIL (1800-345-3477)</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail className="w-3 h-3 text-text-muted" />
                      <span>Support: help@telpragati.oilindia.in</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Action Button: ACCESS DASHBOARD > (Styled with accent-mechanical / thermal) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent-mechanical hover:bg-mechanical-dark text-white font-extrabold text-sm tracking-wider uppercase py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-glowMechanical transition-all cursor-pointer active:scale-[0.99] disabled:opacity-75"
              >
                {isLoading ? (
                  <span>AUTHENTICATING SCADA ACCESS...</span>
                ) : (
                  <>
                    <span>ACCESS DASHBOARD</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Footer Section: View Active Integrations List Link */}
          <div className="pt-5 mt-4 border-t border-line text-center">
            <button
              type="button"
              onClick={() => setShowIntegrationsModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-wider focus:outline-none"
            >
              <FileText className="w-3.5 h-3.5 text-text-muted" />
              <span>VIEW ACTIVE INTEGRATIONS LIST</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── ACTIVE INTEGRATIONS MODAL ──────────────────────────────────────────────── */}
      {showIntegrationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface-1 rounded-xl shadow-popup border border-line p-6 space-y-4 text-text-primary">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-mechanical-soft text-accent-mechanical flex items-center justify-center font-bold">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    TEL PRAGATI — Active Field & SCADA Integrations
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono">
                    Baghewala Asset Real-Time Topology
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntegrationsModal(false)}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-2 border border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent-mechanical" />
                  <div>
                    <div className="font-semibold text-text-primary">Baghewala Wellhead IoT Broker</div>
                    <div className="text-[10px] text-text-muted font-mono">MQTT TCP:1883 / WS:9001 (Active)</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-status-safe-soft text-status-safe text-[10px] font-bold">
                  ONLINE
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-2 border border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-accent-telemetry" />
                  <div>
                    <div className="font-semibold text-text-primary">TimescaleDB Telemetry Historian</div>
                    <div className="text-[10px] text-text-muted font-mono">PostgreSQL 16 :5432 (Hypertable Synced)</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-status-safe-soft text-status-safe text-[10px] font-bold">
                  ONLINE
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-2 border border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-thermal" />
                  <div>
                    <div className="font-semibold text-text-primary">MLflow Model Registry</div>
                    <div className="text-[10px] text-text-muted font-mono">Port :5000 (Physics + ML Fusion Engine)</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-status-safe-soft text-status-safe text-[10px] font-bold">
                  ONLINE
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setShowIntegrationsModal(false)}
                className="px-4 py-2 rounded-lg bg-accent-mechanical hover:bg-mechanical-dark text-xs font-bold text-white transition-colors"
              >
                Close Integrations View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
