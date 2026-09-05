"use client";

import { useHeliosStore } from "@/lib/store";
import { formatUtc } from "./format";

export function StatusBar() {
  const epochMs = useHeliosStore((s) => s.clock.epochMs);
  const catalog = useHeliosStore((s) => s.catalog);
  const maxRender = useHeliosStore((s) => s.maxRender);
  const observer = useHeliosStore((s) => s.observer);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const catalogUpdatedAt = useHeliosStore((s) => s.catalogUpdatedAt);
  const selected = catalog.find((s) => s.noradId === selectedNoradId);

  return (
    <div className="pointer-events-none flex items-center justify-between px-3 py-1 font-mono text-[9px] tracking-[0.16em] text-[var(--muted)]">
      <span>EPOCH {formatUtc(epochMs)}</span>
      <span>
        RENDER {Math.min(catalog.length, maxRender)}/{catalog.length}
        {catalogUpdatedAt ? ` · UPD ${catalogUpdatedAt.slice(11, 19)}` : ""}
      </span>
      <span>
        OBS {observer.lat.toFixed(2)} {observer.lon.toFixed(2)}
        {selected ? ` · ${selected.name}` : ""}
      </span>
    </div>
  );
}
