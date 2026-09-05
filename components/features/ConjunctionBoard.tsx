"use client";

import { useEffect, useState } from "react";
import { Panel, EmptyNote, TableHead } from "./Panel";
import { useFeatureUi } from "@/lib/feature-ui";
import { useHeliosStore } from "@/lib/store";
import { scanConjunctions } from "@/lib/conjunction";
import { missLevel, missToneClass } from "@/lib/compare";
import { formatUtc } from "@/lib/time";
import { nameByNorad } from "@/lib/client-catalog";
import type { Conjunction } from "@/lib/types";

export function ConjunctionBoard() {
  const panel = useFeatureUi((s) => s.panel);
  const setPanel = useFeatureUi((s) => s.setPanel);
  const catalog = useHeliosStore((s) => s.catalog);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const activeGroup = useHeliosStore((s) => s.activeGroup);
  const setSelected = useHeliosStore((s) => s.setSelected);
  const setCompare = useHeliosStore((s) => s.setCompare);
  const setClock = useHeliosStore((s) => s.setClock);
  const [rows, setRows] = useState<Conjunction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (panel !== "conjunctions") return;
    if (selectedNoradId == null) {
      setRows([]);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setRows(null);
      setError(null);
      try {
        const res = await fetch(
          `/api/conjunctions?norad=${selectedNoradId}&group=${encodeURIComponent(activeGroup)}&hours=4&step=60`,
        );
        if (res.ok) {
          const data = (await res.json()) as { conjunctions?: Conjunction[] };
          if (!cancelled && Array.isArray(data.conjunctions)) {
            setRows(data.conjunctions);
            return;
          }
        }
      } catch {
        /* fallback */
      }
      if (cancelled) return;
      try {
        setRows(scanConjunctions(catalog, Date.now(), 4, 60, 28, selectedNoradId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "conjunction scan failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [panel, selectedNoradId, catalog, activeGroup]);

  if (panel !== "conjunctions") return null;

  return (
    <Panel title="Conjunction board" onClose={() => setPanel(null)}>
      {selectedNoradId == null ? (
        <EmptyNote>Select a satellite. Closest approaches in TEME, 4h window, no covariance.</EmptyNote>
      ) : null}
      {error ? <EmptyNote>{error}</EmptyNote> : null}
      {rows == null && selectedNoradId != null && !error ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-[rgba(34,211,238,0.08)]" />
          ))}
        </div>
      ) : null}
      {rows && rows.length === 0 && selectedNoradId != null ? (
        <EmptyNote>No pairs in the compute cap. Try a denser group (Starlink / stations).</EmptyNote>
      ) : null}
      {rows && rows.length > 0 ? (
        <table className="w-full text-xs">
          <TableHead cols={["Other", "TCA", "Miss km", "Rel km/s"]} />
          <tbody>
            {rows.map((c) => {
              const other = c.a === selectedNoradId ? c.b : c.a;
              const level = missLevel(c.missKm);
              return (
                <tr
                  key={`${c.a}-${c.b}-${c.tca}`}
                  className="cursor-pointer border-t border-[var(--line)] hover:bg-[rgba(34,211,238,0.08)]"
                  onClick={() => {
                    setCompare(other);
                    setClock({ epochMs: c.tca, playing: false });
                    setSelected(selectedNoradId);
                  }}
                >
                  <td className="px-2 py-2 font-mono">{nameByNorad(catalog, other)}</td>
                  <td className="px-2 py-2 font-mono tabular-nums">{formatUtc(c.tca)}</td>
                  <td className={`px-2 py-2 font-mono tabular-nums ${missToneClass(c.missKm)}`}>
                    {c.missKm.toFixed(2)}
                    {level === "crit" ? " · CRIT" : level === "amber" ? " · AMBER" : ""}
                  </td>
                  <td className="px-2 py-2 font-mono tabular-nums">{c.relVelocityKmS.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </Panel>
  );
}
