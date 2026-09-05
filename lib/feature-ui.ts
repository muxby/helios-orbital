import { create } from "zustand";

export type FeaturePanel =
  | "passes"
  | "conjunctions"
  | "compare"
  | "settings"
  | "method"
  | "cheatsheet"
  | null;

interface FeatureUi {
  panel: FeaturePanel;
  paletteOpen: boolean;
  setPanel: (panel: FeaturePanel) => void;
  togglePanel: (panel: Exclude<FeaturePanel, null>) => void;
  setPaletteOpen: (open: boolean) => void;
}

export const useFeatureUi = create<FeatureUi>((set, get) => ({
  panel: null,
  paletteOpen: false,
  setPanel: (panel) => set({ panel }),
  togglePanel: (panel) => set({ panel: get().panel === panel ? null : panel }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
