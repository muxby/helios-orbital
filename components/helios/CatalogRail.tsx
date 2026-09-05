"use client";

import { useMemo, useRef, useState } from "react";
import { useHeliosStore } from "@/lib/store";
import { ORBIT_CHIPS, ROW_HEIGHT } from "./constants";
import { SearchInput } from "./SearchInput";
import { GroupTabs } from "./GroupTabs";
import { SatRow } from "./SatRow";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { cn } from "./cn";
import { OBJECT_TYPE_HEX, OBJECT_TYPE_LEGEND } from "@/lib/object-style";
import type { OrbitClass } from "@/lib/types";

type CatalogRailProps = {
  onRetry: () => void;
  className?: string;
};

export function CatalogRail({ onRetry, className }: CatalogRailProps) {
  const catalog = useHeliosStore((s) => s.catalog);
  const status = useHeliosStore((s) => s.catalogStatus);
  const error = useHeliosStore((s) => s.catalogError);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const watchlist = useHeliosStore((s) => s.watchlist);
  const searchQuery = useHeliosStore((s) => s.searchQuery);
  const orbitClassFilter = useHeliosStore((s) => s.orbitClassFilter);
  const activeGroup = useHeliosStore((s) => s.activeGroup);
  const setSearch = useHeliosStore((s) => s.setSearch);
  const setFilter = useHeliosStore((s) => s.setFilter);
  const setActiveGroup = useHeliosStore((s) => s.setActiveGroup);
  const setSelected = useHeliosStore((s) => s.setSelected);
  const toggleWatch = useHeliosStore((s) => s.toggleWatch);
  const focusCamera = useHeliosStore((s) => s.focusCamera);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((sat) => {
      if (orbitClassFilter !== "all" && sat.orbitClass !== orbitClassFilter) return false;
      if (!q) return true;
      return (
        sat.name.toLowerCase().includes(q) ||
        String(sat.noradId).includes(q) ||
        (sat.intlDes ?? "").toLowerCase().includes(q)
      );
    });
  }, [catalog, orbitClassFilter, searchQuery]);

  const sorted = useMemo(() => {
    const watched = new Set(watchlist);
    return [...filtered].sort((a, b) => {
      const aw = watched.has(a.noradId) ? 0 : 1;
      const bw = watched.has(b.noradId) ? 0 : 1;
      if (aw !== bw) return aw - bw;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, watchlist]);

  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const windowed = sorted.length > 200;
  const viewport = 520;
  const start = windowed
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 8)
    : 0;
  const end = windowed
    ? Math.min(sorted.length, start + Math.ceil(viewport / ROW_HEIGHT) + 16)
    : sorted.length;
  const slice = sorted.slice(start, end);

  return (
    <aside
      className={cn(
        "helios-panel flex h-full w-[320px] shrink-0 flex-col overflow-hidden",
        className,
      )}
    >
      <div className="space-y-2 border-b border-[var(--line)] p-2">
        <SearchInput value={searchQuery} onChange={setSearch} />
        <GroupTabs active={activeGroup} onChange={setActiveGroup} />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Orbit class">
          {ORBIT_CHIPS.map((chip) => {
            const on = orbitClassFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={cn(
                  "rounded-sm border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.16em] transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
                  on
                    ? "border-[var(--cyan)] text-[var(--cyan)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        {error ? <ErrorBanner message={error} onRetry={onRetry} /> : null}
        <div className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)]">
          {sorted.length} OBJECTS
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1" aria-label="Object type legend">
          {OBJECT_TYPE_LEGEND.map((row) => (
            <span key={row.id} className="inline-flex items-center gap-1 font-mono text-[8px] tracking-[0.12em] text-[var(--muted)]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: OBJECT_TYPE_HEX[row.id] }}
              />
              {row.label}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={scroller}
        className="helios-scroll min-h-0 flex-1 overflow-y-auto"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        role="listbox"
        aria-label="Satellite catalog"
      >
        {status === "loading" || status === "idle" ? (
          <EmptyState loading />
        ) : sorted.length === 0 ? (
          <EmptyState message={searchQuery ? "NO MATCH" : "CATALOG EMPTY"} />
        ) : windowed ? (
          <div style={{ height: sorted.length * ROW_HEIGHT, position: "relative" }}>
            {slice.map((sat, i) => (
              <div
                key={sat.noradId}
                style={{
                  position: "absolute",
                  top: (start + i) * ROW_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ROW_HEIGHT,
                }}
              >
                <SatRow
                  sat={sat}
                  selected={sat.noradId === selectedNoradId}
                  watched={watchlist.includes(sat.noradId)}
                  onSelect={setSelected}
                  onWatch={toggleWatch}
                  onFocus={focusCamera}
                />
              </div>
            ))}
          </div>
        ) : (
          slice.map((sat) => (
            <SatRow
              key={sat.noradId}
              sat={sat}
              selected={sat.noradId === selectedNoradId}
              watched={watchlist.includes(sat.noradId)}
              onSelect={setSelected}
              onWatch={toggleWatch}
              onFocus={focusCamera}
            />
          ))
        )}
      </div>
      <OrbitClassHistogram entries={sorted} />
    </aside>
  );
}

function OrbitClassHistogram({
  entries,
}: {
  entries: { orbitClass: OrbitClass }[];
}) {
  const counts: Record<Exclude<OrbitClass, "unknown"> | "unknown", number> = {
    LEO: 0,
    MEO: 0,
    GEO: 0,
    HEO: 0,
    unknown: 0,
  };
  for (const e of entries) counts[e.orbitClass] += 1;
  const keys = ["LEO", "MEO", "GEO", "HEO"] as const;
  const max = Math.max(1, ...keys.map((k) => counts[k]));
  return (
    <div className="border-t border-[var(--line)] px-2 py-2">
      <p className="mb-1 font-mono text-[8px] tracking-[0.16em] text-[var(--muted)]">
        ORBIT CLASS
      </p>
      <div className="space-y-0.5">
        {keys.map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-7 font-mono text-[8px] text-[var(--muted)]">{k}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-black/40">
              <div
                className="h-full bg-[var(--cyan)]"
                style={{ width: `${(counts[k] / max) * 100}%`, opacity: counts[k] ? 0.85 : 0.15 }}
              />
            </div>
            <span className="w-6 text-right font-mono text-[8px] tabular-nums text-[var(--cyan)]">
              {counts[k]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
