import { propagateAt } from "./propagate";
import type { CatalogEntry } from "./types";

export function ephemerisCsv(
  entry: CatalogEntry,
  startMs: number,
  minutes = 90,
  stepSec = 30,
): string {
  const lines = ["time_utc,lat_deg,lon_deg,alt_km"];
  const end = startMs + minutes * 60_000;
  const step = Math.max(5, stepSec) * 1000;
  for (let t = startMs; t <= end; t += step) {
    const s = propagateAt(entry, new Date(t));
    if (!s) continue;
    lines.push(
      `${new Date(t).toISOString()},${s.lat.toFixed(5)},${s.lon.toFixed(5)},${s.altKm.toFixed(3)}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

export function downloadText(filename: string, body: string, mime = "text/csv") {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
