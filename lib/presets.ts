import type { CameraPreset, OrbitClassFilter } from "./types";

export interface ConstellationPreset {
  id: string;
  label: string;
  hint: string;
  group: string;
  filter: OrbitClassFilter;
  norad: number | null;
  camera: CameraPreset;
}

export const CONSTELLATION_PRESETS: ConstellationPreset[] = [
  {
    id: "iss",
    label: "ISS",
    hint: "Station 25544",
    group: "stations",
    filter: "all",
    norad: 25544,
    camera: "iss",
  },
  {
    id: "starlink",
    label: "Starlink",
    hint: "LEO mesh",
    group: "starlink",
    filter: "LEO",
    norad: null,
    camera: "starlink",
  },
  {
    id: "gps",
    label: "GPS",
    hint: "MEO constellation",
    group: "gps-ops",
    filter: "MEO",
    norad: null,
    camera: "gps",
  },
  {
    id: "geo",
    label: "GEO belt",
    hint: "Clarke belt",
    group: "geo",
    filter: "GEO",
    norad: null,
    camera: "geo",
  },
];
