"use client";

import { create } from "zustand";
import type { HoverInfo } from "./ephemeris";

export type MobilePanel = "none" | "catalog" | "inspector";

type HeliosUiState = {
  fps: number;
  hover: HoverInfo | null;
  mobilePanel: MobilePanel;
  setFps: (fps: number) => void;
  setHover: (hover: HoverInfo | null) => void;
  setMobilePanel: (panel: MobilePanel) => void;
};

export const useHeliosUiStore = create<HeliosUiState>((set) => ({
  fps: 0,
  hover: null,
  mobilePanel: "none",
  setFps: (fps) => set({ fps }),
  setHover: (hover) => set({ hover }),
  setMobilePanel: (panel) => set({ mobilePanel: panel }),
}));
