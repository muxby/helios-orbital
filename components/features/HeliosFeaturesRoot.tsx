"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertToasts } from "./AlertToasts";
import { CommandPalette } from "./CommandPalette";
import { CompareMode } from "./CompareMode";
import { ConjunctionBoard } from "./ConjunctionBoard";
import { FeaturesDock } from "./FeaturesDock";
import { HydrateHelios } from "./HydrateHelios";
import { KeyboardCheatsheet } from "./KeyboardCheatsheet";
import { MapStrip } from "./MapStrip";
import { MethodologyDrawer } from "./MethodologyDrawer";
import { PassPredictor } from "./PassPredictor";
import { SettingsDrawer } from "./SettingsDrawer";
import { useFeatureUi } from "@/lib/feature-ui";
import { useHeliosStore } from "@/lib/store";
import { isEditableTarget } from "@/lib/keys";

export function HeliosFeaturesRoot() {
  const setPaletteOpen = useFeatureUi((s) => s.setPaletteOpen);
  const setPanel = useFeatureUi((s) => s.setPanel);
  const panel = useFeatureUi((s) => s.panel);
  const showMap2d = useHeliosStore((s) => s.showMap2d);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = isEditableTarget(target);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!useFeatureUi.getState().paletteOpen);
        return;
      }
      if (e.key === "?" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const ui = useFeatureUi.getState();
        ui.setPanel(ui.panel === "cheatsheet" ? null : "cheatsheet");
        return;
      }
      if (e.key === "Escape") {
        const ui = useFeatureUi.getState();
        if (ui.paletteOpen) {
          e.preventDefault();
          e.stopPropagation();
          setPaletteOpen(false);
          return;
        }
        if (ui.panel) {
          e.preventDefault();
          e.stopPropagation();
          setPanel(null);
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [setPaletteOpen, setPanel]);

  return (
    <div id="helios-features-root" className="pointer-events-none fixed inset-0 z-40">
      <HydrateHelios />
      <FeaturesDock />
      {showMap2d ? (
        <div className="absolute bottom-[88px] left-0 right-0 z-20 lg:left-[320px] lg:right-[340px]">
          <MapStrip />
        </div>
      ) : null}
      <div className="pointer-events-none absolute top-14 right-2 z-50 flex max-h-[calc(100dvh-140px)] lg:right-[348px]">
        <AnimatePresence>
          {panel === "passes" ? <PassPredictor key="passes" /> : null}
          {panel === "conjunctions" ? <ConjunctionBoard key="conjunctions" /> : null}
          {panel === "compare" ? <CompareMode key="compare" /> : null}
          {panel === "settings" ? <SettingsDrawer key="settings" /> : null}
          {panel === "method" ? <MethodologyDrawer key="method" /> : null}
        </AnimatePresence>
      </div>
      <CommandPalette />
      <KeyboardCheatsheet />
      <AlertToasts />
    </div>
  );
}
