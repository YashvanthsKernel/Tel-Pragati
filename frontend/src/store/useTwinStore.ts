/**
 * Oil India Limited - Master Digital Twin Store
 * Native React 19 / SSR-Safe Synchronized State Engine
 */

"use client";

import { useSyncExternalStore } from "react";
import {
  ControlMode,
  DemoScenarioId,
  EngineeringAlert,
  ProvenanceMetadata,
  ScenarioConfig,
  View3DMode,
  WellNodeId,
  WellTelemetryState,
} from "../types/twin";
import {
  DEFAULT_SCENARIO_CONFIG,
  deriveTwinComputationResult,
} from "../models/baghewalaPhysics";

interface TwinStoreState {
  selectedWellId: string;
  selectedCSSCycle: number;
  simulationDay: number; // 0 to 45
  isPlayingTimeline: boolean;
  timelineSpeed: number; // 1, 2, 5

  scenarioConfig: ScenarioConfig;
  twinState: WellTelemetryState;
  provenanceMap: Record<string, ProvenanceMetadata>;
  selectedWellNode: WellNodeId | null;
  selectedProvenance: ProvenanceMetadata | null;
  view3DMode: View3DMode;

  controlMode: ControlMode;
  isActionApproved: boolean;

  activeAlerts: EngineeringAlert[];
  isAlertDrawerOpen: boolean;
  isProvenanceDrawerOpen: boolean;
  isPhysicsXRayOpen: boolean;
  isFieldOverviewOpen: boolean;
  demoScenario: DemoScenarioId;

  // Actions
  setSimulationDay: (day: number) => void;
  setWellId: (wellId: string) => void;
  setView3DMode: (mode: View3DMode) => void;
  setScenarioConfig: (partial: Partial<ScenarioConfig>) => void;
  toggleTimelinePlay: () => void;
  setTimelineSpeed: (speed: number) => void;
  setSelectedWellNode: (node: WellNodeId | null) => void;
  openProvenance: (metadata: ProvenanceMetadata) => void;
  closeProvenance: () => void;
  setAlertDrawerOpen: (open: boolean) => void;
  setPhysicsXRayOpen: (open: boolean) => void;
  setFieldOverviewOpen: (open: boolean) => void;
  setControlMode: (mode: ControlMode) => void;
  setDemoScenario: (scenario: DemoScenarioId) => void;
  acknowledgeAlert: (alertId: string) => void;
  approveRecommendation: () => void;
}

const INITIAL_DAY = 25;
const INITIAL_WELL = "BGW-08";

const initialResult = deriveTwinComputationResult(
  INITIAL_WELL,
  INITIAL_DAY,
  DEFAULT_SCENARIO_CONFIG,
  "DEMO_SYNTHETIC"
);

let state: TwinStoreState = {
  selectedWellId: INITIAL_WELL,
  selectedCSSCycle: 4,
  simulationDay: INITIAL_DAY,
  isPlayingTimeline: false,
  timelineSpeed: 1,

  scenarioConfig: DEFAULT_SCENARIO_CONFIG,
  twinState: initialResult.state,
  provenanceMap: initialResult.provenanceMap,
  selectedWellNode: "rod_string",
  selectedProvenance: null,
  view3DMode: "STRUCTURE",

  controlMode: "ADVISORY",
  isActionApproved: false,

  activeAlerts: initialResult.alerts,
  isAlertDrawerOpen: false,
  isProvenanceDrawerOpen: false,
  isPhysicsXRayOpen: false,
  isFieldOverviewOpen: false,
  demoScenario: "COOLING_RESERVOIR",

  setSimulationDay: () => {},
  setWellId: () => {},
  setView3DMode: () => {},
  setScenarioConfig: () => {},
  toggleTimelinePlay: () => {},
  setTimelineSpeed: () => {},
  setSelectedWellNode: () => {},
  openProvenance: () => {},
  closeProvenance: () => {},
  setAlertDrawerOpen: () => {},
  setPhysicsXRayOpen: () => {},
  setFieldOverviewOpen: () => {},
  setControlMode: () => {},
  setDemoScenario: () => {},
  acknowledgeAlert: () => {},
  approveRecommendation: () => {},
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function updateState(partial: Partial<TwinStoreState>) {
  state = { ...state, ...partial };
  notify();
}

// Action Implementations
state.setSimulationDay = (day: number) => {
  const clampedDay = Math.max(0, Math.min(45, Math.round(day * 10) / 10));
  const res = deriveTwinComputationResult(
    state.selectedWellId,
    clampedDay,
    state.scenarioConfig,
    state.twinState.telemetryMode
  );
  updateState({
    simulationDay: clampedDay,
    twinState: res.state,
    provenanceMap: res.provenanceMap,
    activeAlerts: res.alerts,
  });
};

state.setWellId = (wellId: string) => {
  const res = deriveTwinComputationResult(
    wellId,
    state.simulationDay,
    state.scenarioConfig,
    state.twinState.telemetryMode
  );
  updateState({
    selectedWellId: wellId,
    twinState: res.state,
    provenanceMap: res.provenanceMap,
    activeAlerts: res.alerts,
  });
};

state.setView3DMode = (mode: View3DMode) => {
  updateState({ view3DMode: mode });
};

state.setScenarioConfig = (partial: Partial<ScenarioConfig>) => {
  const updatedConfig = { ...state.scenarioConfig, ...partial };
  const res = deriveTwinComputationResult(
    state.selectedWellId,
    state.simulationDay,
    updatedConfig,
    state.twinState.telemetryMode
  );
  updateState({
    scenarioConfig: updatedConfig,
    twinState: res.state,
    provenanceMap: res.provenanceMap,
    activeAlerts: res.alerts,
  });
};

state.toggleTimelinePlay = () => {
  updateState({ isPlayingTimeline: !state.isPlayingTimeline });
};

state.setTimelineSpeed = (speed: number) => {
  updateState({ timelineSpeed: speed });
};

state.setSelectedWellNode = (node: WellNodeId | null) => {
  updateState({ selectedWellNode: node });
};

state.openProvenance = (metadata: ProvenanceMetadata) => {
  updateState({
    selectedProvenance: metadata,
    isProvenanceDrawerOpen: true,
  });
};

state.closeProvenance = () => {
  updateState({
    isProvenanceDrawerOpen: false,
    selectedProvenance: null,
  });
};

state.setAlertDrawerOpen = (open: boolean) => {
  updateState({ isAlertDrawerOpen: open });
};

state.setPhysicsXRayOpen = (open: boolean) => {
  updateState({ isPhysicsXRayOpen: open });
};

state.setFieldOverviewOpen = (open: boolean) => {
  updateState({ isFieldOverviewOpen: open });
};

state.setControlMode = (mode: ControlMode) => {
  updateState({ controlMode: mode });
};

state.setDemoScenario = (scenario: DemoScenarioId) => {
  let targetDay = 25;
  let damping = 17;
  let spm = 5.2;

  if (scenario === "NORMAL_OPERATION") {
    targetDay = 14;
    damping = 0;
    spm = 5.6;
  } else if (scenario === "COOLING_RESERVOIR") {
    targetDay = 25;
    damping = 17;
    spm = 5.2;
  } else if (scenario === "ROD_FLOATING_EVENT") {
    targetDay = 35;
    damping = 0; // Unmitigated downstroke
    spm = 6.0;
  } else if (scenario === "OPTIMAL_CSS_TIMING") {
    targetDay = 41;
    damping = 22;
    spm = 4.2;
  } else if (scenario === "ENERGY_OPTIMIZATION") {
    targetDay = 18;
    damping = 12;
    spm = 4.8;
  }

  const updatedConfig: ScenarioConfig = {
    ...state.scenarioConfig,
    downstrokeDampingPercent: damping,
    nominalSpm: spm,
  };

  const res = deriveTwinComputationResult(
    state.selectedWellId,
    targetDay,
    updatedConfig,
    "DEMO_SYNTHETIC"
  );

  updateState({
    demoScenario: scenario,
    simulationDay: targetDay,
    scenarioConfig: updatedConfig,
    twinState: res.state,
    provenanceMap: res.provenanceMap,
    activeAlerts: res.alerts,
    isPlayingTimeline: false,
    isActionApproved: false,
  });
};

state.acknowledgeAlert = (alertId: string) => {
  updateState({
    activeAlerts: state.activeAlerts.map((a) =>
      a.id === alertId ? { ...a, isAcknowledged: true } : a
    ),
  });
};

state.approveRecommendation = () => {
  updateState({ isActionApproved: true });
};

export function useTwinStore<T = TwinStoreState>(selector?: (s: TwinStoreState) => T): T {
  const storeState = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => state,
    () => state
  );

  return selector ? selector(storeState) : (storeState as unknown as T);
}
