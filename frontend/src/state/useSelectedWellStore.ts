"use client";

import { create } from "zustand";

interface SelectedWellState {
  selectedWellId: string;
  setSelectedWellId: (wellId: string) => void;
}

export const useSelectedWellStore = create<SelectedWellState>((set) => ({
  selectedWellId: "BGW-08",
  setSelectedWellId: (wellId: string) => set({ selectedWellId: wellId }),
}));
