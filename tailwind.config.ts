import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oil: {
          red: "#E31E24",
          redDark: "#B91C1C",
          redLight: "#FEE2E2",
          charcoal: "#2B2A29",
          charcoalDark: "#1B1B1B",
          charcoalLight: "#403E3D",
        },
        goi: {
          saffron: "#FF9933",
          green: "#138808",
        },
        status: {
          info: "#2563EB",
          success: "#15803D",
          warning: "#D97706",
          critical: "#B91C1C",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F1F4F7",
          subtle: "#E8EDF2",
          muted: "#DFE5EC",
        },
        app: {
          bg: "#F5F7FA",
          sidebar: "#ECEFF4",
          border: "#D8DEE6",
          borderDark: "#C2CCD8",
        },
        text: {
          primary: "#20252B",
          secondary: "#667085",
          muted: "#94A3B8",
          inverse: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'SF Mono'",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        panel: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
        popup: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        insetEng: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
