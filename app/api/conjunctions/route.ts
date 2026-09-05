import { liveOrSample } from "@/lib/server-catalog";
import { scanConjunctions } from "@/lib/conjunction";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const norad = Number(url.searchParams.get("norad") ?? "");
  const group = url.searchParams.get("group") ?? "stations";
  const hours = Math.min(12, Math.max(1, Number(url.searchParams.get("hours") ?? 4)));
  const step = Math.min(120, Math.max(30, Number(url.searchParams.get("step") ?? 60)));
  const catalog = await liveOrSample(group);
  const focus = Number.isFinite(norad) && norad > 0 ? norad : undefined;
  const conjunctions = scanConjunctions(
    catalog.entries,
    Date.now(),
    hours,
    step,
    36,
    focus,
  );
  return Response.json({
    source: catalog.source,
    windowHours: hours,
    conjunctions,
  });
}
