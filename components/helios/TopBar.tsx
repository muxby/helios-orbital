"use client";

import { Activity, Radio } from "lucide-react";
import { useHeliosStore } from "@/lib/store";
import { useHeliosUiStore } from "./ui-store";
import { formatClock } from "./format";
import { cn } from "./cn";

export function TopBar() {
  const epochMs = useHeliosStore((s) => s.clock.epochMs);
  const rate = useHeliosStore((s) => s.clock.rate);
  const playing = useHeliosStore((s) => s.clock.playing);
  const catalog = useHeliosStore((s) => s.catalog);
  const catalogStatus = useHeliosStore((s) => s.catalogStatus);
  const catalogSource = useHeliosStore((s) => s.catalogSource);
  const maxRender = useHeliosStore((s) => s.maxRender);
  const fps = useHeliosUiStore((s) => s.fps);
  const highRate = rate >= 300;
  const satCount = Math.min(catalog.length, maxRender);
  const live = catalogSource === "live" && catalogStatus === "ready";
  const pip =
    catalogStatus === "error"
      ? "bg-[var(--crit)]"
      : live
        ? "bg-[var(--nominal)]"
        : "bg-[var(--amber)]";

  return (
    <header className="helios-panel pointer-events-auto flex h-12 shrink-0 items-center gap-3 border-x-0 border-t-0 px-3">
      <div className="flex items-baseline gap-2">
        <span className="font-sans text-[15px] font-semibold tracking-[0.42em] text-[var(--text)]">
          HELIOS
        </span>
        <span className="hidden font-mono text-[9px] tracking-[0.22em] text-[var(--muted)] sm:inline">
          ORBITAL INTELLIGENCE
        </span>
      </div>

      <div id="helios-palette-slot" className="min-w-0 flex-1" />

      <div className="ml-auto flex items-center gap-3 font-mono text-[11px] tabular-nums">
        <time dateTime={new Date(epochMs).toISOString()} className="text-[var(--cyan)]">
          {formatClock(epochMs)}
        </time>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 tracking-[0.14em]",
            highRate
              ? "border-[var(--amber)]/50 text-[var(--amber)]"
              : "border-[var(--line)] text-[var(--muted)]",
          )}
        >
          {rate}× {playing ? "RUN" : "HOLD"}
        </span>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 tracking-[0.14em]",
            live ? "border-[var(--nominal)]/40 text-[var(--nominal)]" : "border-[var(--amber)]/40 text-[var(--amber)]",
          )}
        >
          {catalogSource === "live" ? "LIVE" : "SAMPLE"}
        </span>
        <span className="hidden items-center gap-1 text-[var(--muted)] md:inline-flex">
          <Activity className="h-3 w-3" aria-hidden />
          {fps} FPS
        </span>
        <span className="inline-flex items-center gap-1 text-[var(--muted)]">
          <Radio className="h-3 w-3" aria-hidden />
          {satCount}
        </span>
        <span
          className={cn("inline-block h-2 w-2 rounded-full", pip)}
          aria-label={live ? "Live catalog" : catalogStatus === "error" ? "Catalog error" : "Sample catalog"}
        />
      </div>
    </header>
  );
}
