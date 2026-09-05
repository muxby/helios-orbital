import { EARTH_RADIUS_KM } from "./constants";

export type Vec3 = { x: number; y: number; z: number };

export function latLonAltToXYZ(lat: number, lon: number, altKm: number): Vec3 {
  const r = 1 + altKm / EARTH_RADIUS_KM;
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    z: r * Math.sin(phi) * Math.sin(theta),
    y: r * Math.cos(phi),
  };
}

export function subsolarDirection(epochMs: number): Vec3 {
  const date = new Date(epochMs);
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (epochMs - start) / 86_400_000;
  const lat = 23.44 * Math.sin((2 * Math.PI * (day - 81)) / 365);
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lon = 180 - utcHours * 15;
  const v = latLonAltToXYZ(lat, lon, 0);
  const n = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = EARTH_RADIUS_KM;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function elevationDeg(
  obsLat: number,
  obsLon: number,
  obsAltM: number,
  satLat: number,
  satLon: number,
  satAltKm: number,
): number {
  const obs = geodeticToEcef(obsLat, obsLon, obsAltM / 1000);
  const sat = geodeticToEcef(satLat, satLon, satAltKm);
  const rx = sat.x - obs.x;
  const ry = sat.y - obs.y;
  const rz = sat.z - obs.z;
  const range = Math.hypot(rx, ry, rz);
  if (range < 1e-6) return 90;
  const obsNorm = Math.hypot(obs.x, obs.y, obs.z);
  const dot = (rx * obs.x + ry * obs.y + rz * obs.z) / (range * obsNorm);
  return 90 - (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
}

export function azimuthDeg(
  obsLat: number,
  obsLon: number,
  satLat: number,
  satLon: number,
): number {
  const φ1 = (obsLat * Math.PI) / 180;
  const φ2 = (satLat * Math.PI) / 180;
  const Δλ = ((satLon - obsLon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function geodeticToEcef(lat: number, lon: number, altKm: number) {
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const r = EARTH_RADIUS_KM + altKm;
  return {
    x: r * Math.cos(φ) * Math.cos(λ),
    y: r * Math.cos(φ) * Math.sin(λ),
    z: r * Math.sin(φ),
  };
}
