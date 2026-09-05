"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft, Radar } from "lucide-react";
import { useHeliosStore } from "@/lib/store";
import { fetchCatalogClient } from "@/lib/client-catalog";
import { catalogFromGp, type CelestrakGpRow } from "@/lib/catalog";
import { HeliosClockProvider } from "./HeliosClockProvider";
import { TopBar } from "./TopBar";
import { CatalogRail } from "./CatalogRail";
import { TimeDock } from "./TimeDock";
import { StatusBar } from "./StatusBar";
import { ObserverForm } from "./ObserverForm";
import { IconButton } from "./IconButton";
import { useHeliosUiStore } from "./ui-store";
import { SEARCH_INPUT_ID, SIM_RATES } from "./constants";
import { formatFixed } from "./format";
import { useFeatureUi } from "@/lib/feature-ui";
import { isEditableTarget, isSpaceReserved } from "@/lib/keys";
import { toggleHeliosFullscreen } from "@/lib/capture";
import { SelectionHud } from "./SelectionHud";

const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-[11px] tracking-[0.22em] text-[var(--muted)]">
      INITIALIZING VIEWPORT
    </div>
  ),
});

const Inspector = dynamic(() => import("./Inspector").then((m) => m.Inspector), {
  ssr: false,
  loading: () => (
    <aside className="helios-panel h-full w-[340px] shrink-0 p-4 font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">
      INSPECTOR
    </aside>
  ),
});

const HeliosFeaturesRoot = dynamic(
  () => import("@/components/features/HeliosFeaturesRoot").then((m) => m.HeliosFeaturesRoot),
  { ssr: false },
);

function useCatalogFeed(retryToken: number) {
  const activeGroup = useHeliosStore((s) => s.activeGroup);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const store = useHeliosStore.getState();
      store.setCatalogStatus("loading", null);
      try {
        const data = await fetchCatalogClient(activeGroup);
        if (cancelled) return;
        if (data.entries.length > 0) {
          store.setCatalog(data.entries, data.source);
          store.setCatalogUpdatedAt(data.updatedAt);
          if (data.source === "sample") {
            store.setCatalogStatus("ready", "Celestrak unreachable — sample catalog");
          }
          return;
        }
        const sampleRes = await fetch("/data/sample-catalog.json");
        const rows = (await sampleRes.json()) as CelestrakGpRow[];
        const entries = catalogFromGp(rows, activeGroup);
        store.setCatalog(entries, "sample");
        store.setCatalogUpdatedAt(new Date().toISOString());
        store.setCatalogStatus("ready", "Celestrak unreachable — sample catalog");
      } catch {
        if (cancelled) return;
        store.setCatalogStatus("error", "Celestrak unreachable — sample catalog");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeGroup, retryToken]);
}

function useHeliosHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = isEditableTarget(el);
      const store = useHeliosStore.getState();
      if (e.code === "Space" && !isSpaceReserved(el)) {
        e.preventDefault();
        store.togglePlaying();
      }
      if (typing) return;
      if (e.key === "[") {
        const i = SIM_RATES.indexOf(store.clock.rate as (typeof SIM_RATES)[number]);
        store.setRate(SIM_RATES[Math.max(0, (i === -1 ? 0 : i) - 1)]);
      }
      if (e.key === "]") {
        const i = SIM_RATES.indexOf(store.clock.rate as (typeof SIM_RATES)[number]);
        store.setRate(SIM_RATES[Math.min(SIM_RATES.length - 1, (i === -1 ? 0 : i) + 1)]);
      }
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById(SEARCH_INPUT_ID)?.focus();
      }
      if (e.key === "Escape") {
        if (useFeatureUi.getState().paletteOpen || useFeatureUi.getState().panel) return;
        store.setSelected(null);
        useHeliosUiStore.getState().setMobilePanel("none");
      }
      const k = e.key.toLowerCase();
      if (k === "h") {
        e.preventDefault();
        store.resetCamera();
      }
      if (k === "f") {
        e.preventDefault();
        toggleHeliosFullscreen();
      }
      if (k === "p") {
        e.preventDefault();
        useFeatureUi.getState().togglePanel("passes");
      }
      if (k === "c") {
        e.preventDefault();
        useFeatureUi.getState().togglePanel("conjunctions");
      }
      if (k === "m") {
        e.preventDefault();
        store.setShowMap2d(!store.showMap2d);
      }
      if (k === "g") {
        e.preventDefault();
        store.setActiveGroup("stations");
        store.setCameraPreset("iss");
        store.setSelected(25544);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function HoverTooltip() {
  const hover = useHeliosUiStore((s) => s.hover);
  if (!hover) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-sm border border-[var(--line)] bg-[#070b14]/90 px-2 py-1 font-mono text-[11px] text-[var(--text)] backdrop-blur-sm"
      style={{ left: hover.x + 12, top: hover.y + 12 }}
    >
      <div className="text-[var(--cyan)]">{hover.name}</div>
      <div className="tabular-nums text-[var(--muted)]">{formatFixed(hover.altKm, 1, " km")}</div>
    </div>
  );
}

function Shell({ onRetry }: { onRetry: () => void }) {
  const mobilePanel = useHeliosUiStore((s) => s.mobilePanel);
  const setMobilePanel = useHeliosUiStore((s) => s.setMobilePanel);
  const observer = useHeliosStore((s) => s.observer);
  const setObserver = useHeliosStore((s) => s.setObserver);

  return (
    <div id="helios-root" className="relative h-dvh w-screen overflow-hidden bg-[#070b14] text-[var(--text)]">
      <div className="absolute inset-0 z-0">
        <GlobeCanvas />
      </div>
      <div className="helios-vignette absolute inset-0 z-[1]" />
      <div className="helios-scan absolute inset-0 z-[1] opacity-40" />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <div className="pointer-events-auto hidden h-full lg:flex">
            <CatalogRail onRetry={onRetry} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-auto absolute top-2 left-2 flex gap-2 lg:hidden">
              <IconButton
                label="Open catalog"
                active={mobilePanel === "catalog"}
                onClick={() => setMobilePanel(mobilePanel === "catalog" ? "none" : "catalog")}
              >
                <PanelLeft className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                label="Open inspector"
                active={mobilePanel === "inspector"}
                onClick={() => setMobilePanel(mobilePanel === "inspector" ? "none" : "inspector")}
              >
                <Radar className="h-3.5 w-3.5" />
              </IconButton>
            </div>
            <SelectionHud />
          </div>
          <div className="pointer-events-auto hidden h-full lg:flex">
            <Inspector />
          </div>
        </div>
        <StatusBar />
        <div className="pointer-events-auto lg:hidden">
          <div className="helios-panel border-x-0 px-3 py-1.5">
            <ObserverForm observer={observer} onChange={setObserver} />
          </div>
        </div>
        <TimeDock />
      </div>

      <AnimatePresence>
        {mobilePanel === "catalog" ? (
          <motion.div
            key="catalog-drawer"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-auto absolute top-12 bottom-[88px] left-0 z-30 lg:hidden"
          >
            <CatalogRail onRetry={onRetry} />
          </motion.div>
        ) : null}
        {mobilePanel === "inspector" ? (
          <motion.div
            key="inspector-drawer"
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-auto absolute top-12 right-0 bottom-[88px] z-30 lg:hidden"
          >
            <Inspector />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <HoverTooltip />
      <HeliosFeaturesRoot />
    </div>
  );
}

export function HeliosApp() {
  const [retryToken, setRetryToken] = useState(0);
  useCatalogFeed(retryToken);
  useHeliosHotkeys();

  useEffect(() => {
    useHeliosStore.getState().hydrateFromUrl();
  }, []);

  const onRetry = useCallback(() => setRetryToken((n) => n + 1), []);

  return (
    <HeliosClockProvider>
      <Shell onRetry={onRetry} />
    </HeliosClockProvider>
  );
}
