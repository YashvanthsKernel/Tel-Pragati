"use client";

import { create } from "zustand";
import { demoDataProvider, DEMO_SCENARIOS } from "../data/demo/DemoDataProvider";

interface TimeMachineState {
  activeScenarioId: string;
  currentDay: number;
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  setScenarioId: (scenarioId: string) => void;
  setDay: (day: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: 1 | 2 | 5) => void;
}

let playCleanup: (() => void) | null = null;

export const useTimeMachineStore = create<TimeMachineState>((set, get) => ({
  activeScenarioId: "COOLING_RESERVOIR",
  currentDay: 25,
  isPlaying: false,
  speed: 1,

  setScenarioId: (scenarioId: string) => {
    const scn = DEMO_SCENARIOS.find((s) => s.id === scenarioId) || DEMO_SCENARIOS[0];
    if (playCleanup) {
      playCleanup();
      playCleanup = null;
    }
    demoDataProvider.setScenario(scenarioId);
    set({
      activeScenarioId: scenarioId,
      currentDay: scn.day,
      isPlaying: false,
    });
  },

  setDay: (day: number) => {
    const clamped = Math.max(0, Math.min(45, Math.round(day * 10) / 10));
    demoDataProvider.setDay(clamped);
    set({ currentDay: clamped });
  },

  togglePlay: () => {
    const { isPlaying, activeScenarioId, speed } = get();
    if (isPlaying) {
      if (playCleanup) {
        playCleanup();
        playCleanup = null;
      }
      set({ isPlaying: false });
    } else {
      playCleanup = demoDataProvider.playScenario(activeScenarioId, speed);
      set({ isPlaying: true });
    }
  },

  setSpeed: (speed: 1 | 2 | 5) => {
    const { isPlaying, activeScenarioId } = get();
    if (isPlaying) {
      if (playCleanup) playCleanup();
      playCleanup = demoDataProvider.playScenario(activeScenarioId, speed);
    }
    set({ speed });
  },
}));
