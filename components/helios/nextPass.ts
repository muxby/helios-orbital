import type { CatalogEntry, Pass, TleSet } from "@/lib/types";
import type { Observer } from "@/lib/types";
import { propagateAt } from "@/lib/propagate";
import { elevationDeg } from "./geo";

export function nextPassFor(
  sat: TleSet,
  observer: Observer,
  startMs: number,
  horizonDeg = 10,
  windowHours = 12,
): Pass | null {
  const step = 60_000;
  const end = startMs + windowHours * 3_600_000;
  let inPass = false;
  let aos = 0;
  let maxEl = -90;
  let maxElTime = 0;
  let prevEl = -90;

  for (let t = startMs; t <= end; t += step) {
    const state = propagateAt?.(sat, new Date(t));
    if (!state) continue;
    const el = elevationDeg(
      observer.lat,
      observer.lon,
      observer.altM,
      state.lat,
      state.lon,
      state.altKm,
    );
    if (!inPass && prevEl < horizonDeg && el >= horizonDeg) {
      inPass = true;
      aos = t;
      maxEl = el;
      maxElTime = t;
    } else if (inPass) {
      if (el > maxEl) {
        maxEl = el;
        maxElTime = t;
      }
      if (el < horizonDeg && prevEl >= horizonDeg) {
        return {
          noradId: sat.noradId,
          aos,
          los: t,
          maxEl,
          maxElTime,
        };
      }
    }
    prevEl = el;
  }

  if (inPass) {
    return {
      noradId: (sat as CatalogEntry).noradId,
      aos,
      los: end,
      maxEl,
      maxElTime,
    };
  }
  return null;
}
