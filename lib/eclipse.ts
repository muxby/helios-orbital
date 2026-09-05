import { julianDate } from "./time";

export type EclipseKind = "sunlit" | "umbra" | "penumbra";

const RE_KM = 6378.137;
const RS_KM = 696_000;
const AU_KM = 149_597_870.7;

/** Low-precision apparent sun unit vector in equatorial/TEME-ish ECI. */
export function sunEciUnit(date: Date | number): { x: number; y: number; z: number } {
  const jd = julianDate(date);
  const n = jd - 2451545.0;
  const L = ((280.460 + 0.9856474 * n) % 360) * (Math.PI / 180);
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);
  const lambda = L + ((1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI) / 180;
  const eps = ((23.439 - 0.0000004 * n) * Math.PI) / 180;
  const x = Math.cos(lambda);
  const y = Math.cos(eps) * Math.sin(lambda);
  const z = Math.sin(eps) * Math.sin(lambda);
  const m = Math.hypot(x, y, z) || 1;
  return { x: x / m, y: y / m, z: z / m };
}

/**
 * Conical Earth shadow. `r` is satellite TEME position (km).
 * Umbra = fully inside the umbral cone; penumbra = annular shadow.
 */
export function eclipseKind(
  r: { x: number; y: number; z: number },
  sunHat: { x: number; y: number; z: number },
  reKm = RE_KM,
): EclipseKind {
  const along = r.x * sunHat.x + r.y * sunHat.y + r.z * sunHat.z;
  const r2 = r.x * r.x + r.y * r.y + r.z * r.z;
  const perp = Math.sqrt(Math.max(0, r2 - along * along));
  if (along >= 0) return "sunlit";
  const dist = Math.abs(along);
  const umbraR = Math.max(0, reKm - (dist * (RS_KM - reKm)) / AU_KM);
  const penumbraR = reKm + (dist * (RS_KM + reKm)) / AU_KM;
  if (perp <= umbraR) return "umbra";
  if (perp <= penumbraR) return "penumbra";
  return "sunlit";
}

export function isEclipsed(
  r: { x: number; y: number; z: number },
  sunHat: { x: number; y: number; z: number },
  reKm = RE_KM,
): boolean {
  const k = eclipseKind(r, sunHat, reKm);
  return k === "umbra" || k === "penumbra";
}

export function eclipseKindAt(r: { x: number; y: number; z: number }, date: Date | number): EclipseKind {
  return eclipseKind(r, sunEciUnit(date));
}
