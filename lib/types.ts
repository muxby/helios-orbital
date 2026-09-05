export type ObjectType = "payload" | "rocket_body" | "debris" | "unknown";
export type OrbitClass = "LEO" | "MEO" | "GEO" | "HEO" | "unknown";
export type CatalogStatus = "idle" | "loading" | "ready" | "error";
export type CatalogSource = "live" | "sample" | "unknown";
export type OrbitClassFilter = "all" | OrbitClass;
export type CameraPreset = "iss" | "starlink" | "gps" | "geo" | null;

export interface TleSet {
  line1: string;
  line2: string;
  name: string;
  noradId: number;
  intlDes?: string;
}

export interface CatalogEntry extends TleSet {
  group: string;
  objectType: ObjectType;
  orbitClass: OrbitClass;
}

export interface SatState {
  noradId: number;
  name: string;
  lat: number;
  lon: number;
  altKm: number;
  velocityKmS: number;
  azimuth?: number;
  elevation?: number;
  eci: { x: number; y: number; z: number };
  velocityEci?: { x: number; y: number; z: number };
}

export interface Observer {
  lat: number;
  lon: number;
  altM: number;
}

export interface Pass {
  noradId: number;
  aos: number;
  los: number;
  maxEl: number;
  maxElTime: number;
}

export interface Conjunction {
  a: number;
  b: number;
  tca: number;
  missKm: number;
  relVelocityKmS: number;
}

export interface SimClock {
  epochMs: number;
  playing: boolean;
  rate: number;
}

export interface CatalogResponse {
  group: string;
  source: CatalogSource;
  updatedAt: string;
  entries: CatalogEntry[];
}

export interface SatDelta {
  rangeKm: number;
  altDeltaKm: number;
  angSepDeg: number;
}
