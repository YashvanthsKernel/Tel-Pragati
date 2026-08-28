"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  User,
  Key,
  Globe,
  RefreshCw,
  Building2,
  BadgeCheck,
  Zap,
  Info,
  Phone,
  FileText,
  Sparkles,
} from "lucide-react";
import { Role } from "../../data/types";
import { useAuthStore } from "../../state/useAuthStore";

export default function SignUpPage() {
  const router = useRouter();
  const { setRole, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeOffset, setFontSizeOffset] = useState(0);
  const [showPolicyModal, setShowPolicyModal] = useState<"privacy" | "accessibility" | null>(null);

  // Form State
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    designation: "Production Engineer",
    department: "Subsurface & Heavy Oil Directorate",
    fieldLocation: "Baghewala Field - Jaisalmer Basin",
    requestedRole: "engineer" as Role,
    password: "",
    confirmPassword: "",
    securityAgreement: false,
    captchaInput: "",
  });

  // Captcha
  const [captchaCode, setCaptchaCode] = useState("9R4X2K");
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.securityAgreement) {
      alert("Please accept the OIL Cyber Security & OISD-179 Safety Protocol undertaking.");
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      alert("Passkeys do not match. Please verify.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const ticketRef = `OIL-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setSuccessMessage(
        `Workstation Access Request ${ticketRef} submitted successfully. Clearance routed to Cyber Security Directorate.`
      );
      // Auto-set state and redirect to login after short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }, 900);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-surface-0 text-text-primary ${
        highContrast ? "contrast-125 saturate-150" : ""
      } ${fontSizeOffset === 1 ? "text-[105%]" : fontSizeOffset === -1 ? "text-[95%]" : ""}`}
    >
      {/* ─── 1. OFFICIAL GOVT / CPSE TOP BANNER ────────────────────────────────────────── */}
      <div className="w-full bg-surface-1 border-b border-line text-xs select-none">
        {/* Tricolor National Stripe */}
        <div className="h-1 w-full flex">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-[#FFFFFF]" />
          <div className="h-full w-1/3 bg-[#138808]" />
        </div>

        <div className="max-w-[1920px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Official Emblem & Hierarchy */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-[10px]">
                🏛️
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-text-primary tracking-wide">
                  भारत सरकार | Government of India
                </span>
                <span className="hidden md:inline text-text-muted text-[11px] ml-2 pl-2 border-l border-line">
                  पेट्रोलियम एवं प्राकृतिक गैस मंत्रालय | Ministry of Petroleum & Natural Gas
                </span>
              </div>
            </div>

            <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-2 text-[10px] font-mono text-accent-mechanical border border-line">
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
              OIL INDIA LIMITED · A Maharatna CPSE
            </span>
          </div>

          {/* Accessibility & Language Selectors */}
          <div className="flex items-center gap-4 text-text-muted">
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-status-safe bg-status-safe-soft px-2.5 py-0.5 rounded border border-status-safe/30">
              <span className="w-2 h-2 rounded-full bg-status-safe animate-ping" />
              SCADA REGISTRATION PORTAL: ACTIVE
            </div>

            {/* Accessibility Font Size Toggle */}
            <div className="flex items-center gap-1 border-l border-line pl-3">
              <button
                type="button"
                onClick={() => setFontSizeOffset(-1)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono hover:text-text-primary ${
                  fontSizeOffset === -1 ? "bg-surface-2 text-accent-thermal font-bold" : ""
                }`}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizeOffset(0)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono hover:text-text-primary ${
                  fontSizeOffset === 0 ? "bg-surface-2 text-text-primary font-bold" : ""
                }`}
                title="Standard font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeOffset(1)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono hover:text-text-primary ${
                  fontSizeOffset === 1 ? "bg-surface-2 text-accent-thermal font-bold" : ""
                }`}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                highContrast
                  ? "bg-amber-400 text-black border-amber-400 font-bold"
                  : "border-line text-text-muted hover:text-text-primary"
              }`}
            >
              {highContrast ? "Standard" : "High Contrast"}
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1 border-l border-line pl-3">
              <Globe className="w-3.5 h-3.5" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-surface-2 border border-line text-text-primary text-xs rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value="EN">EN (English)</option>
                <option value="HI">HI (हिन्दी)</option>
                <option value="AS">AS (অসমীয়া)</option>
                <option value="RJ">RJ (राजस्थानी)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN WORKSPACE CONTAINER (SPLIT 2-PANEL LAYOUT) ────────────────────── */}
      <div className="flex-1 max-w-[1920px] w-full mx-auto p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ════════════════════════════════════════════════════════════════════════════
              LEFT PANEL (Registration Guidelines & Security Directives)
             ════════════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-surface-1 border border-line rounded-xl p-6 md:p-8 shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent-mechanical/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-thermal/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Brand Insignia */}
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-14 h-14 rounded-xl bg-surface-2/80 border border-line flex items-center justify-center p-1 shadow-card overflow-hidden">
                  <img src="/logo_transparent.png" alt="TEL PRAGATI" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-mechanical bg-mechanical-soft px-2 py-0.5 rounded border border-accent-mechanical/30">
                      Workstation Registration
                    </span>
                    <span className="text-[10px] font-mono text-status-safe bg-status-safe-soft px-1.5 py-0.5 rounded">
                      OISD-179 Standard
                    </span>
                  </div>
                  <h1 className="text-2xl font-sans font-bold text-text-primary tracking-tight mt-1">
                    TEL PRAGATI
                  </h1>
                  <p className="text-xs font-mono text-text-muted">
                    Baghewala Field Enterprise Digital Twin Access
                  </p>
                </div>
              </div>

              {/* RBAC Operational Clearance Levels */}
              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-lg bg-surface-2/80 border border-line text-xs">
                  <div className="flex items-center justify-between text-text-primary font-semibold mb-1">
                    <span>Role-Based Access Control (RBAC)</span>
                    <BadgeCheck className="w-4 h-4 text-accent-mechanical" />
                  </div>
                  <p className="text-text-muted leading-relaxed">
                    Clearance tiers determine access permissions to Gibbs wave dynamometer inversion, NSGA-II Pareto optimization, emergency trip acknowledgments, and audit logs.
                  </p>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-surface-0 border border-line flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text-primary">Level 3: Production Engineer</span>
                      <span className="text-text-muted block text-[10px]">What-If Simulation & Physics Calibration</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-accent-thermal/10 text-accent-thermal text-[10px] font-bold">FULL PHYSICS</span>
                  </div>

                  <div className="p-2.5 rounded bg-surface-0 border border-line flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text-primary">Level 2: Field Operator</span>
                      <span className="text-text-muted block text-[10px]">Telemetry Monitoring & VFD Dispatch</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-accent-mechanical/10 text-accent-mechanical text-[10px] font-bold">OPERATIONS</span>
                  </div>

                  <div className="p-2.5 rounded bg-surface-0 border border-line flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text-primary">Level 1: Statutory Auditor</span>
                      <span className="text-text-muted block text-[10px]">Read-Only Telemetry & Emission Reports</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-status-safe-soft text-status-safe text-[10px] font-bold">VIEWER</span>
                  </div>
                </div>
              </div>

              {/* Notice for Hackathon / Evaluation Jury */}
              <div className="p-3.5 rounded-lg bg-accent-thermal/10 border border-accent-thermal/30 text-xs">
                <div className="flex items-center gap-1.5 text-accent-thermal font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluating for SIH 2026?</span>
                </div>
                <p className="text-text-muted leading-relaxed">
                  You do not need to wait for registration approval! Instant access is available via the pre-configured Persona selector on the Sign In page.
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-1 text-accent-thermal font-bold hover:underline text-[11px]"
                >
                  <span>Go to Instant Sign In →</span>
                </Link>
              </div>
            </div>

            {/* Trust, Security & Helpdesk */}
            <div className="pt-4 border-t border-line/80 space-y-3 text-[11px] text-text-muted">
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 p-2 rounded bg-surface-0 border border-line">
                  <Lock className="w-3.5 h-3.5 text-accent-mechanical flex-shrink-0" />
                  <span>256-Bit TLS 1.3</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded bg-surface-0 border border-line">
                  <Shield className="w-3.5 h-3.5 text-status-safe flex-shrink-0" />
                  <span>CERT-In Audited</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Phone className="w-3 h-3 text-accent-thermal" />
                  NOC Support: 1800-345-3477
                </span>
                <span className="text-text-muted/60">v2.6-SIH</span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════════════
              RIGHT PANEL (Dedicated Sign Up / Registration Form)
             ════════════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 bg-surface-1 border border-line rounded-xl p-6 md:p-8 shadow-card flex flex-col justify-between">
            <div>
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-sans font-bold text-text-primary tracking-tight">
                    Register Digital Twin Workstation
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Create an official CPSE / Field Operator workstation identity
                  </p>
                </div>

                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-mono font-bold text-text-primary transition-colors flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-accent-mechanical" />
                  <span>Sign In</span>
                </Link>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="p-3 rounded-lg bg-surface-0 border border-line text-xs text-text-muted flex items-start gap-2">
                  <Info className="w-4 h-4 text-accent-mechanical flex-shrink-0 mt-0.5" />
                  <span>
                    Access to the Baghewala Well-to-Surface Digital Twin is restricted to authorized Oil India Limited personnel, MoPNG technical inspectors, and SIH 2026 evaluators.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      Full Name (Official Record) *
                    </label>
                    <input
                      type="text"
                      required
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      placeholder="Er. Rajesh Kumar"
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>

                  {/* Employee / Contractor ID */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      OIL Employee / Contractor PIN *
                    </label>
                    <input
                      type="text"
                      required
                      value={signupForm.employeeId}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, employeeId: e.target.value })
                      }
                      placeholder="OIL-ENG-9104"
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Official Email */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      Official Enterprise Email ID *
                    </label>
                    <input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="rajesh.kumar@oilindia.in"
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>

                  {/* Operational Role */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      Requested Operational Role (RBAC) *
                    </label>
                    <select
                      value={signupForm.requestedRole}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          requestedRole: e.target.value as Role,
                        })
                      }
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical cursor-pointer"
                    >
                      <option value="engineer">Senior Production Engineer (Level 3)</option>
                      <option value="operator">Control Room Operator (Level 2)</option>
                      <option value="admin">Platform Administrator (Level 4)</option>
                      <option value="viewer">MoPNG Auditor / Viewer (Level 1)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Designation */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      Designation & Directorate
                    </label>
                    <input
                      type="text"
                      value={signupForm.designation}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, designation: e.target.value })
                      }
                      placeholder="Production Engineer"
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>

                  {/* Field Location */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      Operational Asset / Location
                    </label>
                    <input
                      type="text"
                      value={signupForm.fieldLocation}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, fieldLocation: e.target.value })
                      }
                      placeholder="Baghewala Field - Jaisalmer Basin"
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      Create Security Passkey *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="Min 8 chars with symbols"
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-mono text-text-muted mb-1">
                      Confirm Security Passkey *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupForm.confirmPassword}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter passkey"
                      className="w-full px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>
                </div>

                {/* Security CAPTCHA */}
                <div>
                  <label className="block text-[11px] font-mono text-text-muted mb-1">
                    Security Verification Code (CAPTCHA) *
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-surface-2 border border-line rounded-lg font-mono font-bold text-base tracking-widest text-status-warn select-none flex items-center gap-2 shadow-inner">
                      <span className="italic line-through decoration-line/80">
                        {captchaCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="p-2 rounded-lg bg-surface-0 border border-line text-text-muted hover:text-text-primary hover:border-accent-mechanical transition-colors"
                      title="Refresh CAPTCHA"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      required
                      value={signupForm.captchaInput}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, captchaInput: e.target.value })
                      }
                      placeholder="Enter characters"
                      className="flex-1 px-3 py-2 bg-surface-0 border border-line rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent-mechanical"
                    />
                  </div>
                </div>

                {/* Safety & OISD Agreement */}
                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-text-muted pt-1">
                  <input
                    type="checkbox"
                    checked={signupForm.securityAgreement}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, securityAgreement: e.target.checked })
                    }
                    className="mt-0.5 rounded bg-surface-0 border-line text-accent-mechanical focus:ring-0 cursor-pointer"
                  />
                  <span>
                    I hereby undertake to adhere strictly to the Oil Industry Safety Directorate (OISD-179), CERT-In Cyber Security protocols, and statutory heavy-oil extraction safety envelopes.
                  </span>
                </label>

                {/* Feedback / Success State */}
                {successMessage && (
                  <div className="p-3 rounded-lg bg-status-safe-soft border border-status-safe/40 text-status-safe text-xs flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Submit Request Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg bg-accent-mechanical text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-mechanical/90 transition-all shadow-glowMechanical disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Access Request...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-white" />
                      <span>Submit Workstation Access Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Helper Links */}
            <div className="mt-6 pt-4 border-t border-line flex flex-wrap items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span>Already have an authorized ID?</span>
                <Link
                  href="/login"
                  className="text-accent-mechanical font-bold hover:underline"
                >
                  Sign In here →
                </Link>
              </div>

              <span className="font-mono text-[10px] text-text-muted/60">
                SCADA Node: Jaisalmer-BGW-01
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. OFFICIAL STATUTORY FOOTER ────────────────────────────────────────────── */}
      <footer className="w-full bg-surface-1 border-t border-line py-4 px-6 text-xs text-text-muted">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 font-mono text-[11px]">
            <button
              onClick={() => setShowPolicyModal("accessibility")}
              className="hover:text-text-primary hover:underline focus:outline-none"
            >
              Accessibility Statement (WCAG 2.1 AA)
            </button>
            <span className="text-line">|</span>
            <button
              onClick={() => setShowPolicyModal("privacy")}
              className="hover:text-text-primary hover:underline focus:outline-none"
            >
              Privacy & Data Sovereignty Policy
            </button>
            <span className="text-line">|</span>
            <span className="text-text-muted">
              Cyber Security Emergency:{" "}
              <strong className="text-accent-thermal font-mono">1800-345-OIL (Toll Free)</strong>
            </span>
          </div>

          <div className="text-[11px] font-mono text-center md:text-right text-text-muted/80">
            © 2026 Oil India Limited. All Rights Reserved. Ministry of Petroleum & Natural Gas, Govt. of India.
          </div>
        </div>
      </footer>

      {/* ─── 4. POLICY MODAL ───────────────────────────────────────────────────────── */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-1 border border-line rounded-xl p-6 shadow-popup space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-mechanical/20 text-accent-mechanical flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {showPolicyModal === "accessibility"
                    ? "Accessibility Statement (WCAG 2.1 AA)"
                    : "Privacy Policy & Data Sovereignty"}
                </h3>
                <p className="text-xs text-text-muted">
                  Oil India Limited · National Enterprise Portal Standards
                </p>
              </div>
            </div>

            {showPolicyModal === "accessibility" ? (
              <div className="text-xs text-text-muted space-y-2.5 leading-relaxed font-sans">
                <p>
                  This portal adheres to the Guidelines for Indian Government Websites (GIGW) and Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
                </p>
                <p>
                  <strong>Features implemented:</strong> High contrast color schemes, dynamic font resizing (A- / A / A+), semantic HTML5 ARIA attributes for screen readers, keyboard-accessible navigation across all SCADA widgets, and reduced-motion animations.
                </p>
              </div>
            ) : (
              <div className="text-xs text-text-muted space-y-2.5 leading-relaxed font-sans">
                <p>
                  <strong>Data Sovereignty & Security Notice:</strong> All reservoir simulation data, SCADA telemetry, and machine learning models are hosted on sovereign Indian infrastructure adhering to the Digital Personal Data Protection Act 2023.
                </p>
                <p>
                  Data transmission across the Baghewala Well-to-Surface platform is protected by 256-Bit SHA TLS 1.3 encryption with zero telemetry egress outside authorized CPSE boundaries.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPolicyModal(null)}
                className="px-4 py-2 rounded-lg bg-accent-mechanical hover:bg-accent-mechanical/90 text-xs font-semibold text-white transition-colors"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
