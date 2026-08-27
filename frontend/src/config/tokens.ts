/**
 * Baghewala Digital Twin - Precision Instrumentation Design Tokens
 * Strictly adhering to Baghewala_Digital_Twin_Frontend_Build_Spec.md §3.1
 */

export const TOKENS = {
  colors: {
    surface0: "#F3F5F7",
    surface1: "#FFFFFF",
    surface2: "#EEF2F5",
    surface3: "#E4E9EE",
    line: "#D1D8DF",
    lineStrong: "#AEB8C2",
    textPrimary: "#20252B",
    textSecondary: "#46515C",
    textMuted: "#74808B",
    textDisabled: "#AAB3BB",
    oilRed: "#E31E24",
    oilRedSoft: "#FDEBEC",
    oilCharcoal: "#2B2A29",
    accentThermal: "#C65B32",
    thermalHot: "#D9472E",
    thermalMid: "#E58A3A",
    thermalWarm: "#F0C27A",
    accentMechanical: "#197F8C",
    mechanicalSoft: "#E1F2F4",
    mechanicalDark: "#145E69",
    accentTelemetry: "#2868A8",
    telemetrySoft: "#E8F1F9",
    statusSafe: "#238B57",
    statusSafeSoft: "#E8F6EE",
    statusWarn: "#B77A08",
    statusWarnSoft: "#FFF5DC",
    statusCritical: "#C43D35",
    statusCriticalSoft: "#FCEAE9",
    statusInfo: "#2868A8",
    statusInfoSoft: "#E8F1F9",
    provenanceMeasured: "#2868A8",
    provenanceEstimated: "#197F8C",
    provenancePredicted: "#B77A08",
    provenanceSimulated: "#7650A5",
    depthGradientStart: "#DCEBF1",
    depthGradientMid: "#8DB7C3",
    depthGradientWarm: "#D58A58",
    depthGradientEnd: "#87432E",
  },
  typography: {
    display: "'Space Grotesk', -apple-system, sans-serif",
    body: "'Inter', -apple-system, sans-serif",
    mono: "'IBM Plex Mono', 'JetBrains Mono', monospace",
  },
  layout: {
    sidebarCollapsedWidth: 72,
    sidebarExpandedWidth: 240,
    topBarHeight: 56,
    maxContainerWidth: 1920,
    cardGutter: 16,
  },
} as const;

export type DesignTokens = typeof TOKENS;
