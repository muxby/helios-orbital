"use client";

import { useMemo } from "react";
import { GitCompare, Pin } from "lucide-react";
import { useHeliosStore } from "@/lib/store";
import { propagateAt } from "@/lib/propagate";
import { elevationAzimuth, rangeRateKmS, slantRangeKm } from "@/lib/coords";
import { formatDuration, formatFixed } from "./format";
import { isTleStale, keplerianFromTle } from "@/lib/tle";
import { eclipseKindAt } from "@/lib/eclipse";
import { missionCard } from "@/lib/missions";
import { predictPasses } from "@/lib/passes";
import { cn } from "./cn";
import { useFeatureUi } from "@/lib/feature-ui";
import { formatUtc } from "@/lib/time";

const EMPTY_PASS = "No pass in window — try another observer or widen hours.";

export function Inspector() {
  const catalog = useHeliosStore((s) => s.catalog);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const compareNoradId = useHeliosStore((s) => s.compareNoradId);
  const watchlist = useHeliosStore((s) => s.watchlist);
  const epochMs = useHeliosStore((s) => s.clock.epochMs);
  const observer = useHeliosStore((s) => s.observer);
  const toggleWatch = useHeliosStore((s) => s.toggleWatch);
  const setCompare = useHeliosStore((s) => s.setCompare);
  const setClock = useHeliosStore((s) => s.setClock);

  const entry = catalog.find((s) => s.noradId === selectedNoradId) ?? null;
  const when = new Date(epochMs);
  const state = entry ? (propagateAt?.(entry, when, observer) ?? null) : null;
  const watched = entry ? watchlist.includes(entry.noradId) : false;
  const comparing = entry != null && compareNoradId === entry.noradId;

  const look = state ? elevationAzimuth(state.eci, observer, when) : null;
  const el = look?.elevation ?? Number.NaN;
  const az = look?.azimuth ?? Number.NaN;
  const kep = entry ? keplerianFromTle(entry.line2) : null;
  const stale = entry ? isTleStale(entry.line1, epochMs, 7) : false;
  const eclipse = state ? eclipseKindAt(state.eci, when) : "sunlit";
  const eclipsed = eclipse !== "sunlit";
  const decayRisk = (kep?.perigeeKm ?? 400) < 250;
  const slant = state ? slantRangeKm(state, observer) : Number.NaN;
  const rate =
    state?.velocityEci != null
      ? rangeRateKmS(state.eci, state.velocityEci, observer, when)
      : Number.NaN;
  const mission = entry ? missionCard(entry.noradId) : null;
  const epochBucket = Math.floor(epochMs / 300_000);

  const passes = useMemo(() => {
    if (!entry) return [];
    try {
      return predictPasses(entry, observer, epochMs, 72, 10, 16);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.noradId, observer.lat, observer.lon, observer.altM, epochBucket]);

  const next = passes[0] ?? null;

  if (!entry) {
    return (
      <aside className="helios-panel flex h-full w-[340px] shrink-0 flex-col p-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">INSPECTOR</p>
        <p className="mt-6 font-mono text-[11px] tracking-[0.14em] text-[var(--muted)]">
          SELECT AN OBJECT
        </p>
      </aside>
    );
  }

  const rows: { k: string; v: string; warn?: boolean }[] = [
    { k: "LAT", v: formatFixed(state?.lat ?? Number.NaN, 3, "°") },
    { k: "LON", v: formatFixed(state?.lon ?? Number.NaN, 3, "°") },
    {
      k: "ALT",
      v: formatFixed(state?.altKm ?? Number.NaN, 1, " km"),
      warn: decayRisk,
    },
    { k: "VEL", v: formatFixed(state?.velocityKmS ?? Number.NaN, 3, " km/s") },
    { k: "AZ", v: formatFixed(az, 1, "°") },
    { k: "EL", v: formatFixed(el, 1, "°"), warn: el < 0 },
    { k: "RANGE", v: formatFixed(slant, 1, " km") },
    { k: "Ṙ", v: formatFixed(rate, 3, " km/s") },
  ];

  return (
    <aside className="helios-panel flex h-full w-[340px] shrink-0 flex-col overflow-hidden">
      <div className="border-b border-[var(--line)] px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">INSPECTOR</p>
        <h2 className="mt-1 truncate text-[15px] font-medium tracking-wide">{entry.name}</h2>
        <p className="font-mono text-[11px] text-[var(--cyan)] tabular-nums">NORAD {entry.noradId}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {stale ? (
            <span className="rounded-sm border border-[var(--amber)] px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-[var(--amber)]">
              STALE TLE
            </span>
          ) : null}
          {eclipsed ? (
            <span className="rounded-sm border border-[var(--muted)] px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-[var(--muted)]">
              ECLIPSED · {eclipse.toUpperCase()}
            </span>
          ) : null}
          {decayRisk ? (
            <span className="rounded-sm border border-[var(--amber)] px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-[var(--amber)]">
              DECAY RISK
            </span>
          ) : null}
        </div>
      </div>
      <div className="helios-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <div className="flex gap-2 font-mono text-[10px] tracking-[0.14em] text-[var(--muted)]">
          <span className="rounded-sm border border-[var(--line)] px-1.5 py-0.5 uppercase">
            {entry.objectType.replace("_", " ")}
          </span>
          <span className="rounded-sm border border-[var(--line)] px-1.5 py-0.5">
            {entry.orbitClass}
          </span>
          <span className="rounded-sm border border-[var(--line)] px-1.5 py-0.5 uppercase">
            {entry.group}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {rows.map((row) => (
            <div key={row.k}>
              <dt className="font-mono text-[9px] tracking-[0.18em] text-[var(--muted)]">{row.k}</dt>
              <dd
                className={cn(
                  "font-mono text-[13px] tabular-nums",
                  row.warn ? "text-[var(--amber)]" : "text-[var(--cyan)]",
                )}
              >
                {row.v}
              </dd>
            </div>
          ))}
        </dl>
        <div>
          <p className="font-mono text-[9px] tracking-[0.18em] text-[var(--muted)]">NEXT PASS · 72H</p>
          <p className="font-mono text-[13px] text-[var(--cyan)] tabular-nums">
            {next ? formatDuration(next.aos - epochMs) : "—"}
          </p>
          {next ? (
            <p className="font-mono text-[10px] text-[var(--muted)]">
              MAX EL {next.maxEl.toFixed(1)}°
            </p>
          ) : (
            <p className="font-mono text-[10px] leading-relaxed text-[var(--muted)]">{EMPTY_PASS}</p>
          )}
        </div>
        {passes.length > 0 ? (
          <div>
            <p className="mb-1 font-mono text-[9px] tracking-[0.18em] text-[var(--muted)]">
              PASS CALENDAR
            </p>
            <ul className="divide-y divide-[var(--line)] rounded-sm border border-[var(--line)]">
              {passes.map((p) => (
                <li key={`${p.noradId}-${p.aos}`}>
                  <button
                    type="button"
                    onClick={() => setClock({ epochMs: p.aos, playing: false })}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left font-mono text-[10px] hover:bg-[rgba(34,211,238,0.08)]"
                  >
                    <span className="tabular-nums text-[var(--text)]">{formatUtc(p.aos, true)}</span>
                    <span className="text-[var(--cyan)]">{p.maxEl.toFixed(0)}°</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {kep ? (
          <div>
            <p className="mb-1 font-mono text-[9px] tracking-[0.18em] text-[var(--muted)]">
              ORBITAL ELEMENTS
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {(
                [
                  ["INC", formatFixed(kep.inclinationDeg, 2, "°")],
                  ["ECC", formatFixed(kep.eccentricity, 6)],
                  ["RAAN", formatFixed(kep.raanDeg, 2, "°")],
                  ["ARGP", formatFixed(kep.argPerigeeDeg, 2, "°")],
                  ["N", formatFixed(kep.meanMotionRevPerDay, 5, " r/d")],
                  ["PER", formatFixed(kep.periodMin, 2, " min")],
                  ["APO", formatFixed(kep.apogeeKm, 1, " km")],
                  ["PERI", formatFixed(kep.perigeeKm, 1, " km")],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[9px] tracking-[0.16em] text-[var(--muted)]">{k}</dt>
                  <dd
                    className={cn(
                      "font-mono text-[12px] tabular-nums text-[var(--cyan)]",
                      k === "PERI" && decayRisk && "text-[var(--amber)]",
                    )}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        <div>
          <p className="mb-1 font-mono text-[9px] tracking-[0.18em] text-[var(--muted)]">
            MISSION CARD
          </p>
          {mission ? (
            <div className="space-y-1 rounded-sm border border-[var(--line)] bg-black/25 p-2">
              <p className="text-[11px] leading-relaxed text-[var(--text)]">{mission.blurb}</p>
              <p className="font-mono text-[10px] text-[var(--cyan)]">{mission.radio}</p>
            </div>
          ) : (
            <p className="font-mono text-[10px] text-[var(--muted)]">No mission card.</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleWatch(entry.noradId)}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm border font-mono text-[10px] tracking-[0.16em] transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
              watched
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]",
            )}
          >
            <Pin className="h-3 w-3" fill={watched ? "currentColor" : "none"} />
            WATCH
          </button>
          <button
            type="button"
            onClick={() => {
              if (comparing) {
                setCompare(null);
                return;
              }
              setCompare(entry.noradId);
              useFeatureUi.getState().setPanel("compare");
            }}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm border font-mono text-[10px] tracking-[0.16em] transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
              comparing
                ? "border-[var(--cyan)] text-[var(--cyan)]"
                : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]",
            )}
          >
            <GitCompare className="h-3 w-3" />
            COMPARE
          </button>
        </div>
        <div>
          <p className="mb-1 font-mono text-[9px] tracking-[0.18em] text-[var(--muted)]">TLE</p>
          <pre className="overflow-x-auto rounded-sm border border-[var(--line)] bg-black/30 p-2 font-mono text-[10px] leading-5 text-[var(--text)]">
            {entry.line1}
            {"\n"}
            {entry.line2}
          </pre>
        </div>
      </div>
    </aside>
  );
}
