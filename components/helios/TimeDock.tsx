"use client";

import { Pause, Play } from "lucide-react";
import { useHeliosStore } from "@/lib/store";
import { SIM_RATES } from "./constants";
import { ObserverForm } from "./ObserverForm";
import { IconButton } from "./IconButton";
import { cn } from "./cn";

export function TimeDock() {
  const epochMs = useHeliosStore((s) => s.clock.epochMs);
  const playing = useHeliosStore((s) => s.clock.playing);
  const rate = useHeliosStore((s) => s.clock.rate);
  const observer = useHeliosStore((s) => s.observer);
  const togglePlaying = useHeliosStore((s) => s.togglePlaying);
  const setRate = useHeliosStore((s) => s.setRate);
  const setClock = useHeliosStore((s) => s.setClock);
  const setObserver = useHeliosStore((s) => s.setObserver);

  const now = Date.now();
  const min = now - 6 * 3_600_000;
  const max = now + 36 * 3_600_000;
  const highRate = rate >= 300;

  return (
    <footer className="helios-panel pointer-events-auto flex h-[88px] shrink-0 items-center gap-3 border-x-0 border-b-0 px-3">
      <IconButton label={playing ? "Pause simulation" : "Play simulation"} onClick={togglePlaying} active={playing}>
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </IconButton>
      <div className="flex items-center gap-1" role="group" aria-label="Simulation rate">
        {SIM_RATES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={rate === r}
            onClick={() => setRate(r)}
            className={cn(
              "h-7 min-w-10 rounded-sm border px-1.5 font-mono text-[10px] tracking-[0.12em] transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
              rate === r
                ? r >= 300
                  ? "border-[var(--amber)] text-[var(--amber)]"
                  : "border-[var(--cyan)] text-[var(--cyan)]"
                : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]",
            )}
          >
            {r}×
          </button>
        ))}
      </div>
      <label className="flex min-w-0 flex-1 items-center gap-2">
        <span className="sr-only">Epoch scrubber</span>
        <input
          type="range"
          min={min}
          max={max}
          value={Math.min(max, Math.max(min, epochMs))}
          onChange={(e) => setClock({ epochMs: Number(e.target.value) })}
          className="helios-scrub w-full"
          aria-label="Simulation epoch"
        />
      </label>
      <button
        type="button"
        onClick={() => setClock({ epochMs: Date.now() })}
        className={cn(
          "h-7 rounded-sm border border-[var(--line)] px-2 font-mono text-[10px] tracking-[0.16em] text-[var(--muted)]",
          "hover:text-[var(--cyan)] focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
        )}
      >
        NOW
      </button>
      <div className="hidden lg:block">
        <ObserverForm observer={observer} onChange={setObserver} />
      </div>
      <span className={cn("hidden font-mono text-[10px] tracking-[0.14em] xl:inline", highRate ? "text-[var(--amber)]" : "text-[var(--muted)]")}>
        {highRate ? "HIGH RATE" : "NOM"}
      </span>
    </footer>
  );
}
