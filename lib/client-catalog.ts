import { catalogFromGp, type CelestrakGpRow } from "./catalog";
import type { CatalogEntry, CatalogResponse } from "./types";

export async function fetchCatalogClient(group: string): Promise<CatalogResponse> {
  try {
    const res = await fetch(`/api/catalog?group=${encodeURIComponent(group)}`);
    if (res.ok) {
      const data = (await res.json()) as CatalogResponse;
      if (Array.isArray(data.entries)) return data;
    }
  } catch {
    /* fall through */
  }
  const res = await fetch("/data/sample-catalog.json");
  if (!res.ok) throw new Error("sample catalog missing");
  const rows = (await res.json()) as CelestrakGpRow[];
  let entries = catalogFromGp(rows, group);
  const matched = entries.filter((e) => e.group === group);
  if (matched.length >= 1) entries = matched;
  return {
    group,
    source: "sample",
    updatedAt: new Date().toISOString(),
    entries,
  };
}

export function nameByNorad(catalog: CatalogEntry[], norad: number): string {
  return catalog.find((e) => e.noradId === norad)?.name ?? `NORAD ${norad}`;
}
