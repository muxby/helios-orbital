import * as satellite from "satellite.js";
import { elevationAzimuth } from "./coords";
import type { CatalogEntry, Observer, SatState, TleSet } from "./types";

export function satrecFromTle(tle: TleSet) {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    if (!satrec || satrec.error) return null;
    return satrec;
  } catch {
    return null;
  }
}

export function propagateAt(
  tle: TleSet,
  date: Date,
  observer?: Observer,
): SatState | null {
  const satrec = satrecFromTle(tle);
  if (!satrec) return null;
  const pv = satellite.propagate(satrec, date);
  if (!pv) return null;
  const position = pv.position;
  const velocity = pv.velocity;
  if (
    typeof position === "boolean" ||
    typeof velocity === "boolean" ||
    !position ||
    !velocity
  ) {
    return null;
  }
  const gmst = satellite.gstime(date);
  const gd = satellite.eciToGeodetic(position, gmst);
  let look: { elevation?: number; azimuth?: number } = {};
  if (observer) {
    look = elevationAzimuth(position, observer, date);
  }
  return {
    noradId: tle.noradId,
    name: tle.name,
    lat: satellite.degreesLat(gd.latitude),
    lon: satellite.degreesLong(gd.longitude),
    altKm: gd.height,
    velocityKmS: Math.hypot(velocity.x, velocity.y, velocity.z),
    azimuth: look.azimuth,
    elevation: look.elevation,
    eci: { x: position.x, y: position.y, z: position.z },
    velocityEci: { x: velocity.x, y: velocity.y, z: velocity.z },
  };
}

export function propagateMany(
  tles: TleSet[],
  date: Date,
  observer?: Observer,
): SatState[] {
  const out: SatState[] = [];
  for (const tle of tles) {
    const s = propagateAt(tle, date, observer);
    if (s) out.push(s);
  }
  return out;
}

export function orbitSamples(
  tle: TleSet,
  date: Date,
  samples = 90,
): SatState[] {
  const satrec = satrecFromTle(tle);
  if (!satrec) return [];
  const n = satrec.no; // rad/min
  if (!n || n <= 0) return [];
  const periodMs = ((2 * Math.PI) / n) * 60 * 1000;
  const out: SatState[] = [];
  for (let i = 0; i < samples; i++) {
    const t = new Date(date.getTime() + (i / samples) * periodMs);
    const s = propagateAt(tle, t);
    if (s) out.push(s);
  }
  return out;
}

export function groundTrack(
  tle: TleSet,
  date: Date,
  minutes = 90,
  stepSec = 30,
): { lat: number; lon: number }[] {
  const out: { lat: number; lon: number }[] = [];
  const start = date.getTime();
  const end = start + minutes * 60_000;
  for (let t = start; t <= end; t += stepSec * 1000) {
    const s = propagateAt(tle, new Date(t));
    if (s) out.push({ lat: s.lat, lon: s.lon });
  }
  return out;
}

export function visibleSlice<T>(items: T[], maxRender: number): T[] {
  if (items.length <= maxRender) return items;
  return items.slice(0, maxRender);
}

export function findEntry(
  catalog: CatalogEntry[],
  noradId: number | null,
): CatalogEntry | undefined {
  if (noradId == null) return undefined;
  return catalog.find((e) => e.noradId === noradId);
}
