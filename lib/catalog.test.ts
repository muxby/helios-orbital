import { describe, expect, it } from "vitest";
import * as satellite from "satellite.js";
import { catalogFromGp, gpRowToEntry } from "./catalog";
import { tleChecksum, tleFromGp } from "./tle";

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

describe("Celestrak GP JSON → TLE", () => {
  it("builds checksummed lines satellite.js accepts", () => {
    const tle = tleFromGp(ISS_GP);
    expect(tle).not.toBeNull();
    expect(tle!.line1).toHaveLength(69);
    expect(tle!.line2).toHaveLength(69);
    expect(tleChecksum(tle!.line1.slice(0, 68))).toBe(Number(tle!.line1[68]));
    expect(tleChecksum(tle!.line2.slice(0, 68))).toBe(Number(tle!.line2[68]));
    const rec = satellite.twoline2satrec(tle!.line1, tle!.line2);
    expect(rec.error).toBe(0);
  });

  it("maps a GP row with no TLE_LINE* into ISS", () => {
    const entry = gpRowToEntry(ISS_GP, "stations");
    expect(entry?.noradId).toBe(25544);
    expect(entry?.name).toContain("ISS");
    expect(entry?.orbitClass).toBe("LEO");
    const rec = satellite.twoline2satrec(entry!.line1, entry!.line2);
    const pv = satellite.propagate(rec, new Date("2026-08-29T12:44:13.287Z"));
    if (!pv || typeof pv.position === "boolean" || !pv.position) {
      throw new Error("propagate failed");
    }
    const pos = pv.position;
    const r = Math.hypot(pos.x, pos.y, pos.z);
    expect(r).toBeGreaterThan(6600);
    expect(r).toBeLessThan(6800);
  });

  it("does not drop a live stations payload", () => {
    const entries = catalogFromGp([ISS_GP], "stations");
    expect(entries).toHaveLength(1);
    expect(entries[0].noradId).toBe(25544);
  });
});
