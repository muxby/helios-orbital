import { readFile } from "fs/promises";
import path from "path";
import { catalogFromGp, type CelestrakGpRow } from "@/lib/catalog";
import type { CatalogEntry, CatalogResponse } from "@/lib/types";

export async function loadSampleRows(): Promise<CelestrakGpRow[]> {
  const file = path.join(process.cwd(), "public/data/sample-catalog.json");
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as CelestrakGpRow[];
}

export function entriesFromSample(rows: CelestrakGpRow[], group: string): CatalogEntry[] {
  const all = catalogFromGp(rows, group);
  const matched = all.filter((e) => e.group === group);
  if (matched.length > 0) return matched;
  return all;
}

export async function sampleCatalog(group: string): Promise<CatalogResponse> {
  const rows = await loadSampleRows();
  return {
    group,
    source: "sample",
    updatedAt: new Date().toISOString(),
    entries: entriesFromSample(rows, group),
  };
}

export async function liveOrSample(group: string): Promise<CatalogResponse> {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=json`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 21_600 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`celestrak ${res.status}`);
    const rows = (await res.json()) as CelestrakGpRow[];
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("empty catalog");
    const entries = catalogFromGp(rows, group);
    if (entries.length === 0) throw new Error("empty catalog");
    return {
      group,
      source: "live",
      updatedAt: new Date().toISOString(),
      entries,
    };
  } catch {
    return sampleCatalog(group);
  }
}

export async function findEntryAnywhere(
  norad: number,
  group = "stations",
): Promise<CatalogEntry | undefined> {
  const live = await liveOrSample(group);
  const hit = live.entries.find((e) => e.noradId === norad);
  if (hit) return hit;
  const sample = await sampleCatalog(group);
  const all = [...live.entries, ...sample.entries];
  return all.find((e) => e.noradId === norad);
}
