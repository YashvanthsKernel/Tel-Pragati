/**
 * Baghewala Digital Twin - Data Provider Interface
 * Strictly adhering to Baghewala_Digital_Twin_Frontend_Build_Spec.md §5.1
 */

import {
  AuditEvent,
  AlertItem,
  DynamometerCard,
  FleetSummary,
  InterlockStatus,
  OptimizerResult,
  Recommendation,
  RecommendationStatus,
  Scenario,
  SimulationParams,
  SimulationResult,
  TelemetryPoint,
  WellState,
} from "./types";

export type Unsubscribe = () => void;

export interface DigitalTwinDataProvider {
  getFleetSummary(): Promise<FleetSummary>;
  getWellState(wellId: string): Promise<WellState>;
  subscribeWellState(wellId: string, onUpdate: (s: WellState) => void): Unsubscribe;
  getTelemetryRange(wellId: string, metric: string, from: Date, to: Date): Promise<TelemetryPoint[]>;
  getDynamometerLatest(wellId: string): Promise<DynamometerCard>;
  simulate(wellId: string, params: SimulationParams): Promise<SimulationResult>;
  getOptimizerResult(wellId: string): Promise<OptimizerResult>;
  getRecommendations(wellId: string, status?: RecommendationStatus): Promise<Recommendation[]>;
  approveRecommendation(id: string): Promise<void>;
  rejectRecommendation(id: string, reason: string): Promise<void>;
  getInterlocks(wellId: string): Promise<InterlockStatus[]>;
  updateInterlock(wellId: string, interlockId: string, limit: number): Promise<void>;
  getAuditEvents(wellId?: string): Promise<AuditEvent[]>;
  getAlerts(wellId?: string): Promise<AlertItem[]>;
  acknowledgeAlert(alertId: string): Promise<void>;
  listScenarios(): Promise<Scenario[]>;
  playScenario(scenarioId: string, speed: 1 | 2 | 5): Unsubscribe;
}
