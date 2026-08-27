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
        // Spec design tokens (§3.1)
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
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
        },
        oil: {
          red: "var(--oil-red)",
          "red-soft": "var(--oil-red-soft)",
          charcoal: "var(--oil-charcoal)",
          redDark: "#B91C1C",
          redLight: "var(--oil-red-soft)",
          charcoalDark: "#1B1B1B",
          charcoalLight: "#403E3D",
        },
        accent: {
          thermal: "var(--accent-thermal)",
          mechanical: "var(--accent-mechanical)",
          telemetry: "var(--accent-telemetry)",
        },
        thermal: {
          DEFAULT: "var(--accent-thermal)",
          hot: "var(--thermal-hot)",
          mid: "var(--thermal-mid)",
          warm: "var(--thermal-warm)",
        },
        mechanical: {
          DEFAULT: "var(--accent-mechanical)",
          soft: "var(--mechanical-soft)",
          dark: "var(--mechanical-dark)",
        },
        telemetry: {
          DEFAULT: "var(--accent-telemetry)",
          soft: "var(--telemetry-soft)",
        },
        status: {
          safe: "var(--status-safe)",
          "safe-soft": "var(--status-safe-soft)",
          warn: "var(--status-warn)",
          "warn-soft": "var(--status-warn-soft)",
          critical: "var(--status-critical)",
          "critical-soft": "var(--status-critical-soft)",
          info: "var(--status-info)",
          "info-soft": "var(--status-info-soft)",
          // legacy backwards compatibility
          success: "var(--status-safe)",
          warning: "var(--status-warn)",
        },
        provenance: {
          measured: "var(--provenance-measured)",
          estimated: "var(--provenance-estimated)",
          predicted: "var(--provenance-predicted)",
          simulated: "var(--provenance-simulated)",
        },
        depth: {
          "gradient-start": "var(--depth-gradient-start)",
          "gradient-mid": "var(--depth-gradient-mid)",
          "gradient-warm": "var(--depth-gradient-warm)",
          "gradient-end": "var(--depth-gradient-end)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "-apple-system", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "'IBM Plex Mono'", "'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(32, 37, 43, 0.06), 0 1px 2px 0 rgba(32, 37, 43, 0.04)",
        popup: "0 6px 16px -2px rgba(32, 37, 43, 0.12)",
        glowThermal: "0 0 15px rgba(198, 91, 50, 0.25)",
        glowMechanical: "0 0 15px rgba(25, 127, 140, 0.25)",
      },
      maxWidth: {
        controlRoom: "1920px",
      },
    },
  },
  plugins: [],
};

export default config;
