/**
 * Baghewala Digital Twin - Live Data Provider
 * Connects to live SCADA and ML backend per Architecture §16.
 * Provides resilient fallback to DemoDataProvider if backend is offline.
 * Strictly adhering to Baghewala_Digital_Twin_Frontend_Build_Spec.md §5.2 & §5.4
 */

import { demoDataProvider } from "../demo/DemoDataProvider";
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
} from "../types";

export class LiveDataProvider implements DigitalTwinDataProvider {
  private apiBaseUrl: string;
  private wsBaseUrl: string;
  private isOnline = false;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    this.wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/ws";
  }

  async getFleetSummary(): Promise<FleetSummary> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/fleet/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.isOnline = true;
      return await res.json();
    } catch {
      // Graceful fallback to demo provider per §5.4
      return demoDataProvider.getFleetSummary();
    }
  }

  async getWellState(wellId: string): Promise<WellState> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/wells/${wellId}/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.isOnline = true;
      return await res.json();
    } catch {
      return demoDataProvider.getWellState(wellId);
    }
  }

  subscribeWellState(wellId: string, onUpdate: (s: WellState) => void): Unsubscribe {
    let ws: WebSocket | null = null;
    let closed = false;

    try {
      ws = new WebSocket(`${this.wsBaseUrl}/wells/${wellId}/telemetry`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onUpdate(data);
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };
      ws.onerror = () => {
        if (!closed) {
          // Fallback to polling demo data
          demoDataProvider.subscribeWellState(wellId, onUpdate);
        }
      };
    } catch {
      return demoDataProvider.subscribeWellState(wellId, onUpdate);
    }

    return () => {
      closed = true;
      if (ws) {
        ws.close();
      }
    };
  }

  async getTelemetryRange(wellId: string, metric: string, from: Date, to: Date): Promise<TelemetryPoint[]> {
    try {
      const res = await fetch(
        `${this.apiBaseUrl}/wells/${wellId}/telemetry?metric=${metric}&from=${from.toISOString()}&to=${to.toISOString()}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.getTelemetryRange(wellId, metric, from, to);
    }
  }

  async getDynamometerLatest(wellId: string): Promise<DynamometerCard> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/wells/${wellId}/dynamometer/latest`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.getDynamometerLatest(wellId);
    }
  }

  async simulate(wellId: string, params: SimulationParams): Promise<SimulationResult> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/wells/${wellId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.simulate(wellId, params);
    }
  }

  async getOptimizerResult(wellId: string): Promise<OptimizerResult> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/wells/${wellId}/optimizer`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.getOptimizerResult(wellId);
    }
  }

  async getRecommendations(wellId: string, status?: RecommendationStatus): Promise<Recommendation[]> {
    try {
      const url = status
        ? `${this.apiBaseUrl}/wells/${wellId}/recommendations?status=${status}`
        : `${this.apiBaseUrl}/wells/${wellId}/recommendations`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.getRecommendations(wellId, status);
    }
  }

  async approveRecommendation(id: string): Promise<void> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/recommendations/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      return demoDataProvider.approveRecommendation(id);
    }
  }

  async rejectRecommendation(id: string, reason: string): Promise<void> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/recommendations/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      return demoDataProvider.rejectRecommendation(id, reason);
    }
  }

  async getInterlocks(wellId: string): Promise<InterlockStatus[]> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/wells/${wellId}/interlocks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.getInterlocks(wellId);
    }
  }

  async updateInterlock(wellId: string, interlockId: string, limit: number): Promise<void> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/wells/${wellId}/interlocks/${interlockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      return demoDataProvider.updateInterlock(wellId, interlockId, limit);
    }
  }

  async getAuditEvents(wellId?: string): Promise<AuditEvent[]> {
    try {
      const url = wellId ? `${this.apiBaseUrl}/audit?wellId=${wellId}` : `${this.apiBaseUrl}/audit`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.getAuditEvents(wellId);
    }
  }

  async getAlerts(wellId?: string): Promise<AlertItem[]> {
    try {
      const url = wellId ? `${this.apiBaseUrl}/alerts?wellId=${wellId}` : `${this.apiBaseUrl}/alerts`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return demoDataProvider.getAlerts(wellId);
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/alerts/${alertId}/ack`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      return demoDataProvider.acknowledgeAlert(alertId);
    }
  }

  async listScenarios(): Promise<Scenario[]> {
    return demoDataProvider.listScenarios();
  }

  playScenario(scenarioId: string, speed: 1 | 2 | 5): Unsubscribe {
    return demoDataProvider.playScenario(scenarioId, speed);
  }
}

export const liveDataProvider = new LiveDataProvider();
