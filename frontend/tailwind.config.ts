import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          DEFAULT: "var(--surface-1)",
          alt: "var(--surface-2)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        "app-border": "var(--line)",
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
          disabled:  "var(--text-disabled)",
        },
        oil: {
          red:        "var(--oil-red)",
          "red-soft": "var(--oil-red-soft)",
          charcoal:   "var(--oil-charcoal)",
        },
        /* Primary accent — Amber/Gold */
        accent: {
          amber:      "var(--accent-amber)",
          mechanical: "var(--accent-mechanical)",
          telemetry:  "var(--accent-telemetry)",
          thermal:    "var(--accent-thermal)",
        },
        amber: {
          DEFAULT: "var(--accent-amber)",
          dark:    "var(--amber-dark)",
          soft:    "var(--amber-soft)",
        },
        mechanical: {
          DEFAULT: "var(--accent-mechanical)",
          soft:    "var(--mechanical-soft)",
          dark:    "var(--mechanical-dark)",
        },
        thermal: {
          DEFAULT: "var(--accent-thermal)",
          hot:     "var(--thermal-hot)",
          mid:     "var(--thermal-mid)",
          warm:    "var(--thermal-warm)",
        },
        telemetry: {
          DEFAULT: "var(--accent-telemetry)",
          soft:    "var(--telemetry-soft)",
        },
        status: {
          safe:           "var(--status-safe)",
          "safe-soft":    "var(--status-safe-soft)",
          warn:           "var(--status-warn)",
          "warn-soft":    "var(--status-warn-soft)",
          critical:       "var(--status-critical)",
          "critical-soft":"var(--status-critical-soft)",
          info:           "var(--status-info)",
          "info-soft":    "var(--status-info-soft)",
          success:        "var(--status-safe)",
          warning:        "var(--status-warn)",
        },
        provenance: {
          measured:  "var(--provenance-measured)",
          estimated: "var(--provenance-estimated)",
          predicted: "var(--provenance-predicted)",
          simulated: "var(--provenance-simulated)",
        },
        depth: {
          "gradient-start": "var(--depth-gradient-start)",
          "gradient-mid":   "var(--depth-gradient-mid)",
          "gradient-warm":  "var(--depth-gradient-warm)",
          "gradient-end":   "var(--depth-gradient-end)",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "-apple-system", "sans-serif"],
        mono:    ["var(--font-ibm-plex-mono)", "'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        /* Industrial defaults — sharp corners */
        none: "0px",
        sm:   "2px",
        DEFAULT: "4px",
        md:   "4px",
        lg:   "6px",
        xl:   "8px",
        "2xl":"10px",
        full: "9999px",
      },
      boxShadow: {
        panel:    "0 1px 2px 0 rgba(0,0,0,0.30)",
        card:     "0 1px 3px 0 rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.03)",
        popup:    "0 8px 24px -4px rgba(0,0,0,0.60)",
        /* Status glows — subtle, not neon */
        glowAmber:    "0 0 8px rgba(245,166,35,0.20)",
        glowMechanical:"0 0 8px rgba(0,180,160,0.20)",
        glowCritical: "0 0 8px rgba(231,76,60,0.22)",
        glowThermal:  "0 0 8px rgba(232,93,66,0.20)",
      },
      maxWidth: {
        controlRoom: "1920px",
      },
    },
  },
  plugins: [],
};

export default config;
