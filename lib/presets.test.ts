import { describe, expect, it } from "vitest";
import { CONSTELLATION_PRESETS } from "./presets";
import { formatDuration } from "./time";
import { classifyOrbit, noradFromLine1 } from "./tle";

describe("constellation presets", () => {
  it("ISS preset targets 25544 and stations group", () => {
    const iss = CONSTELLATION_PRESETS.find((p) => p.id === "iss");
    expect(iss?.norad).toBe(25544);
    expect(iss?.group).toBe("stations");
  });

  it("covers Starlink GPS GEO", () => {
    expect(CONSTELLATION_PRESETS.map((p) => p.id).sort()).toEqual(
      ["geo", "gps", "iss", "starlink"].sort(),
    );
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(5_000)).toBe("5s");
    expect(formatDuration(90_000)).toBe("1m 30s");
    expect(formatDuration(3_600_000)).toBe("1h 00m");
  });
});

describe("tle helpers", () => {
  const iss1 = "1 25544U 98067A   26241.00000000  .00000000  00000-0  00000-0 0  1009";
  const leo2 = "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50400001010006";
  const geo2 = "2 41866   0.0800  80.0000 0002000  10.0000  80.0000  1.00270000001012";

  it("reads NORAD from line 1", () => {
    expect(noradFromLine1(iss1)).toBe(25544);
  });

  it("classifies LEO vs GEO by period", () => {
    expect(classifyOrbit(leo2)).toBe("LEO");
    expect(classifyOrbit(geo2)).toBe("GEO");
  });
});
