"use client";

import { create } from "zustand";
import { CameraBookmark, Overlay3DMode } from "../data/types";

interface SceneState {
  overlayMode: Overlay3DMode;
  cameraBookmark: CameraBookmark;
  isCrossSection: boolean;
  selectedNode: string | null;
  setOverlayMode: (mode: Overlay3DMode) => void;
  setCameraBookmark: (bookmark: CameraBookmark) => void;
  toggleCrossSection: () => void;
  setCrossSection: (active: boolean) => void;
  setSelectedNode: (node: string | null) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  overlayMode: "structure",
  cameraBookmark: "full",
  isCrossSection: false,
  selectedNode: null,
  setOverlayMode: (overlayMode) => set({ overlayMode }),
  setCameraBookmark: (cameraBookmark) => set({ cameraBookmark }),
  toggleCrossSection: () => set((s) => ({ isCrossSection: !s.isCrossSection })),
  setCrossSection: (isCrossSection) => set({ isCrossSection }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
}));
