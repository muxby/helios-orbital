export const GROUPS = [
  { id: "stations", label: "Stations" },
  { id: "visual", label: "Visual" },
  { id: "active", label: "Active" },
  { id: "starlink", label: "Starlink" },
  { id: "gps-ops", label: "GPS" },
  { id: "weather", label: "Weather" },
  { id: "science", label: "Science" },
  { id: "geo", label: "GEO" },
] as const;

export type GroupId = (typeof GROUPS)[number]["id"];

export function isGroupId(value: string): value is GroupId {
  return GROUPS.some((g) => g.id === value);
}

export function groupLabel(id: string): string {
  return GROUPS.find((g) => g.id === id)?.label ?? id;
}
