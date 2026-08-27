/**
 * Oil India Limited - Baghewala Field Digital Twin Domain Types
 * Ministry of Petroleum & Natural Gas, Government of India
 * Hardened Model Contract & Domain Types
 */

export type TelemetrySource = 
  | "MEASURED" 
  | "ESTIMATED" 
  | "PREDICTED" 
  | "SIMULATED" 
  | "PUBLISHED_FIELD_REFERENCE" 
  | "ASSUMED" 
  | "SCENARIO";

export type CSSPhase = "INJECTION" | "SOAK" | "PRODUCTION" | "COOLING" | "CYCLE_END";

export type WellNodeId = 
  | "surface_unit" 
  | "wellhead" 
  | "casing" 
  | "tubing" 
  | "rod_string" 
  | "downhole_pump" 
  | "reservoir";

export type View3DMode = 
  | "STRUCTURE" 
  | "TEMPERATURE" 
  | "PRESSURE" 
  | "VISCOSITY" 
  | "DRAG" 
  | "RISK" 
  | "FLOW";

export type RiskSeverity = "NOMINAL" | "WARNING" | "CRITICAL";

export type ControlMode = "ADVISORY" | "SUPERVISED" | "AUTOMATED";

export interface ParameterWithProvenance<T = number | string> {
  value: T;
  unit: string;
  source: TelemetrySource;
  confidencePercent: number;
  uncertaintyMargin?: string;
  instrumentOrObserver?: string;
  notes?: string;
}

export interface ProvenanceMetadata {
  parameterId: string;
  label: string;
  valueString: string;
  unit: string;
  sourceType: TelemetrySource;
  instrumentOrModel: string;
  modelVersion?: string;
  lastSyncTimestamp: string;
  confidencePercent: number;
  uncertaintyMargin?: string;
  physicalEquation?: string;
  engineeringDescription: string;
}

export interface DigitalTwinDivergence {
  productionDivergencePercent: number; // e.g. 2.0%
  observedProductionBopd: number;
  predictedProductionBopd: number;
  surfaceLoadDivergencePercent: number;
  measuredPeakLoadLb: number;
  reconstructedPeakLoadLb: number;
  status: "OPTIMAL" | "ACCEPTABLE" | "DIVERGENT";
  summary: string;
}

export interface ModelAgreementMetric {
  physicsEstimate: number;
  mlSurrogateEstimate: number;
  agreementPercent: number; // e.g. 94%
  status: "HIGH_AGREEMENT" | "MODERATE" | "DISCREPANCY_REVIEW";
  governingMethod: string;
  notes: string;
}

export interface DynagraphPoint {
  positionInches: number;
  loadPounds: number;
}

export interface DynagraphDataset {
  surfaceCard: DynagraphPoint[];
  downholeCard: DynagraphPoint[];
  strokeProgress: number; // 0 to 1 along stroke cycle
  peakSurfaceLoadLb: number;
  minSurfaceLoadLb: number;
  fluidPoundDetected: boolean;
  rodFloatingDetected: boolean;
  pumpFillagePercent: number;
}

export interface DiagnosticProbability {
  condition: string;
  probability: number;
  severity: RiskSeverity;
  evidence: string[];
}

export interface OptimizationStrategy {
  id: "A" | "B" | "C";
  name: string;
  tagline: string;
  productionBopd: number;
  sor: number;
  energyKwhPerDay: number;
  rodFloatingRiskPercent: number;
  failureRiskPercent: number;
  dailyOperatingCostInr: number;
  dailyNetRevenueInr: number;
  spm: number;
  strokeLengthInches: number;
  vfdProfile: string;
  isRecommended: boolean;
  score: number;
  recommendationRationale: string;
}

export interface EconomicCutoffPoint {
  day: number;
  dailyGrossRevenueInr: number;
  dailyLiftingAndThermalCostInr: number;
  netMarginInr: number;
  cumulativeProfitInr: number;
}

export interface EconomicEvaluationInr {
  crudePriceInrPerBbl: number;
  dailyGrossRevenueInr: number;
  dailyLiftingPowerCostInr: number;
  dailyAmortizedSteamCostInr: number;
  dailyChemicalAndMaintenanceInr: number;
  dailyNetMarginInr: number;
  cumulativeProfitInr: number;
  projectedCutoffDay: number;
  daysRemainingToCutoff: number;
  cutoffConfidencePercent: number;
  economicRecommendation: string;
  curve: EconomicCutoffPoint[];
}

export interface SafetyInterlock {
  id: string;
  name: string;
  currentValue: string;
  limitThreshold: string;
  status: "SAFE" | "APPROACHING" | "TRIPPED";
  actionOnTrip: string;
}

export interface EngineeringAlert {
  id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
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

export interface ScenarioConfig {
  id: string;
  label: string;
  provenance: TelemetrySource;
  crudePriceInrPerBbl: number;
  steamCostInrPerBbl: number;
  electricityCostInrPerKwh: number;
  targetMaxRiskPercent: number;
  steamVolumeBbl: number;
  soakDays: number;
  nominalSpm: number;
  strokeLengthInches: number;
  downstrokeDampingPercent: number;
}

export interface WellOverview {
  wellId: string;
  wellName: string;
  field: string;
  formation: string;
  depthMeters: ParameterWithProvenance<number>;
  apiGravity: ParameterWithProvenance<number>;
  currentCycle: number;
  currentDay: number;
  phase: CSSPhase;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  bhtCelsius: ParameterWithProvenance<number>;
  viscosityCp: ParameterWithProvenance<number>;
  rodFloatingRiskPercent: number;
  productionBopd: ParameterWithProvenance<number>;
  twinConfidencePercent: number;
  latitude: number;
  longitude: number;
}

export interface WellTelemetryState {
  timestamp: string;
  telemetryMode: "DEMO_SYNTHETIC" | "LIVE_SCADA";
  wellId: string;
  wellName: string;
  field: string;
  formation: string;
  depthMeters: number;
  cssCycle: number;
  cssDay: number; // 0 - 45
  phase: CSSPhase;

  // Surface Transducers [MEASURED]
  polishedRodLoadLb: number;
  polishedRodPositionInches: number;
  spm: number;
  strokeLengthInches: number;
  motorPowerKw: number;
  motorCurrentAmps: number;
  wellheadTemperatureC: number;
  wellheadPressurePsi: number;
  casingPressurePsi: number;
  flowlineRateBpd: number;

  // Subsurface Inferred & Modelled [ESTIMATED / PREDICTED]
  bottomholeTemperatureC: number;
  bottomholePressurePsi: number;
  oilViscosityCentipoise: number;
  rodFluidDragPounds: number;
  pumpFillagePercent: number;
  downholeStrokeInches: number;
  reservoirThermalRadiusMeters: number;

  // Risk & Forecasts [PREDICTED]
  rodFloatingRiskPercent: number;
  rodBucklingTendency: RiskSeverity;
  estimatedNetBopd: number;
  steamOilRatio: number;
  dailyEnergyKwh: number;

  // Economics in Indian Rupees (₹)
  economics: EconomicEvaluationInr;

  // Subsystem Confidence [0 - 100]
  confidence: {
    telemetry: number;
    thermalModel: number;
    wellboreModel: number;
    rheologyModel: number;
    overall: number;
  };

  // Digital Twin Divergence & Model Agreement
  divergence: DigitalTwinDivergence;
  modelAgreement: ModelAgreementMetric;

  // Dynagraph State
  dynagraph: DynagraphDataset;

  // Optimization & Decision
  strategies: OptimizationStrategy[];
  currentStrategy: OptimizationStrategy;
  recommendedAction: {
    title: string;
    description: string;
    vfdDeltaPercent: number;
    expectedEnergyDelta: number;
    expectedProductionDelta: number;
    expectedRiskDelta: number;
  };
}

export interface TwinComputationResult {
  state: WellTelemetryState;
  provenanceMap: Record<string, ProvenanceMetadata>;
  alerts: EngineeringAlert[];
  scenarioConfig: ScenarioConfig;
}

export type DemoScenarioId = 
  | "NORMAL_OPERATION" 
  | "COOLING_RESERVOIR" 
  | "ROD_FLOATING_EVENT" 
  | "OPTIMAL_CSS_TIMING" 
  | "ENERGY_OPTIMIZATION";
