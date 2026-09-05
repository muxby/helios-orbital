import { elevationAzimuth } from "./coords";
import { propagateAt } from "./propagate";
import type { CatalogEntry, Observer, Pass, TleSet } from "./types";

const MIN_EL_DEG = 10;
const COARSE_MS = 30_000;

function elevationAt(tle: TleSet, observer: Observer, tMs: number): number | null {
  const s = propagateAt(tle, new Date(tMs));
  if (!s) return null;
  return elevationAzimuth(s.eci, observer, new Date(tMs)).elevation;
}

function refineCrossing(
  tle: TleSet,
  observer: Observer,
  tLo: number,
  tHi: number,
  minEl: number,
  rising: boolean,
): number {
  let lo = tLo;
  let hi = tHi;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const el = elevationAt(tle, observer, mid);
    if (el == null) return rising ? hi : lo;
    if (rising) {
      if (el < minEl) lo = mid;
      else hi = mid;
    } else if (el >= minEl) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function predictPasses(
  tle: TleSet,
  observer: Observer,
  startMs = Date.now(),
  horizonHours = 24,
  minEl = MIN_EL_DEG,
  n = 8,
): Pass[] {
  const end = startMs + horizonHours * 3_600_000;
  const passes: Pass[] = [];
  let prevEl: number | null = null;
  let inPass = false;
  let aos = 0;
  let maxEl = -90;
  let maxElTime = startMs;

  for (let t = startMs; t <= end; t += COARSE_MS) {
    const el = elevationAt(tle, observer, t);
    if (el == null) {
      prevEl = null;
      continue;
    }
    if (!inPass && prevEl != null && prevEl < minEl && el >= minEl) {
      inPass = true;
      aos = refineCrossing(tle, observer, t - COARSE_MS, t, minEl, true);
      maxEl = el;
      maxElTime = t;
    }
    if (inPass) {
      if (el > maxEl) {
        maxEl = el;
        maxElTime = t;
      }
      if (prevEl != null && prevEl >= minEl && el < minEl) {
        const los = refineCrossing(tle, observer, t - COARSE_MS, t, minEl, false);
        passes.push({
          noradId: tle.noradId,
          aos,
          los,
          maxEl,
          maxElTime,
        });
        inPass = false;
        if (passes.length >= n) break;
      }
    }
    prevEl = el;
  }

  return passes;
}

export function predictPassesMany(
  entries: CatalogEntry[],
  observer: Observer,
  startMs = Date.now(),
  horizonHours = 12,
  nPerSat = 2,
  satCap = 40,
): Pass[] {
  const slice = entries.slice(0, satCap);
  const all: Pass[] = [];
  for (const e of slice) {
    all.push(...predictPasses(tleWrap(e), observer, startMs, horizonHours, MIN_EL_DEG, nPerSat));
  }
  all.sort((a, b) => a.aos - b.aos);
  return all;
}

function tleWrap(e: CatalogEntry): TleSet {
  return e;
}

export function nextIssPass(
  entries: CatalogEntry[],
  observer: Observer,
  startMs = Date.now(),
): Pass | null {
  const iss = entries.find((e) => e.noradId === 25544);
  if (!iss) return null;
  const [pass] = predictPasses(iss, observer, startMs, 48, MIN_EL_DEG, 1);
  return pass ?? null;
}
