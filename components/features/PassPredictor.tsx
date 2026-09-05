"use client";

import { useEffect, useState } from "react";
import { Panel, EmptyNote, TableHead } from "./Panel";
import { useFeatureUi } from "@/lib/feature-ui";
import { useHeliosStore } from "@/lib/store";
import { predictPassesMany } from "@/lib/passes";
import { formatDuration, formatUtc } from "@/lib/time";
import { nameByNorad } from "@/lib/client-catalog";
import type { Pass } from "@/lib/types";

export function PassPredictor() {
  const panel = useFeatureUi((s) => s.panel);
  const setPanel = useFeatureUi((s) => s.setPanel);
  const catalog = useHeliosStore((s) => s.catalog);
  const observer = useHeliosStore((s) => s.observer);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const watchlist = useHeliosStore((s) => s.watchlist);
  const setSelected = useHeliosStore((s) => s.setSelected);
  const setClock = useHeliosStore((s) => s.setClock);
  const [passes, setPasses] = useState<Pass[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (panel !== "passes") return;
    let cancelled = false;
    const ids = new Set<number>([25544, ...watchlist]);
    if (selectedNoradId) ids.add(selectedNoradId);
    const pool = catalog.filter((e) => ids.has(e.noradId));
    const fallbackPool = pool.length ? pool : catalog.slice(0, 20);

    (async () => {
      setError(null);
      let local: Pass[] = [];
      try {
        local = predictPassesMany(fallbackPool, observer, Date.now(), 72, 8, 24);
        if (!cancelled && local.length) setPasses(local);
        else if (!cancelled) setPasses(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "pass compute failed");
      }
      const params = new URLSearchParams({
        lat: String(observer.lat),
        lon: String(observer.lon),
        altM: String(observer.altM),
        hours: "72",
        n: "16",
      });
      if (selectedNoradId) params.set("norad", String(selectedNoradId));
      try {
        const res = await fetch(`/api/passes?${params}`);
        if (res.ok) {
          const data = (await res.json()) as { passes?: Pass[] };
          if (!cancelled && Array.isArray(data.passes) && data.passes.length) {
            setPasses(data.passes);
          }
        }
      } catch {
        if (!cancelled && !local.length) setPasses(local);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [panel, catalog, observer, selectedNoradId, watchlist]);

  if (panel !== "passes") return null;

  return (
    <Panel title="Pass predictor" onClose={() => setPanel(null)}>
      {error ? <EmptyNote>{error}</EmptyNote> : null}
      {passes == null && !error ? (
        <div className="space-y-2 p-3" aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-[rgba(34,211,238,0.08)]" />
          ))}
        </div>
      ) : null}
      {passes && passes.length === 0 ? (
        <EmptyNote>No pass in window — try another observer or widen hours.</EmptyNote>
      ) : null}
      {passes && passes.length > 0 ? (
        <table className="w-full text-xs">
          <TableHead cols={["Sat", "AOS", "LOS", "Max el"]} />
          <tbody>
            {passes.map((p) => (
              <tr
                key={`${p.noradId}-${p.aos}`}
                className="cursor-pointer border-t border-[var(--line)] hover:bg-[rgba(34,211,238,0.08)]"
                onClick={() => {
                  setSelected(p.noradId);
                  setClock({ epochMs: p.aos, playing: false });
                }}
              >
                <td className="px-2 py-2 font-mono text-[var(--cyan)]">
                  {nameByNorad(catalog, p.noradId)}
                </td>
                <td className="px-2 py-2 font-mono tabular-nums">
                  {formatUtc(p.aos)}
                  <span className="ml-1 text-[var(--muted)]">{formatDuration(p.aos - Date.now())}</span>
                </td>
                <td className="px-2 py-2 font-mono tabular-nums">{formatUtc(p.los)}</td>
                <td className="px-2 py-2 font-mono tabular-nums text-[var(--cyan)]">
                  {p.maxEl.toFixed(1)}°
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Panel>
  );
}
