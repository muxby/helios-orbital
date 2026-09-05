"use client";

import { useEffect, useRef } from "react";
import { CONSTELLATION_PRESETS } from "@/lib/presets";
import { useHeliosStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export function ConstellationPresets() {
  const activeGroup = useHeliosStore((s) => s.activeGroup);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const cameraPreset = useHeliosStore((s) => s.cameraPreset);
  const catalog = useHeliosStore((s) => s.catalog);
  const setActiveGroup = useHeliosStore((s) => s.setActiveGroup);
  const setFilter = useHeliosStore((s) => s.setFilter);
  const setSelected = useHeliosStore((s) => s.setSelected);
  const setCameraPreset = useHeliosStore((s) => s.setCameraPreset);
  const focusCamera = useHeliosStore((s) => s.focusCamera);
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (!cameraPreset || cameraPreset === "iss") return;
    if (applied.current === `${cameraPreset}:${catalog.length}`) return;
    const want =
      cameraPreset === "starlink" ? "LEO" : cameraPreset === "gps" ? "MEO" : "GEO";
    const hit = catalog.find((e) => e.orbitClass === want);
    if (hit) {
      focusCamera(hit.noradId);
      applied.current = `${cameraPreset}:${catalog.length}`;
    }
  }, [cameraPreset, catalog, focusCamera]);

  return (
    <div className="pointer-events-auto flex h-7 min-h-7 items-center gap-1">
      {CONSTELLATION_PRESETS.map((p) => {
        const on =
          activeGroup === p.group && (p.norad == null || selectedNoradId === p.norad);
        return (
          <button
            key={p.id}
            type="button"
            title={p.hint}
            onClick={() => {
              applied.current = null;
              setActiveGroup(p.group);
              setFilter(p.filter);
              if (p.norad) setSelected(p.norad);
              setCameraPreset(p.camera);
            }}
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              on
                ? "border-[var(--cyan)] text-[var(--cyan)]"
                : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]",
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
