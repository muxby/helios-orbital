import { findEntryAnywhere, liveOrSample } from "@/lib/server-catalog";
import { predictPasses, predictPassesMany } from "@/lib/passes";
import type { Observer } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const norad = Number(url.searchParams.get("norad") ?? "");
  const lat = Number(url.searchParams.get("lat") ?? 29.7604);
  const lon = Number(url.searchParams.get("lon") ?? -95.3698);
  const altM = Number(url.searchParams.get("altM") ?? 15);
  const hours = Math.min(72, Math.max(1, Number(url.searchParams.get("hours") ?? 48)));
  const n = Math.min(24, Math.max(1, Number(url.searchParams.get("n") ?? 12)));
  const group = url.searchParams.get("group") ?? "stations";
  const observer: Observer = {
    lat: Number.isFinite(lat) ? lat : 29.7604,
    lon: Number.isFinite(lon) ? lon : -95.3698,
    altM: Number.isFinite(altM) ? altM : 15,
  };
  const startMs = Date.now();

  if (Number.isFinite(norad) && norad > 0) {
    const entry = await findEntryAnywhere(norad, group);
    if (!entry) {
      return Response.json({ error: "sat not in catalog", passes: [] }, { status: 404 });
    }
    const passes = predictPasses(entry, observer, startMs, hours, 10, n);
    return Response.json({ source: "computed", observer, passes });
  }

  const catalog = await liveOrSample(group);
  const passes = predictPassesMany(catalog.entries, observer, startMs, hours, 2, 24);
  return Response.json({ source: catalog.source, observer, passes });
}
