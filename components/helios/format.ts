export function formatUtc(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${da} ${h}:${mi}:${s} UTC`;
}

export function formatClock(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  const ms3 = String(d.getUTCMilliseconds()).padStart(3, "0");
  return `${h}:${mi}:${s}.${ms3}`;
}

export function formatDuration(ms: number): string {
  const sign = ms < 0 ? "−" : "";
  let sec = Math.floor(Math.abs(ms) / 1000);
  const days = Math.floor(sec / 86400);
  sec %= 86400;
  const h = Math.floor(sec / 3600);
  sec %= 3600;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (days > 0) return `${sign}${days}d ${h}h ${m}m`;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatFixed(n: number, digits: number, suffix = ""): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}${suffix}`;
}

export function tleInclinationDeg(line2: string): number {
  return parseFloat(line2.slice(8, 16));
}

export function tleEccentricity(line2: string): number {
  const raw = line2.slice(26, 33).trim();
  return parseFloat(`0.${raw}`);
}

export function tleMeanMotion(line2: string): number {
  return parseFloat(line2.slice(52, 63));
}

export function tlePeriodMin(line2: string): number {
  const n = tleMeanMotion(line2);
  return n > 0 ? 1440 / n : Number.NaN;
}

export function classifyFromTle(line2: string): "LEO" | "MEO" | "GEO" | "HEO" | "unknown" {
  const n = tleMeanMotion(line2);
  const e = tleEccentricity(line2);
  if (!Number.isFinite(n) || n <= 0) return "unknown";
  if (e > 0.25) return "HEO";
  if (n > 10.5) return "LEO";
  if (n > 1.5 && n <= 10.5) return "MEO";
  if (n >= 0.9 && n <= 1.15) return "GEO";
  return "HEO";
}
