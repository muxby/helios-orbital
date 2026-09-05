"use client";

import { Pin } from "lucide-react";
import type { CatalogEntry } from "@/lib/types";
import { cn } from "./cn";

type SatRowProps = {
  sat: CatalogEntry;
  selected: boolean;
  watched: boolean;
  onSelect: (noradId: number) => void;
  onWatch: (noradId: number) => void;
  onFocus?: (noradId: number) => void;
};

export function SatRow({
  sat,
  selected,
  watched,
  onSelect,
  onWatch,
  onFocus,
}: SatRowProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(sat.noradId)}
      onDoubleClick={() => onFocus?.(sat.noradId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(sat.noradId);
        }
      }}
      tabIndex={0}
      className={cn(
        "flex h-[38px] cursor-pointer items-center gap-2 border-b border-[var(--line)] px-2 font-mono text-[11px] transition-colors duration-100",
        "focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
        selected
          ? "bg-[var(--cyan-dim)] text-[var(--cyan)]"
          : "hover:bg-white/5",
      )}
    >
      <button
        type="button"
        aria-label={watched ? `Unpin ${sat.name}` : `Pin ${sat.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onWatch(sat.noradId);
        }}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-sm text-[var(--muted)] hover:text-[var(--cyan)] focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
          watched && "text-[var(--amber)]",
        )}
      >
        <Pin className="h-3 w-3" fill={watched ? "currentColor" : "none"} />
      </button>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          background:
            sat.objectType === "payload"
              ? "#22d3ee"
              : sat.objectType === "rocket_body"
                ? "#f5a524"
                : sat.objectType === "debris"
                  ? "#f43f5e"
                  : "#9aabc4",
        }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="truncate tracking-wide">{sat.name}</div>
        <div className="text-[10px] text-[var(--muted)]">{sat.noradId}</div>
      </div>
      <span
        className={cn(
          "rounded-sm border border-[var(--line)] px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-[var(--muted)]",
          sat.orbitClass === "LEO" && "text-[var(--cyan)]",
          sat.orbitClass === "GEO" && "text-[var(--amber)]",
          sat.orbitClass === "MEO" && "text-[var(--nominal)]",
        )}
      >
        {sat.orbitClass}
      </span>
    </div>
  );
}
