"use client";

import { create } from "zustand";

export type DataMode = "demo" | "live";

interface DataModeState {
  mode: DataMode;
  isFallbackActive: boolean;
  setMode: (mode: DataMode) => void;
  toggleMode: () => void;
  setFallbackActive: (active: boolean) => void;
}

const getInitialMode = (): DataMode => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("tempo_twin_data_mode");
    if (saved === "demo" || saved === "live") return saved;
  }
  return (process.env.NEXT_PUBLIC_DEFAULT_DATA_MODE as DataMode) || "demo";
};

export const useDataModeStore = create<DataModeState>((set) => ({
  mode: "demo",
  isFallbackActive: false,
  setMode: (mode: DataMode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tempo_twin_data_mode", mode);
    }
    set({ mode, isFallbackActive: false });
  },
  toggleMode: () => {
    set((state) => {
      const next = state.mode === "demo" ? "live" : "demo";
      if (typeof window !== "undefined") {
        localStorage.setItem("tempo_twin_data_mode", next);
      }
      return { mode: next, isFallbackActive: false };
    });
  },
  setFallbackActive: (active: boolean) => set({ isFallbackActive: active }),
}));
