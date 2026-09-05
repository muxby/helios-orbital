import * as satellite from "satellite.js";
import type { Observer, SatState } from "./types";

const WGS84_A = 6378.137;
const WGS84_E2 = 6.69437999014e-3;

export function geodeticToEcef(latDeg: number, lonDeg: number, altKm: number) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  const x = (n + altKm) * cosLat * Math.cos(lon);
  const y = (n + altKm) * cosLat * Math.sin(lon);
  const z = (n * (1 - WGS84_E2) + altKm) * sinLat;
  return { x, y, z };
}

export function eciToGeodetic(
  eci: { x: number; y: number; z: number },
  date: Date,
) {
  const gd = satellite.eciToGeodetic(eci, satellite.gstime(date));
  return {
    lat: satellite.degreesLat(gd.latitude),
    lon: satellite.degreesLong(gd.longitude),
    altKm: gd.height,
  };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371.0088;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = p2 - p1;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function slantRangeKm(state: SatState, observer: Observer): number {
  const sat = geodeticToEcef(state.lat, state.lon, state.altKm);
  const obs = geodeticToEcef(observer.lat, observer.lon, observer.altM / 1000);
  return Math.hypot(sat.x - obs.x, sat.y - obs.y, sat.z - obs.z);
}

export function eciRangeKm(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function angularSepDeg(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  const na = Math.hypot(a.x, a.y, a.z);
  const nb = Math.hypot(b.x, b.y, b.z);
  if (na < 1e-9 || nb < 1e-9) return 0;
  const c = (a.x * b.x + a.y * b.y + a.z * b.z) / (na * nb);
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

export function elevationAzimuth(
  positionEci: { x: number; y: number; z: number },
  observer: Observer,
  date: Date,
): { elevation: number; azimuth: number } {
  const gmst = satellite.gstime(date);
  const positionEcf = satellite.eciToEcf(positionEci, gmst);
  const observerGd = {
    longitude: (observer.lon * Math.PI) / 180,
    latitude: (observer.lat * Math.PI) / 180,
    height: observer.altM / 1000,
  };
  const look = satellite.ecfToLookAngles(observerGd, positionEcf);
  const az = (look.azimuth * 180) / Math.PI;
  return {
    elevation: (look.elevation * 180) / Math.PI,
    azimuth: ((az % 360) + 360) % 360,
  };
}

const OMEGA_EARTH = 7.2921151467e-5;

export function rangeRateKmS(
  satEci: { x: number; y: number; z: number },
  satVelEci: { x: number; y: number; z: number },
  observer: Observer,
  date: Date,
): number {
  const gmst = satellite.gstime(date);
  const obsEcf = geodeticToEcef(observer.lat, observer.lon, observer.altM / 1000);
  const obsEci = satellite.ecfToEci(obsEcf, gmst);
  const vObs = {
    x: -OMEGA_EARTH * obsEci.y,
    y: OMEGA_EARTH * obsEci.x,
    z: 0,
  };
  const dx = satEci.x - obsEci.x;
  const dy = satEci.y - obsEci.y;
  const dz = satEci.z - obsEci.z;
  const r = Math.hypot(dx, dy, dz);
  if (r < 1e-6) return 0;
  const dvx = satVelEci.x - vObs.x;
  const dvy = satVelEci.y - vObs.y;
  const dvz = satVelEci.z - vObs.z;
  return (dx * dvx + dy * dvy + dz * dvz) / r;
}
