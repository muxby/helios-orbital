import { describe, expect, it } from "vitest";
import * as satellite from "satellite.js";
import { tleFromGp, tleChecksum } from "./tle";
import { tleEpochMs, tleAgeDays, isTleStale, keplerianFromTle } from "./tle";
import { eclipseKind, isEclipsed } from "./eclipse";
import { elevationAzimuth, geodeticToEcef, rangeRateKmS } from "./coords";
import { footprintCentralAngleRad, footprintGroundRangeKm, footprintRing } from "./coverage";
import { DEFAULT_CITY_ID, OBSERVER_CITIES, matchCityId } from "./observers";
import { parseHeliosSearch } from "./share";
import { sameStackPair } from "./conjunction";
import type { CatalogEntry } from "./types";

const ISS_GP = {
  OBJECT_NAME: "ISS (ZARYA)",
  OBJECT_ID: "1998-067A",
  EPOCH: "2026-08-29T12:44:13.287840",
  MEAN_MOTION: 15.48928101,
  ECCENTRICITY: 0.00050015,
  INCLINATION: 51.6318,
  RA_OF_ASC_NODE: 297.0786,
  ARG_OF_PERICENTER: 87.3553,
  MEAN_ANOMALY: 272.8007,
  EPHEMERIS_TYPE: 0,
  CLASSIFICATION_TYPE: "U",
  NORAD_CAT_ID: 25544,
  ELEMENT_SET_NO: 999,
  REV_AT_EPOCH: 58312,
  BSTAR: 0.00011827032,
  MEAN_MOTION_DOT: 6.055e-5,
  MEAN_MOTION_DDOT: 0,
};

function entry(name: string, norad: number): CatalogEntry {
  return {
    name,
    noradId: norad,
    line1: "",
    line2: "",
    group: "stations",
    objectType: "payload",
    orbitClass: "LEO",
  };
}

describe("tleFromGp checksum/parse", () => {
  it("emits 69-char lines whose last digit is the checksum", () => {
    const tle = tleFromGp(ISS_GP);
    expect(tle).not.toBeNull();
    expect(tle!.line1).toHaveLength(69);
    expect(tle!.line2).toHaveLength(69);
    expect(tleChecksum(tle!.line1.slice(0, 68))).toBe(Number(tle!.line1[68]));
    expect(tleChecksum(tle!.line2.slice(0, 68))).toBe(Number(tle!.line2[68]));
    expect(satellite.twoline2satrec(tle!.line1, tle!.line2).error).toBe(0);
  });

  it("rejects a GP row with no epoch", () => {
    expect(tleFromGp({ ...ISS_GP, EPOCH: undefined })).toBeNull();
  });
});

describe("stale TLE", () => {
  const fresh = "1 25544U 98067A   26241.00000000  .00000000  00000-0  00000-0 0  1009";
  const old = "1 25544U 98067A   20001.00000000  .00000000  00000-0  00000-0 0  1001";
  const clock = Date.UTC(2026, 7, 30);

  it("parses epoch from line 1", () => {
    const ms = tleEpochMs(fresh);
    expect(ms).not.toBeNull();
    const d = new Date(ms!);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7);
  });

  it("flags TLEs more than 7 days from the sim clock", () => {
    expect(isTleStale(fresh, clock, 7)).toBe(false);
    expect(isTleStale(old, clock, 7)).toBe(true);
    expect(Math.abs(tleAgeDays(old, clock)!)).toBeGreaterThan(7);
  });
});

describe("keplerian elements", () => {
  const leo2 = "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50400001010006";

  it("reads inc/ecc/raan/argp/n and LEO altitudes", () => {
    const k = keplerianFromTle(leo2);
    expect(k.inclinationDeg).toBeCloseTo(51.6416, 3);
    expect(k.eccentricity).toBeCloseTo(0.0006703, 6);
    expect(k.raanDeg).toBeCloseTo(247.4627, 3);
    expect(k.argPerigeeDeg).toBeCloseTo(130.536, 3);
    expect(k.meanMotionRevPerDay).toBeCloseTo(15.504, 4);
    expect(k.periodMin).toBeGreaterThan(90);
    expect(k.periodMin).toBeLessThan(95);
    expect(k.perigeeKm).toBeGreaterThan(350);
    expect(k.perigeeKm).toBeLessThan(450);
    expect(k.apogeeKm).toBeGreaterThan(k.perigeeKm - 1);
  });
});

describe("eclipse", () => {
  const sun = { x: 1, y: 0, z: 0 };

  it("umbra when sat sits in the night-side cylinder", () => {
    expect(eclipseKind({ x: -7000, y: 0, z: 0 }, sun)).toBe("umbra");
    expect(isEclipsed({ x: -7000, y: 0, z: 0 }, sun)).toBe(true);
  });

  it("sunlit on the day side", () => {
    expect(eclipseKind({ x: 7000, y: 0, z: 0 }, sun)).toBe("sunlit");
    expect(isEclipsed({ x: 7000, y: 0, z: 0 }, sun)).toBe(false);
  });
});

describe("az/el range", () => {
  it("zenith sat over observer is near 90 el and az in [0,360)", () => {
    const date = new Date("2026-08-30T00:00:00Z");
    const gmst = satellite.gstime(date);
    const obs = { lat: 0, lon: 0, altM: 0 };
    const satEcf = geodeticToEcef(0, 0, 400);
    const satEci = satellite.ecfToEci(satEcf, gmst);
    const look = elevationAzimuth(satEci, obs, date);
    expect(look.elevation).toBeGreaterThan(80);
    expect(look.elevation).toBeLessThanOrEqual(90);
    expect(look.azimuth).toBeGreaterThanOrEqual(0);
    expect(look.azimuth).toBeLessThan(360);
  });

  it("horizon-ish sat has lower elevation than zenith", () => {
    const date = new Date("2026-08-30T00:00:00Z");
    const gmst = satellite.gstime(date);
    const obs = { lat: 0, lon: 0, altM: 0 };
    const satEcf = geodeticToEcef(20, 0, 400);
    const satEci = satellite.ecfToEci(satEcf, gmst);
    const look = elevationAzimuth(satEci, obs, date);
    expect(look.elevation).toBeLessThan(80);
    expect(look.azimuth).toBeGreaterThanOrEqual(0);
    expect(look.azimuth).toBeLessThan(360);
  });

  it("range-rate is finite along the line of sight", () => {
    const date = new Date("2026-08-30T00:00:00Z");
    const gmst = satellite.gstime(date);
    const obs = { lat: 0, lon: 0, altM: 0 };
    const satEcf = geodeticToEcef(0, 0, 400);
    const satEci = satellite.ecfToEci(satEcf, gmst);
    const rr = rangeRateKmS(satEci, { x: 0, y: 7.6, z: 0 }, obs, date);
    expect(Number.isFinite(rr)).toBe(true);
  });
});

describe("coverage footprint", () => {
  it("ISS-class 5° mask is a few thousand km across", () => {
    const ang = footprintCentralAngleRad(420, 5);
    expect(ang).toBeGreaterThan(0.2);
    expect(ang).toBeLessThan(0.5);
    const km = footprintGroundRangeKm(420, 5);
    expect(km).toBeGreaterThan(1500);
    expect(km).toBeLessThan(2500);
    expect(footprintRing(0, 0, 420, 5, 24).length).toBe(25);
  });
});

describe("observers", () => {
  it("ships eight cities and Houston as the default", () => {
    expect(OBSERVER_CITIES).toHaveLength(8);
    expect(DEFAULT_CITY_ID).toBe("houston");
    expect(matchCityId(29.7604, -95.3698)).toBe("houston");
    expect(matchCityId(0, 0)).toBe("custom");
  });
});

describe("share URL", () => {
  it("reads norad lat lon t", () => {
    const p = parseHeliosSearch("?norad=25544&lat=42.36&lon=-71.06&t=1730000000000");
    expect(p.norad).toBe(25544);
    expect(p.lat).toBeCloseTo(42.36, 2);
    expect(p.lon).toBeCloseTo(-71.06, 2);
    expect(p.t).toBe(1730000000000);
  });

  it("does not treat missing lat/lon as the equator", () => {
    const p = parseHeliosSearch("?norad=25544");
    expect(p.norad).toBe(25544);
    expect(p.lat).toBeNull();
    expect(p.lon).toBeNull();
    expect(p.t).toBeNull();
  });

  it("keeps an explicit 0,0 observer", () => {
    const p = parseHeliosSearch("?lat=0&lon=0");
    expect(p.lat).toBe(0);
    expect(p.lon).toBe(0);
  });
});

describe("same-stack ISS filter", () => {
  it("hides ISS module pairs, keeps ISS vs CSS", () => {
    expect(sameStackPair(entry("ISS (ZARYA)", 25544), entry("ISS (NAUKA)", 49044))).toBe(true);
    expect(sameStackPair(entry("ISS (ZARYA)", 25544), entry("POISK", 36086))).toBe(true);
    expect(sameStackPair(entry("ISS (ZARYA)", 25544), entry("PROGRESS-MS 33", 68319))).toBe(true);
    expect(sameStackPair(entry("CSS (TIANHE)", 48274), entry("TIANZHOU-10", 69049))).toBe(true);
    expect(sameStackPair(entry("ISS (ZARYA)", 25544), entry("CSS (TIANHE)", 48274))).toBe(false);
  });
});
