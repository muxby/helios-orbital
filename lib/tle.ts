import type { CatalogEntry, ObjectType, OrbitClass, TleSet } from "./types";

export function tleChecksum(line: string): number {
  let sum = 0;
  const n = Math.min(68, line.length);
  for (let i = 0; i < n; i++) {
    const c = line[i];
    if (c >= "0" && c <= "9") sum += c.charCodeAt(0) - 48;
    else if (c === "-") sum += 1;
  }
  return sum % 10;
}

export function noradFromLine1(line1: string): number {
  const n = Number.parseInt(line1.slice(2, 7).trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

export function meanMotionRevPerDay(line2: string): number {
  const n = Number.parseFloat(line2.slice(52, 63).trim());
  return Number.isFinite(n) ? n : 0;
}

export function eccentricityFromLine2(line2: string): number {
  const raw = line2.slice(26, 33).trim();
  const n = Number.parseFloat(`0.${raw}`);
  return Number.isFinite(n) ? n : 0;
}

export function inclinationDeg(line2: string): number {
  const n = Number.parseFloat(line2.slice(8, 16).trim());
  return Number.isFinite(n) ? n : 0;
}

export function periodMinutes(line2: string): number {
  const n = meanMotionRevPerDay(line2);
  if (n <= 0) return 0;
  return 1440 / n;
}

export function classifyOrbit(line2: string): OrbitClass {
  const ecc = eccentricityFromLine2(line2);
  const period = periodMinutes(line2);
  const inc = inclinationDeg(line2);
  if (ecc >= 0.25) return "HEO";
  if (period >= 1300 && period <= 1600 && inc < 25) return "GEO";
  if (period > 0 && period < 225) return "LEO";
  if (period >= 225 && period < 1300) return "MEO";
  return "unknown";
}

export function classifyObject(name: string): ObjectType {
  const u = name.toUpperCase();
  if (/\bDEB\b|\bDEBRIS\b/.test(u)) return "debris";
  if (/\bR\/B\b|\bROCKET\b/.test(u)) return "rocket_body";
  if (u.includes("UNKNOWN")) return "unknown";
  return "payload";
}

export function parseTle(
  line1: string,
  line2: string,
  name = "UNKNOWN",
): TleSet {
  const l1 = line1.trim();
  const l2 = line2.trim();
  return {
    line1: l1,
    line2: l2,
    name: name.trim() || "UNKNOWN",
    noradId: noradFromLine1(l1),
    intlDes: l1.slice(9, 17).trim() || undefined,
  };
}

/** Celestrak GP JSON (FORMAT=json) — mean elements, usually no TLE_LINE*. */
export interface GpElements {
  OBJECT_NAME?: string;
  OBJECT_ID?: string;
  NORAD_CAT_ID?: number | string;
  EPOCH?: string;
  MEAN_MOTION?: number;
  ECCENTRICITY?: number;
  INCLINATION?: number;
  RA_OF_ASC_NODE?: number;
  ARG_OF_PERICENTER?: number;
  MEAN_ANOMALY?: number;
  BSTAR?: number;
  MEAN_MOTION_DOT?: number;
  MEAN_MOTION_DDOT?: number;
  CLASSIFICATION_TYPE?: string;
  ELEMENT_SET_NO?: number;
  REV_AT_EPOCH?: number;
  EPHEMERIS_TYPE?: number;
}

function padRight(s: string, n: number): string {
  return s.slice(0, n).padEnd(n, " ");
}

function padLeft(s: string, n: number): string {
  return s.slice(0, n).padStart(n, " ");
}

function finishTleLine(body68: string): string {
  const base = padRight(body68, 68).slice(0, 68);
  return base + String(tleChecksum(base));
}

function tleSci(value: number): string {
  if (!Number.isFinite(value) || value === 0) return " 00000-0";
  const sign = value < 0 ? "-" : " ";
  const av = Math.abs(value);
  let exp = Math.floor(Math.log10(av)) + 1;
  let digits = Math.round((av / Math.pow(10, exp)) * 1e5);
  if (digits >= 100000) {
    digits = 10000;
    exp += 1;
  }
  if (digits === 0) return " 00000-0";
  const clamped = Math.max(-9, Math.min(9, exp));
  const expSign = clamped < 0 ? "-" : "+";
  return `${sign}${String(digits).padStart(5, "0")}${expSign}${Math.abs(clamped)}`;
}

function tleNDot(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  const sign = n < 0 ? "-" : " ";
  const body = Math.abs(n).toFixed(8);
  const frac = body.startsWith("0.") ? body.slice(1) : body.slice(body.indexOf("."));
  return `${sign}${frac}`.slice(0, 10).padEnd(10, "0");
}

function intlDesField(objectId?: string): string {
  if (!objectId) return "        ";
  const m = objectId.trim().match(/^(\d{2,4})-(\d{3})([A-Z0-9]{1,3})$/i);
  if (!m) return padRight(objectId.replace(/-/g, ""), 8);
  const year = m[1].length === 4 ? m[1].slice(2) : m[1].padStart(2, "0");
  return padRight(`${year}${m[2]}${m[3].toUpperCase()}`, 8);
}

function epochField(iso: string): string | null {
  const utc = iso.includes("T") && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? `${iso}Z` : iso;
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const yy = String(y % 100).padStart(2, "0");
  const start = Date.UTC(y, 0, 1);
  const doy = (d.getTime() - start) / 86_400_000 + 1;
  return `${yy}${doy.toFixed(8).padStart(12, " ")}`;
}

function angleField(n: number): string {
  const v = Number.isFinite(n) ? ((n % 360) + 360) % 360 : 0;
  return v.toFixed(4).padStart(8, " ");
}

function eccField(e: number): string {
  const v = Number.isFinite(e) ? Math.min(Math.max(e, 0), 0.9999999) : 0;
  return String(Math.round(v * 1e7)).padStart(7, "0");
}

function meanMotionField(n: number): string {
  return n.toFixed(8).padStart(11, " ").slice(0, 11);
}

export function tleFromGp(row: GpElements): { line1: string; line2: string } | null {
  const norad = Number(row.NORAD_CAT_ID);
  const meanMotion = Number(row.MEAN_MOTION);
  if (!Number.isFinite(norad) || norad <= 0 || !Number.isFinite(meanMotion) || meanMotion <= 0) {
    return null;
  }
  if (!row.EPOCH) return null;
  const epoch = epochField(row.EPOCH);
  if (!epoch || epoch.length !== 14) return null;

  const cat = padLeft(String(Math.trunc(norad)), 5);
  const cls = (row.CLASSIFICATION_TYPE ?? "U").trim().slice(0, 1).toUpperCase() || "U";
  const elset = padLeft(String(Math.trunc(row.ELEMENT_SET_NO ?? 999) % 10000), 4);
  const eph = String(Math.trunc(row.EPHEMERIS_TYPE ?? 0) % 10);
  const rev = padLeft(String(Math.trunc(row.REV_AT_EPOCH ?? 0) % 100000), 5);

  const line1 = finishTleLine(
    `1 ${cat}${cls} ${intlDesField(row.OBJECT_ID)} ${epoch} ${tleNDot(row.MEAN_MOTION_DOT ?? 0)} ${tleSci(row.MEAN_MOTION_DDOT ?? 0)} ${tleSci(row.BSTAR ?? 0)} ${eph} ${elset}`,
  );
  const line2 = finishTleLine(
    `2 ${cat} ${angleField(row.INCLINATION ?? 0)} ${angleField(row.RA_OF_ASC_NODE ?? 0)} ${eccField(row.ECCENTRICITY ?? 0)} ${angleField(row.ARG_OF_PERICENTER ?? 0)} ${angleField(row.MEAN_ANOMALY ?? 0)} ${meanMotionField(meanMotion)}${rev}`,
  );
  return { line1, line2 };
}

export function toCatalogEntry(
  tle: TleSet,
  group: string,
): CatalogEntry {
  return {
    ...tle,
    group,
    objectType: classifyObject(tle.name),
    orbitClass: classifyOrbit(tle.line2),
  };
}

const MU_KM3_S2 = 398600.4418;
const RE_KM = 6378.137;

export function raanDeg(line2: string): number {
  const n = Number.parseFloat(line2.slice(17, 25).trim());
  return Number.isFinite(n) ? n : 0;
}

export function argPerigeeDeg(line2: string): number {
  const n = Number.parseFloat(line2.slice(34, 42).trim());
  return Number.isFinite(n) ? n : 0;
}

export function meanAnomalyDeg(line2: string): number {
  const n = Number.parseFloat(line2.slice(43, 51).trim());
  return Number.isFinite(n) ? n : 0;
}

/** TLE epoch as UTC ms. Line 1 cols 19–32: yy + day-of-year. */
export function tleEpochMs(line1: string): number | null {
  if (line1.length < 32) return null;
  const yy = Number.parseInt(line1.slice(18, 20).trim(), 10);
  const doy = Number.parseFloat(line1.slice(20, 32).trim());
  if (!Number.isFinite(yy) || !Number.isFinite(doy) || doy <= 0) return null;
  const year = yy < 57 ? 2000 + yy : 1900 + yy;
  return Date.UTC(year, 0, 1) + (doy - 1) * 86_400_000;
}

export function tleAgeDays(line1: string, clockMs: number): number | null {
  const epoch = tleEpochMs(line1);
  if (epoch == null || !Number.isFinite(clockMs)) return null;
  return (clockMs - epoch) / 86_400_000;
}

export function isTleStale(line1: string, clockMs: number, days = 7): boolean {
  const age = tleAgeDays(line1, clockMs);
  if (age == null) return false;
  return Math.abs(age) > days;
}

export interface KeplerianElements {
  inclinationDeg: number;
  eccentricity: number;
  raanDeg: number;
  argPerigeeDeg: number;
  meanAnomalyDeg: number;
  meanMotionRevPerDay: number;
  periodMin: number;
  semiMajorAxisKm: number;
  apogeeKm: number;
  perigeeKm: number;
}

export function keplerianFromTle(line2: string): KeplerianElements {
  const inc = inclinationDeg(line2);
  const ecc = eccentricityFromLine2(line2);
  const raan = raanDeg(line2);
  const argp = argPerigeeDeg(line2);
  const ma = meanAnomalyDeg(line2);
  const n = meanMotionRevPerDay(line2);
  const period = periodMinutes(line2);
  const nRadS = (n * 2 * Math.PI) / 86_400;
  const a = nRadS > 0 ? Math.cbrt(MU_KM3_S2 / (nRadS * nRadS)) : 0;
  return {
    inclinationDeg: inc,
    eccentricity: ecc,
    raanDeg: raan,
    argPerigeeDeg: argp,
    meanAnomalyDeg: ma,
    meanMotionRevPerDay: n,
    periodMin: period,
    semiMajorAxisKm: a,
    apogeeKm: a > 0 ? a * (1 + ecc) - RE_KM : 0,
    perigeeKm: a > 0 ? a * (1 - ecc) - RE_KM : 0,
  };
}
