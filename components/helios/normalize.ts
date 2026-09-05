import type { CatalogEntry, ObjectType, OrbitClass } from "@/lib/types";
import { classifyFromTle } from "./format";

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function objectTypeOf(raw: Record<string, unknown>, name: string): ObjectType {
  const t = asString(raw.objectType || raw.OBJECT_TYPE).toLowerCase();
  if (t.includes("deb")) return "debris";
  if (t.includes("rocket") || t.includes("r/b") || name.includes("R/B")) return "rocket_body";
  if (t.includes("pay") || t === "payload") return "payload";
  if (/DEB/.test(name)) return "debris";
  if (/R\/B/.test(name)) return "rocket_body";
  return t ? "unknown" : "payload";
}

function orbitClassOf(raw: Record<string, unknown>, line2: string): OrbitClass {
  const given = asString(raw.orbitClass);
  if (given === "LEO" || given === "MEO" || given === "GEO" || given === "HEO") return given;
  return classifyFromTle(line2);
}

export function normalizeEntry(
  raw: unknown,
  group: string,
): CatalogEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const line1 = asString(rec.line1 || rec.TLE_LINE1);
  const line2 = asString(rec.line2 || rec.TLE_LINE2);
  if (line1.length < 60 || line2.length < 60) return null;
  const name = asString(rec.name || rec.OBJECT_NAME || rec.OBJECT_ID).trim() || "UNKNOWN";
  const noradId =
    asNumber(rec.noradId) ||
    asNumber(rec.NORAD_CAT_ID) ||
    parseInt(line1.slice(2, 7).trim(), 10);
  if (!noradId) return null;
  return {
    line1,
    line2,
    name,
    noradId,
    intlDes: asString(rec.intlDes || rec.OBJECT_ID) || undefined,
    group: asString(rec.group) || group,
    objectType: objectTypeOf(rec, name),
    orbitClass: orbitClassOf(rec, line2),
  };
}

export function normalizeCatalog(payload: unknown, group: string): CatalogEntry[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { entries?: unknown }).entries)
      ? (payload as { entries: unknown[] }).entries
      : [];
  const out: CatalogEntry[] = [];
  const seen = new Set<number>();
  for (const item of list) {
    const entry = normalizeEntry(item, group);
    if (!entry || seen.has(entry.noradId)) continue;
    seen.add(entry.noradId);
    out.push(entry);
  }
  return out;
}

export function catalogSourceOf(payload: unknown): "live" | "sample" {
  if (payload && typeof payload === "object" && "source" in payload) {
    return (payload as { source?: string }).source === "live" ? "live" : "sample";
  }
  return "sample";
}
