"use client";

import { useMemo } from "react";
import { Panel, EmptyNote } from "./Panel";
import { useFeatureUi } from "@/lib/feature-ui";
import { useHeliosStore } from "@/lib/store";
import { compareSats } from "@/lib/compare";
import { propagateAt, findEntry } from "@/lib/propagate";

function Telemetry({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="min-h-[56px] rounded border border-[var(--line)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="font-mono text-lg tabular-nums text-[var(--cyan)]">
        {value}
        {unit ? <span className="ml-1 text-xs text-[var(--muted)]">{unit}</span> : null}
      </div>
    </div>
  );
}

export function CompareMode() {
  const panel = useFeatureUi((s) => s.panel);
  const setPanel = useFeatureUi((s) => s.setPanel);
  const catalog = useHeliosStore((s) => s.catalog);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const compareNoradId = useHeliosStore((s) => s.compareNoradId);
  const epochMs = useHeliosStore((s) => s.clock.epochMs);
  const setCompare = useHeliosStore((s) => s.setCompare);

  const a = findEntry(catalog, selectedNoradId);
  const b = findEntry(catalog, compareNoradId);

  const delta = useMemo(() => {
    if (!a || !b) return null;
    const sa = propagateAt(a, new Date(epochMs));
    const sb = propagateAt(b, new Date(epochMs));
    if (!sa || !sb) return null;
    return { sa, sb, d: compareSats(sa, sb) };
  }, [a, b, epochMs]);

  if (panel !== "compare") return null;

  return (
    <Panel title="Compare" onClose={() => setPanel(null)}>
      <div className="space-y-3 p-3">
        <p className="text-[11px] text-[var(--muted)]">
          A is selected. Set B from the palette (search a sat, or click a conjunction row).
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-[var(--line)] p-2">
            <div className="text-[10px] uppercase text-[var(--muted)]">A</div>
            <div className="font-mono text-[var(--cyan)]">{a?.name ?? "—"}</div>
          </div>
          <div className="rounded border border-[var(--line)] p-2">
            <div className="text-[10px] uppercase text-[var(--muted)]">B</div>
            <div className="font-mono text-[var(--cyan)]">{b?.name ?? "—"}</div>
          </div>
        </div>
        {!a || !b ? (
          <EmptyNote>Need two NORADs. Select A, then set compare NORAD.</EmptyNote>
        ) : null}
        {delta ? (
          <div className="grid grid-cols-1 gap-2">
            <Telemetry label="Range" value={delta.d.rangeKm.toFixed(2)} unit="km" />
            <Telemetry label="Altitude Δ (A−B)" value={delta.d.altDeltaKm.toFixed(2)} unit="km" />
            <Telemetry label="Angular sep (geocenter)" value={delta.d.angSepDeg.toFixed(3)} unit="deg" />
            <Telemetry label="A alt" value={delta.sa.altKm.toFixed(1)} unit="km" />
            <Telemetry label="B alt" value={delta.sb.altKm.toFixed(1)} unit="km" />
          </div>
        ) : null}
        {compareNoradId != null ? (
          <button
            type="button"
            onClick={() => setCompare(null)}
            className="w-full rounded border border-[var(--line)] py-2 text-xs text-[var(--muted)] hover:text-[var(--text)]"
          >
            Clear B
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
