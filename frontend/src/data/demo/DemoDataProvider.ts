/**
 * Baghewala Digital Twin - Demo Data Provider
 * In-memory deterministic physics-based telemetry and state provider.
 * Strictly adhering to Baghewala_Digital_Twin_Frontend_Build_Spec.md §5.2
 */

import WELLS_REGISTRY from "../../config/wells.json";
import { DigitalTwinDataProvider, Unsubscribe } from "../provider";
import {
  AlertItem,
  AuditEvent,
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
  WellSummary,
} from "../types";
import {
  generateDynamometerCard,
  generateOptimizerResult,
  generateWellState,
  runSimulation,
} from "./physicsSim";

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: "NORMAL_OPERATION",
    name: "Normal Production",
    day: 14,
    description: "Peak thermal production phase in Jodhpur Sandstone. High mobility, nominal rod loads.",
    badge: "Day 14 · 118°C",
    spm: 5.6,
    downstrokeDampingPct: 0,
  },
  {
    id: "COOLING_RESERVOIR",
    name: "Reservoir Cooling & Viscosity Rise",
    day: 25,
    description: "Moderate temperature decay. Viscosity increases to 5,820 cP, initiating downstroke rod drag.",
    badge: "Day 25 · 74°C",
    spm: 5.2,
    downstrokeDampingPct: 17,
  },
  {
    id: "ROD_FLOATING_EVENT",
    name: "Severe Rod Floating & Buckling Hazard",
    day: 35,
    description: "Advanced cooling creates 11,400 cP crude. Downstroke drag counteracts 64% buoyant rod weight.",
    badge: "Day 35 · 52°C",
    spm: 6.0,
    downstrokeDampingPct: 0,
  },
  {
    id: "OPTIMAL_CSS_TIMING",
    name: "CSS Cycle Cut-Off Window",
    day: 41,
    description: "Net operating margin approaches break-even cutoff. Advisory to schedule next CSS steam cycle.",
    badge: "Day 41 · 42°C",
    spm: 4.2,
    downstrokeDampingPct: 22,
  },
  {
    id: "ENERGY_OPTIMIZATION",
    name: "Energy Minimization Envelope",
    day: 18,
    description: "Supervised VFD speed trimming to reduce electrical lifting energy consumption by 18%.",
    badge: "Day 18 · 102°C",
    spm: 4.8,
    downstrokeDampingPct: 12,
  },
];

export class DemoDataProvider implements DigitalTwinDataProvider {
  private activeScenario: Scenario = DEMO_SCENARIOS[1]; // Default: Cooling Reservoir (Day 25)
  private currentDay = 25;
  private currentSpm = 5.2;
  private currentDamping = 17;
  private listeners: Map<string, Set<(s: WellState) => void>> = new Map();
  private timer: NodeJS.Timeout | null = null;

  // In-memory mutable states
  private recommendations: Map<string, Recommendation[]> = new Map();
  private interlocks: Map<string, InterlockStatus[]> = new Map();
  private auditEvents: AuditEvent[] = [];
  private alerts: AlertItem[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed initial interlocks
    WELLS_REGISTRY.forEach((w) => {
      this.interlocks.set(w.wellId, [
        { id: "INT-1", name: "Stuffing Box Temp", currentValue: 68, limit: 95, unit: "°C", armed: true, tripped: false, severity: "safe", description: "Surface stuffing box packing seal temperature limit" },
        { id: "INT-2", name: "Surface Pressure", currentValue: 180, limit: 350, unit: "psi", armed: true, tripped: false, severity: "safe", description: "Wellhead flowline casing backpressure threshold" },
        { id: "INT-3", name: "Peak Rod Load (PPRL)", currentValue: 19800, limit: 24500, unit: "lb", armed: true, tripped: false, severity: "safe", description: "API Grade D rod string tensile yield limit" },
        { id: "INT-4", name: "Min Rod Load / Floating", currentValue: 3200, limit: 1500, unit: "lb", armed: true, tripped: false, severity: "warn", description: "Minimum compression threshold to prevent rod buckling" },
        { id: "INT-5", name: "Motor Thermal Amps", currentValue: 42, limit: 58, unit: "A", armed: true, tripped: false, severity: "safe", description: "VFD drive motor continuous rated current" },
        { id: "INT-6", name: "Wellsite Tank Level", currentValue: 64, limit: 90, unit: "%", armed: true, tripped: false, severity: "safe", description: "Surface storage tank overflow protection" },
        { id: "INT-7", name: "Surface Vibration / ESD", currentValue: 0.18, limit: 0.85, unit: "in/s", armed: true, tripped: false, severity: "safe", description: "Emergency shutdown seismic / mechanical trip" },
      ]);

      this.recommendations.set(w.wellId, [
        {
          id: `REC-${w.wellId}-01`,
          wellId: w.wellId,
          ts: new Date().toISOString(),
          actionType: "VFD_DAMPING",
          title: "Apply Asymmetric Downstroke Velocity Damping (-17%)",
          proposedParams: { downstrokeDampingPct: 17, spm: 4.8 },
          expectedImpact: { energyPct: -8.3, riskPct: -29.4, valueInrDay: 18500, productionBopd: -2.0 },
          autonomyTier: "advisory",
          status: "pending",
          explanation: "Heavy crude viscosity rising to 5,820 cP at 74°C. Decelerating downstroke prevents compressive rod float and valve pickup shock.",
        },
        {
          id: `REC-${w.wellId}-02`,
          wellId: w.wellId,
          ts: new Date(Date.now() - 3600000).toISOString(),
          actionType: "SPEED_TRIM",
          title: "Optimize SPM for Dynamic Lift Energy Efficiency",
          proposedParams: { spm: 4.6 },
          expectedImpact: { energyPct: -11.2, riskPct: -4.5, valueInrDay: 14200, productionBopd: 0 },
          autonomyTier: "supervised",
          status: "pending",
          explanation: "Downhole fillage at 91%. Lowering SPM matches reservoir fluid inflow rate while saving electrical lifting power.",
        },
      ]);
    });

    // Seed initial alerts
    this.alerts = [
      {
        id: "ALT-ROD-01",
        wellId: "BGW-08",
        severity: "warning",
        title: "Rod-Floating Hazard Exceeds Operating Threshold",
        timestamp: "09:12 IST",
        condition: "Downstroke viscous drag (7,840 lb) counteracts 43% of buoyant rod weight.",
        cause: "Reservoir cooling to 74.2°C, increasing heavy crude viscosity to 5,820 cP.",
        impact: "High probability of compressive rod slackening and premature valve fatigue.",
        recommendation: "Apply asymmetric downstroke velocity damping (-17%) via VFD.",
        confidencePercent: 93,
        isAcknowledged: false,
        routeLink: "/well/BGW-08/diagnostics",
      },
      {
        id: "ALT-ECO-02",
        wellId: "BGW-04",
        severity: "critical",
        title: "Approaching CSS Cycle Economic Cut-Off",
        timestamp: "08:45 IST",
        condition: "Projected economic break-even cutoff in 2 days (Day 41).",
        cause: "Daily crude revenue approaching lifting and thermal operating cost threshold.",
        impact: "Marginal operating profit decreases below ₹15,000/day.",
        recommendation: "Schedule steam generator allocation for next CSS cycle.",
        confidencePercent: 88,
        isAcknowledged: false,
        routeLink: "/well/BGW-04/optimizer",
      },
      {
        id: "ALT-SYS-03",
        wellId: "BGW-01",
        severity: "info",
        title: "Surface Telemetry Ingestion Active",
        timestamp: "08:00 IST",
        condition: "Telemetry stream linked to Baghewala SCADA node #1.",
        cause: "Continuous polling loop active.",
        impact: "Telemetry completeness at 99%.",
        recommendation: "No maintenance action required.",
        confidencePercent: 99,
        isAcknowledged: true,
      },
    ];

    // Seed initial audit events
    this.auditEvents = [
      {
        id: "AUD-101",
        timestamp: "2026-08-26 08:30 IST",
        wellId: "BGW-08",
        user: "Senior Operations Engineer",
        role: "engineer",
        action: "VFD Modulation Approved",
        details: "Dispatched downstroke damping to 17% via supervisory setpoint.",
        status: "DISPATCHED",
      },
      {
        id: "AUD-100",
        timestamp: "2026-08-26 07:15 IST",
        wellId: "BGW-02",
        user: "Field Operator",
        role: "operator",
        action: "Interlock Limit Verified",
        details: "Confirmed Surface Pressure threshold at 350 psi.",
        status: "SUCCESS",
      },
    ];
  }

  public setDay(day: number) {
    this.currentDay = Math.max(0, Math.min(45, day));
    this.notifyAll();
  }

  public setScenario(scenarioId: string) {
    const scn = DEMO_SCENARIOS.find((s) => s.id === scenarioId) || DEMO_SCENARIOS[0];
    this.activeScenario = scn;
    this.currentDay = scn.day;
    this.currentSpm = scn.spm;
    this.currentDamping = scn.downstrokeDampingPct;
    this.notifyAll();
  }

  private notifyAll() {
    WELLS_REGISTRY.forEach((w) => {
      const state = this.computeWellState(w.wellId);
      const callbacks = this.listeners.get(w.wellId);
      if (callbacks) {
        callbacks.forEach((cb) => cb(state));
      }
    });
  }

  private computeWellState(wellId: string): WellState {
    return generateWellState(
      wellId,
      this.currentDay,
      undefined,
      this.currentSpm,
      this.currentDamping
    );
  }

  async getFleetSummary(): Promise<FleetSummary> {
    const wells: WellSummary[] = WELLS_REGISTRY.map((w) => {
      const state = this.computeWellState(w.wellId);
      return {
        wellId: w.wellId,
        name: w.name,
        lat: w.lat,
        lon: w.lon,
        padId: w.padId,
        status: w.status as any,
        healthPct: state.healthPct,
        flowBopd: state.observed.flowBopd,
        depthM: w.depthM,
        apiGravity: w.apiGravity,
        cssCycle: state.cssCycle,
        cssDay: state.day,
        phase: state.phase,
        rodFloatingRiskPct: state.rodFloatingRiskPct,
        bhtCelsius: state.inferred.bottomholeTempC.value,
        viscosityCp: state.inferred.viscosityCp.value,
      };
    });

    const totalBopd = wells.reduce((acc, w) => acc + w.flowBopd, 0);
    const activeAlerts = this.alerts.filter((a) => !a.isAcknowledged).length;
    const wellsInAlarm = wells.filter((w) => w.status === "alarm" || (w.rodFloatingRiskPct || 0) > 75).length;

    return {
      fieldName: "Baghewala Field · Jodhpur Sandstone",
      wells,
      fieldKpis: {
        totalBopd,
        avgSorTrailing30d: 6.8,
        activeAlerts,
        wellsInAlarm,
      },
    };
  }

  async getWellState(wellId: string): Promise<WellState> {
    return this.computeWellState(wellId);
  }

  subscribeWellState(wellId: string, onUpdate: (s: WellState) => void): Unsubscribe {
    if (!this.listeners.has(wellId)) {
      this.listeners.set(wellId, new Set());
    }
    this.listeners.get(wellId)!.add(onUpdate);

    // Immediately trigger with current state
    onUpdate(this.computeWellState(wellId));

    return () => {
      this.listeners.get(wellId)?.delete(onUpdate);
    };
  }

  async getTelemetryRange(wellId: string, metric: string, from: Date, to: Date): Promise<TelemetryPoint[]> {
    const points: TelemetryPoint[] = [];
    const count = 30;
    const now = to.getTime();
    const interval = (to.getTime() - from.getTime()) / count;

    for (let i = 0; i < count; i++) {
      const time = new Date(from.getTime() + i * interval);
      const dayOffset = (i / count) * 45;
      const state = generateWellState(wellId, dayOffset);
      let val = state.observed.flowBopd;
      if (metric === "temperature" || metric === "bht") {
        val = state.inferred.bottomholeTempC.value;
      } else if (metric === "viscosity") {
        val = state.inferred.viscosityCp.value;
      } else if (metric === "risk") {
        val = state.rodFloatingRiskPct;
      }
      points.push({
        timestamp: time.toISOString(),
        value: val,
        confidence: 0.94,
      });
    }
    return points;
  }

  async getDynamometerLatest(wellId: string): Promise<DynamometerCard> {
    const state = this.computeWellState(wellId);
    return generateDynamometerCard(
      wellId,
      144,
      state.observed.spm,
      state.inferred.rodDragLb.value,
      state.rodFloatingRiskPct,
      state.inferred.downholeFillagePct.value
    );
  }

  async simulate(wellId: string, params: SimulationParams): Promise<SimulationResult> {
    return runSimulation(wellId, params);
  }

  async getOptimizerResult(wellId: string): Promise<OptimizerResult> {
    return generateOptimizerResult(wellId, this.currentDay, this.currentSpm);
  }

  async getRecommendations(wellId: string, status?: RecommendationStatus): Promise<Recommendation[]> {
    const recs = this.recommendations.get(wellId) || [];
    if (status) {
      return recs.filter((r) => r.status === status);
    }
    return recs;
  }

  async approveRecommendation(id: string): Promise<void> {
    let targetRec: Recommendation | undefined;
    for (const [wellId, list] of this.recommendations.entries()) {
      const found = list.find((r) => r.id === id);
      if (found) {
        found.status = "approved";
        targetRec = found;
        if (found.proposedParams.downstrokeDampingPct !== undefined) {
          this.currentDamping = found.proposedParams.downstrokeDampingPct;
        }
        if (found.proposedParams.spm !== undefined) {
          this.currentSpm = found.proposedParams.spm;
        }
        this.notifyAll();
        break;
      }
    }

    if (targetRec) {
      this.auditEvents.unshift({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST",
        wellId: targetRec.wellId,
        user: "Control Room Engineer",
        role: "engineer",
        action: `Recommendation Approved: ${targetRec.title}`,
        details: targetRec.explanation,
        status: "SUCCESS",
      });
    }
  }

  async rejectRecommendation(id: string, reason: string): Promise<void> {
    for (const [, list] of this.recommendations.entries()) {
      const found = list.find((r) => r.id === id);
      if (found) {
        found.status = "rejected";
        this.auditEvents.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST",
          wellId: found.wellId,
          user: "Control Room Operator",
          role: "operator",
          action: `Recommendation Rejected: ${found.title}`,
          details: `Reason: ${reason}`,
          status: "REJECTED",
        });
        break;
      }
    }
  }

  async getInterlocks(wellId: string): Promise<InterlockStatus[]> {
    return this.interlocks.get(wellId) || [];
  }

  async updateInterlock(wellId: string, interlockId: string, limit: number): Promise<void> {
    const list = this.interlocks.get(wellId);
    if (list) {
      const item = list.find((i) => i.id === interlockId);
      if (item) {
        const oldLimit = item.limit;
        item.limit = limit;
        this.auditEvents.unshift({
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST",
          wellId,
          user: "Lead Automation Engineer",
          role: "engineer",
          action: `Interlock Threshold Modified: ${item.name}`,
          details: `Changed limit from ${oldLimit} ${item.unit} to ${limit} ${item.unit}`,
          status: "SUCCESS",
        });
      }
    }
  }

  async getAuditEvents(wellId?: string): Promise<AuditEvent[]> {
    if (wellId) {
      return this.auditEvents.filter((a) => a.wellId === wellId);
    }
    return this.auditEvents;
  }

  async getAlerts(wellId?: string): Promise<AlertItem[]> {
    if (wellId) {
      return this.alerts.filter((a) => a.wellId === wellId);
    }
    return this.alerts;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.isAcknowledged = true;
    }
  }

  async listScenarios(): Promise<Scenario[]> {
    return DEMO_SCENARIOS;
  }

  playScenario(scenarioId: string, speed: 1 | 2 | 5): Unsubscribe {
    this.setScenario(scenarioId);
    if (this.timer) {
      clearInterval(this.timer);
    }

    const intervalMs = Math.round(1000 / speed);
    this.timer = setInterval(() => {
      let nextDay = this.currentDay + 0.5;
      if (nextDay > 45) {
        nextDay = 0;
      }
      this.setDay(nextDay);
    }, intervalMs);

    return () => {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  }
}

// Singleton demo provider instance
export const demoDataProvider = new DemoDataProvider();
