import type { SatState } from "@/lib/types";

export type HoverInfo = {
  noradId: number;
  name: string;
  altKm: number;
  x: number;
  y: number;
};

const MAX = 800;

export const ephemeris = {
  count: 0,
  positions: new Float32Array(MAX * 3),
  colors: new Float32Array(MAX * 3),
  ids: new Int32Array(MAX),
  names: Array.from({ length: MAX }, () => ""),
  alts: new Float32Array(MAX),
  selected: null as SatState | null,
  orbit: [] as number[][],
  ground: [] as number[][],
  version: 0,
};

export function resetEphemerisBuffers(maxRender: number) {
  const n = Math.max(50, Math.min(MAX, maxRender));
  if (ephemeris.positions.length < n * 3) {
    ephemeris.positions = new Float32Array(n * 3);
    ephemeris.colors = new Float32Array(n * 3);
    ephemeris.ids = new Int32Array(n);
    ephemeris.names = Array.from({ length: n }, () => "");
    ephemeris.alts = new Float32Array(n);
  }
}
