import type { OrbitClass } from "@/lib/types";

export const CATALOG_GROUPS = [
  { id: "stations", label: "STATIONS" },
  { id: "starlink", label: "STARLINK" },
  { id: "gps-ops", label: "GPS" },
  { id: "weather", label: "WEATHER" },
  { id: "geo", label: "GEO" },
  { id: "visual", label: "VISUAL" },
  { id: "science", label: "SCIENCE" },
  { id: "active", label: "ACTIVE" },
] as const;

export const ORBIT_CHIPS: { id: "all" | OrbitClass; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "LEO", label: "LEO" },
  { id: "MEO", label: "MEO" },
  { id: "GEO", label: "GEO" },
  { id: "HEO", label: "HEO" },
];

export const SIM_RATES = [1, 10, 60, 300, 1000] as const;

export const EARTH_RADIUS_KM = 6378.137;
export const SEARCH_INPUT_ID = "helios-search";
export const ROW_HEIGHT = 38;
