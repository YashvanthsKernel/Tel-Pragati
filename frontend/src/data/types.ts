/**
 * Baghewala Digital Twin - Canonical TypeScript Contracts
 * Strictly adhering to Baghewala_Digital_Twin_Frontend_Build_Spec.md §6
 */

export interface EstimatedValue {
  value: number;
  trendPctPerDay?: number;
  confidence: number; // 0–1 or 0-100%
  labelSource?: "ground_truth" | "weak"; // AI/ML §5.4 ground_truth vs weak distinction
  unit?: string;
  uncertaintyMargin?: string;
  equation?: string;
  description?: string;
}

export type WellPhase = "inject" | "soak" | "produce" | "shut_in" | "unknown";
export type WellStatus = "producing" | "shut_in" | "css_active" | "alarm";

export interface WellState {
  wellId: string;
  wellName: string;
  cssCycle: number;
  day: number;
  phase: WellPhase;
  depthM: number;
  field: string;
  timestamp: string;
  observed: {
    surfaceTempC: number;
    flowBopd: number;
    motorCurrentA: number;
    tankLevelPct: number;
    polishedRodLoadLb: number;
    polishedRodPositionIn: number;
    spm: number;
    strokeLengthIn: number;
    casingPressurePsi: number;
    tubingPressurePsi: number;
  };
  inferred: {
    bottomholeTempC: EstimatedValue;
    viscosityCp: EstimatedValue;
    rodDragLb: EstimatedValue;
    downholeFillagePct: EstimatedValue;
    reservoirThermalRadiusM?: EstimatedValue;
  };
  fusion: {
    agreementPct: number;
    divergencePct: number;
    physicsValue: number;
    mlValue: number;
  };
  rodFloatingRiskPct: number;
  healthPct: number;
  source: "synthetic" | "rig" | "scada";
}

export interface WellSummary {
  wellId: string;
  name: string;
  lat: number;
  lon: number;
  padId: string;
  status: WellStatus;
  healthPct: number;
  flowBopd: number;
  depthM?: number;
  apiGravity?: number;
  cssCycle?: number;
  cssDay?: number;
  phase?: WellPhase;
  rodFloatingRiskPct?: number;
  bhtCelsius?: number;
  viscosityCp?: number;
}

export interface FleetSummary {
  fieldName: string;
  wells: WellSummary[];
  fieldKpis: {
    totalBopd: number;
    avgSorTrailing30d: number;
    activeAlerts: number;
    wellsInAlarm: number;
  };
}

export interface DynagraphTracePoint {
  position: number;
  load: number;
}

export interface DynamometerCard {
  wellId: string;
  ts: string;
  surfaceTrace: DynagraphTracePoint[];
  downholeTrace: DynagraphTracePoint[];
  classification: "normal" | "rod_floating" | "fluid_pound" | "gas_interference" | "traveling_valve_leak";
  confidence: number;
  labelSource: "ground_truth" | "weak";
  strokeProgress: number;
  peakSurfaceLoadLb: number;
  minSurfaceLoadLb: number;
  pumpFillagePct: number;
}

export type AutonomyTier = "advisory" | "supervised" | "automated";
export type RecommendationStatus = "pending" | "approved" | "rejected" | "dispatched" | "expired";

export interface Recommendation {
  id: string;
  wellId: string;
  ts: string;
  actionType: string;
  title: string;
  proposedParams: Record<string, number>;
  expectedImpact: {
    energyPct: number;
    riskPct: number;
    valueInrDay: number;
    productionBopd?: number;
  };
  autonomyTier: AutonomyTier;
  status: RecommendationStatus;
  explanation: string;
}

export interface InterlockStatus {
  id: string;
  name: string;
  currentValue: number;
  limit: number;
  unit: string;
  armed: boolean;
  tripped: boolean;
  severity: "safe" | "warn" | "critical";
  description?: string;
}

export interface OptimizerStrategy {
  name: string;
  label: string;
  productionBopd: number;
  energyKwhDay: number;
  rodRiskPct: number;
  costInrDay: number;
  netValueInrDay: number;
  recommended: boolean;
  spm: number;
  strokeLenIn: number;
  vfdProfile: string;
  rationale?: string;
}

export interface OptimizerResult {
  wellId: string;
  strategies: OptimizerStrategy[];
  paretoFrontier: {
    costInrDay: number;
    productionBopd: number;
    riskPct: number;
    name?: string;
  }[];
  economicCutoffDay: number;
  daysRemainingToCutoff: number;
  waterfallBreakdown: {
    grossRevenueInr: number;
    liftingPowerCostInr: number;
    steamThermalCostInr: number;
    chemicalMaintenanceInr: number;
    netMarginInr: number;
  };
}

export type Role = "viewer" | "operator" | "engineer" | "admin";

export interface Scenario {
  id: string;
  name: string;
  day: number;
  description: string;
  badge: string;
  spm: number;
  downstrokeDampingPct: number;
}

export interface SimulationParams {
  spm: number;
  strokeLengthIn: number;
  steamVolumeBbl: number;
  soakDays: number;
  downstrokeDampingPct: number;
  crudePriceInrPerBbl?: number;
}

export interface SimulationTrajectoryPoint {
  day: number;
  baselineTempC: number;
  simulatedTempC: number;
  baselineViscosityCp: number;
  simulatedViscosityCp: number;
  baselineProductionBopd: number;
  simulatedProductionBopd: number;
  baselineRiskPct: number;
  simulatedRiskPct: number;
}

export interface SimulationResult {
  wellId: string;
  params: SimulationParams;
  trajectory: SimulationTrajectoryPoint[];
  summary: {
    deltaProductionBopd: number;
    deltaRiskPct: number;
    deltaNetValueInrDay: number;
    recommended: boolean;
  };
}

export interface TelemetryPoint {
  timestamp: string;
  value: number;
  confidence?: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  wellId: string;
  user: string;
  role: Role;
  action: string;
  details: string;
  status: "SUCCESS" | "REJECTED" | "DISPATCHED" | "SYSTEM_TRIP";
}

export interface AlertItem {
  id: string;
  wellId: string;
  severity: "critical" | "warning" | "info";
  title: string;
  timestamp: string;
  condition: string;
  cause: string;
  impact: string;
  recommendation: string;
  confidencePercent: number;
  isAcknowledged: boolean;
  routeLink?: string;
}

export type Overlay3DMode =
  | "structure"
  | "temperature"
  | "pressure"
  | "viscosity"
  | "drag"
  | "rod_risk"
  | "fluid_flow";

export type CameraBookmark = "surface" | "downhole" | "full" | "cross_section";
