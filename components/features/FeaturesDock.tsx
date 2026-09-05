"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Camera,
  GitCompare,
  Home,
  Keyboard,
  Link2,
  Map,
  Maximize2,
  Radio,
  Search,
  Settings,
  Siren,
} from "lucide-react";
import { ConstellationPresets } from "./ConstellationPresets";
import { useFeatureUi } from "@/lib/feature-ui";
import { useHeliosStore } from "@/lib/store";
import { downloadText, ephemerisCsv } from "@/lib/export-ephemeris";
import { findEntry } from "@/lib/propagate";
import { captureHeliosPng, toggleHeliosFullscreen } from "@/lib/capture";
import { copyText, heliosShareUrl } from "@/lib/share";
import { cn } from "@/lib/cn";

function IconBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded border",
        active
          ? "border-[var(--cyan)] text-[var(--cyan)]"
          : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]",
      )}
    >
      {children}
    </button>
  );
}

export function FeaturesDock() {
  const toggle = useFeatureUi((s) => s.togglePanel);
  const setPaletteOpen = useFeatureUi((s) => s.setPaletteOpen);
  const panel = useFeatureUi((s) => s.panel);
  const showMap2d = useHeliosStore((s) => s.showMap2d);
  const setShowMap2d = useHeliosStore((s) => s.setShowMap2d);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const find = () => document.getElementById("helios-palette-slot");
    setSlot(find());
    if (find()) return;
    const id = requestAnimationFrame(() => setSlot(find()));
    return () => cancelAnimationFrame(id);
  }, []);

  const bar = (
    <div className="pointer-events-auto flex min-h-8 items-center gap-1 overflow-x-auto">
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex h-7 items-center gap-1.5 rounded border border-[var(--line)] px-2 font-mono text-[10px] text-[var(--muted)] hover:text-[var(--cyan)]"
        aria-label="Open command palette"
      >
        <Search size={12} />
        <span>⌘K</span>
      </button>
      <ConstellationPresets />
      <IconBtn label="Home camera" onClick={() => useHeliosStore.getState().resetCamera()}>
        <Home size={13} />
      </IconBtn>
      <IconBtn label="2D map" active={showMap2d} onClick={() => setShowMap2d(!showMap2d)}>
        <Map size={13} />
      </IconBtn>
      <IconBtn label="Pass predictor" active={panel === "passes"} onClick={() => toggle("passes")}>
        <Radio size={13} />
      </IconBtn>
      <IconBtn
        label="Conjunctions"
        active={panel === "conjunctions"}
        onClick={() => toggle("conjunctions")}
      >
        <Siren size={13} />
      </IconBtn>
      <IconBtn label="Compare" active={panel === "compare"} onClick={() => toggle("compare")}>
        <GitCompare size={13} />
      </IconBtn>
      <IconBtn
        label="Share link"
        onClick={() => {
          const s = useHeliosStore.getState();
          void copyText(
            heliosShareUrl({
              noradId: s.selectedNoradId,
              observer: s.observer,
              epochMs: s.clock.epochMs,
            }),
          );
        }}
      >
        <Link2 size={13} />
      </IconBtn>
      <IconBtn
        label="Screenshot"
        onClick={() => captureHeliosPng(useHeliosStore.getState().selectedNoradId)}
      >
        <Camera size={13} />
      </IconBtn>
      <IconBtn label="Fullscreen" onClick={() => toggleHeliosFullscreen()}>
        <Maximize2 size={13} />
      </IconBtn>
      <IconBtn
        label="Export CSV"
        onClick={() => {
          const s = useHeliosStore.getState();
          const entry = findEntry(s.catalog, s.selectedNoradId);
          if (!entry) return;
          downloadText(
            `helios-${entry.noradId}-90min.csv`,
            ephemerisCsv(entry, s.clock.epochMs, 90, 30),
          );
        }}
      >
        <span className="font-mono text-[8px]">CSV</span>
      </IconBtn>
      <IconBtn label="Settings" active={panel === "settings"} onClick={() => toggle("settings")}>
        <Settings size={13} />
      </IconBtn>
      <IconBtn label="Methodology" active={panel === "method"} onClick={() => toggle("method")}>
        <BookOpen size={13} />
      </IconBtn>
      <IconBtn label="Keyboard" active={panel === "cheatsheet"} onClick={() => toggle("cheatsheet")}>
        <Keyboard size={13} />
      </IconBtn>
    </div>
  );

  if (slot) return createPortal(bar, slot);
  return <div className="absolute left-1/2 top-12 z-50 -translate-x-1/2">{bar}</div>;
}
