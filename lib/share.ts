import type { Observer } from "./types";

export function heliosShareUrl(input: {
  noradId: number | null;
  observer: Observer;
  epochMs: number;
}): string {
  const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost:3000/");
  if (input.noradId != null) url.searchParams.set("norad", String(input.noradId));
  else url.searchParams.delete("norad");
  url.searchParams.set("lat", input.observer.lat.toFixed(4));
  url.searchParams.set("lon", input.observer.lon.toFixed(4));
  url.searchParams.set("t", String(Math.round(input.epochMs)));
  return url.toString();
}

export function parseHeliosSearch(search: string): {
  norad: number | null;
  lat: number | null;
  lon: number | null;
  t: number | null;
} {
  const q = search.startsWith("?") ? search.slice(1) : search;
  const p = new URLSearchParams(q);
  const noradRaw = Number(p.get("norad") ?? "");
  const latRaw = parseOptionalCoord(p.get("lat"));
  const lonRaw = parseOptionalCoord(p.get("lon"));
  const tRaw = parseOptionalCoord(p.get("t"));
  return {
    norad: Number.isFinite(noradRaw) && noradRaw > 0 ? noradRaw : null,
    lat: Number.isFinite(latRaw) && latRaw >= -90 && latRaw <= 90 ? latRaw : null,
    lon: Number.isFinite(lonRaw) && lonRaw >= -180 && lonRaw <= 180 ? lonRaw : null,
    t: Number.isFinite(tRaw) && tRaw > 1e11 ? tRaw : null,
  };
}

/** Missing/blank query params must stay null — `Number("") === 0` would pin the observer on the equator. */
function parseOptionalCoord(raw: string | null): number {
  if (raw == null || raw.trim() === "") return Number.NaN;
  return Number(raw);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}
