"use client";

import { create } from "zustand";

export type DataMode = "demo" | "live";

interface DataModeState {
  mode: DataMode;
  isFallbackActive: boolean;
  _hydrated: boolean;
  setMode: (mode: DataMode) => void;
  toggleMode: () => void;
  setFallbackActive: (active: boolean) => void;
  /** Called once on mount to restore saved preference — never call on the server. */
  initFromStorage: () => void;
}

export const useDataModeStore = create<DataModeState>((set, get) => ({
  // Always start as "demo" — this keeps SSR and client first-render in sync
  // and prevents the Next.js hydration mismatch that causes "Application error".
  mode: "demo",
  isFallbackActive: false,
  _hydrated: false,

  initFromStorage: () => {
    if (get()._hydrated) return; // run once only
    const saved = localStorage.getItem("tempo_twin_data_mode");
    const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_DATA_MODE as DataMode) || "demo";
    const resolved: DataMode =
      saved === "demo" || saved === "live" ? saved : envDefault;
    set({ mode: resolved, _hydrated: true });
  },

  setMode: (mode: DataMode) => {
    localStorage.setItem("tempo_twin_data_mode", mode);
    set({ mode, isFallbackActive: false });
  },

  toggleMode: () => {
    set((state) => {
      const next: DataMode = state.mode === "demo" ? "live" : "demo";
      localStorage.setItem("tempo_twin_data_mode", next);
      return { mode: next, isFallbackActive: false };
    });
  },

  setFallbackActive: (active: boolean) => set({ isFallbackActive: active }),
}));
