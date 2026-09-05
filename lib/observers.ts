import type { Observer } from "./types";

export interface ObserverCity {
  id: string;
  label: string;
  lat: number;
  lon: number;
  altM: number;
}

/** Mid-latitude NASA-adjacent default: ISS 51.6° routinely clears 10° here. */
export const DEFAULT_CITY_ID = "houston";

export const OBSERVER_CITIES: ObserverCity[] = [
  { id: "houston", label: "Houston", lat: 29.7604, lon: -95.3698, altM: 15 },
  { id: "boston", label: "Boston", lat: 42.3601, lon: -71.0589, altM: 10 },
  { id: "london", label: "London", lat: 51.5074, lon: -0.1278, altM: 15 },
  { id: "delhi", label: "New Delhi", lat: 28.6139, lon: 77.209, altM: 216 },
  { id: "tokyo", label: "Tokyo", lat: 35.6762, lon: 139.6503, altM: 40 },
  { id: "dubai", label: "Dubai", lat: 25.2048, lon: 55.2708, altM: 10 },
  { id: "sf", label: "San Francisco", lat: 37.7749, lon: -122.4194, altM: 20 },
  { id: "sydney", label: "Sydney", lat: -33.8688, lon: 151.2093, altM: 20 },
];

export const DEFAULT_OBSERVER: Observer = {
  lat: 29.7604,
  lon: -95.3698,
  altM: 15,
};

export function cityById(id: string | null | undefined): ObserverCity | undefined {
  if (!id || id === "custom") return undefined;
  return OBSERVER_CITIES.find((c) => c.id === id);
}

export function matchCityId(lat: number, lon: number): string {
  for (const c of OBSERVER_CITIES) {
    if (Math.abs(c.lat - lat) < 0.08 && Math.abs(c.lon - lon) < 0.08) return c.id;
  }
  return "custom";
}

export function observerFromCity(id: string): Observer | null {
  const c = cityById(id);
  if (!c) return null;
  return { lat: c.lat, lon: c.lon, altM: c.altM };
}
