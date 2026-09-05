import { classifyObject, classifyOrbit, parseTle, tleFromGp, type GpElements } from "./tle";
import type { CatalogEntry } from "./types";

export interface CelestrakGpRow extends GpElements {
  TLE_LINE1?: string;
  TLE_LINE2?: string;
  GROUP?: string;
}

export function gpRowToEntry(row: CelestrakGpRow, group: string): CatalogEntry | null {
  let line1 = row.TLE_LINE1?.trim();
  let line2 = row.TLE_LINE2?.trim();
  if (!line1 || !line2) {
    const built = tleFromGp(row);
    if (!built) return null;
    line1 = built.line1;
    line2 = built.line2;
  }
  const name = (row.OBJECT_NAME ?? "UNKNOWN").trim();
  const tle = parseTle(line1, line2, name);
  const norad = Number(row.NORAD_CAT_ID);
  if (Number.isFinite(norad) && norad > 0) tle.noradId = norad;
  if (row.OBJECT_ID) tle.intlDes = row.OBJECT_ID;
  return {
    ...tle,
    group: row.GROUP ?? group,
    objectType: classifyObject(name),
    orbitClass: classifyOrbit(line2),
  };
}

export function catalogFromGp(rows: CelestrakGpRow[], group: string): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  const seen = new Set<number>();
  for (const row of rows) {
    const entry = gpRowToEntry(row, group);
    if (!entry || seen.has(entry.noradId)) continue;
    seen.add(entry.noradId);
    out.push(entry);
  }
  return out;
}
