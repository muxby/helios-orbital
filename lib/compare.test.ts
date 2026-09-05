import { describe, expect, it } from "vitest";
import { angularSepDeg, eciRangeKm, haversineKm } from "./coords";
import { compareSats, missLevel } from "./compare";
import type { SatState } from "./types";

function sat(partial: Partial<SatState> & { eci: SatState["eci"] }): SatState {
  return {
    noradId: 1,
    name: "A",
    lat: 0,
    lon: 0,
    altKm: 400,
    velocityKmS: 7.6,
    ...partial,
  };
}

describe("missLevel", () => {
  it("colors <5km crit, <20km amber, else nominal", () => {
    expect(missLevel(4.9)).toBe("crit");
    expect(missLevel(5)).toBe("amber");
    expect(missLevel(19.9)).toBe("amber");
    expect(missLevel(20)).toBe("nominal");
  });
});

describe("compare math", () => {
  it("orthogonal ECI vectors are 90 deg apart", () => {
    expect(angularSepDeg({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBeCloseTo(90, 8);
  });

  it("range is Euclidean in km", () => {
    expect(eciRangeKm({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBeCloseTo(5);
  });

  it("compareSats range and alt delta", () => {
    const a = sat({ altKm: 420, eci: { x: 7000, y: 0, z: 0 } });
    const b = sat({ noradId: 2, name: "B", altKm: 400, eci: { x: 7000, y: 10, z: 0 } });
    const d = compareSats(a, b);
    expect(d.rangeKm).toBeCloseTo(10);
    expect(d.altDeltaKm).toBeCloseTo(20);
  });
});

describe("haversine", () => {
  it("1 deg at equator is about 111.2 km", () => {
    expect(haversineKm(0, 0, 0, 1)).toBeGreaterThan(110);
    expect(haversineKm(0, 0, 0, 1)).toBeLessThan(112.5);
  });
});
