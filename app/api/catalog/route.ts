import { liveOrSample } from "@/lib/server-catalog";
import { isGroupId } from "@/lib/groups";

export const revalidate = 21600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const groupRaw = url.searchParams.get("group") ?? "stations";
  const group = isGroupId(groupRaw) ? groupRaw : "stations";
  const payload = await liveOrSample(group);
  return Response.json(payload);
}
