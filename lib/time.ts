const DAY_MS = 86_400_000;
const JD_UNIX_EPOCH = 2440587.5;

export function julianDate(date: Date | number): number {
  const ms = typeof date === "number" ? date : date.getTime();
  return ms / DAY_MS + JD_UNIX_EPOCH;
}

/** Greenwich mean sidereal time in radians (IAU 1982, sufficient for TEME). */
export function gmst(date: Date | number): number {
  const jd = julianDate(date);
  const t = (jd - 2451545.0) / 36525;
  let gmstDeg =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38_710_000;
  gmstDeg = ((gmstDeg % 360) + 360) % 360;
  return (gmstDeg * Math.PI) / 180;
}

export function formatUtc(ms: number, withDay = false): string {
  const d = new Date(ms);
  const hms = d.toISOString().slice(11, 19);
  if (!withDay) return `${hms}Z`;
  return `${d.toISOString().slice(0, 10)} ${hms}Z`;
}

export function formatDuration(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.abs(ms);
  const s = Math.floor(abs / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${sign}${hh}h ${String(mm).padStart(2, "0")}m`;
  if (mm > 0) return `${sign}${mm}m ${String(ss).padStart(2, "0")}s`;
  return `${sign}${ss}s`;
}
