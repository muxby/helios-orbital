import { angularSepDeg, eciRangeKm } from "./coords";
import type { SatDelta, SatState } from "./types";

export function compareSats(a: SatState, b: SatState): SatDelta {
  return {
    rangeKm: eciRangeKm(a.eci, b.eci),
    altDeltaKm: a.altKm - b.altKm,
    angSepDeg: angularSepDeg(a.eci, b.eci),
  };
}

export function missLevel(missKm: number): "crit" | "amber" | "nominal" {
  if (missKm < 5) return "crit";
  if (missKm < 20) return "amber";
  return "nominal";
}

export function missToneClass(missKm: number): string {
  const level = missLevel(missKm);
  if (level === "crit") return "text-[var(--crit)]";
  if (level === "amber") return "text-[var(--amber)]";
  return "text-[var(--nominal)]";
}
