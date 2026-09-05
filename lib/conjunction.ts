import { eciRangeKm } from "./coords";
import { propagateAt } from "./propagate";
import type { CatalogEntry, Conjunction } from "./types";

const DEFAULT_STEP_SEC = 60;
const DEFAULT_WINDOW_H = 4;
const DEFAULT_PAIR_LIMIT = 36;

function pairKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function stackFamily(name: string, noradId: number): string | null {
  const n = name.toUpperCase();
  if (
    noradId === 25544 ||
    /\bISS\b/.test(n) ||
    /ZARYA|ZVEZDA|NAUKA|POISK|RASSVET|PRICHAL|UNITY|DESTINY|COLUMBUS|KIBO|TRANQUILITY|HARMONY|QUEST/.test(
      n,
    ) ||
    /SOYUZ-MS|PROGRESS-MS|CYGNUS|CREW DRAGON/.test(n)
  ) {
    return "iss";
  }
  if (
    noradId === 48274 ||
    /\bCSS\b/.test(n) ||
    /TIANHE|WENTIAN|MENGTIAN|TIANZHOU|SHENZHOU/.test(n)
  ) {
    return "css";
  }
  return null;
}

export function sameStackPair(a: CatalogEntry, b: CatalogEntry): boolean {
  const fa = stackFamily(a.name, a.noradId);
  const fb = stackFamily(b.name, b.noradId);
  return fa != null && fa === fb;
}

export function scanConjunctions(
  entries: CatalogEntry[],
  windowStart = Date.now(),
  windowHours = DEFAULT_WINDOW_H,
  stepSec = DEFAULT_STEP_SEC,
  pairLimit = DEFAULT_PAIR_LIMIT,
  focusNorad?: number,
): Conjunction[] {
  if (entries.length < 2) return [];

  let pool = entries;
  if (focusNorad != null) {
    const focus = entries.find((e) => e.noradId === focusNorad);
    if (!focus) return [];
    const others = entries.filter((e) => e.noradId !== focusNorad).slice(0, pairLimit);
    pool = [focus, ...others];
  } else if (entries.length > pairLimit) {
    pool = entries.slice(0, pairLimit);
  }

  const byNorad = new Map(pool.map((e) => [e.noradId, e]));
  const best = new Map<string, Conjunction>();
  const end = windowStart + windowHours * 3_600_000;
  const stepMs = Math.max(15, stepSec) * 1000;

  for (let t = windowStart; t <= end; t += stepMs) {
    const date = new Date(t);
    const states = pool
      .map((e) => propagateAt(e, date))
      .filter((s): s is NonNullable<typeof s> => s != null);

    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const A = states[i];
        const B = states[j];
        if (focusNorad != null && A.noradId !== focusNorad && B.noradId !== focusNorad) {
          continue;
        }
        const ea = byNorad.get(A.noradId);
        const eb = byNorad.get(B.noradId);
        if (ea && eb && sameStackPair(ea, eb)) continue;
        const missKm = eciRangeKm(A.eci, B.eci);
        if (missKm < 1) continue;
        const key = pairKey(A.noradId, B.noradId);
        const prev = best.get(key);
        if (!prev || missKm < prev.missKm) {
          const va = A.velocityEci ?? { x: 0, y: 0, z: 0 };
          const vb = B.velocityEci ?? { x: 0, y: 0, z: 0 };
          best.set(key, {
            a: A.noradId,
            b: B.noradId,
            tca: t,
            missKm,
            relVelocityKmS: Math.hypot(va.x - vb.x, va.y - vb.y, va.z - vb.z),
          });
        }
      }
    }
  }

  return [...best.values()].sort((a, b) => a.missKm - b.missKm).slice(0, 20);
}
