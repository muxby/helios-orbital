"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { footprintRing } from "@/lib/coverage";
import { ephemeris } from "./ephemeris";
import { latLonAltToXYZ } from "./geo";

function splitAntimeridian(pts: [number, number, number][]): [number, number, number][][] {
  if (pts.length < 2) return [];
  const segs: [number, number, number][][] = [];
  let cur: [number, number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const jump = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (jump > 0.55) {
      if (cur.length > 1) segs.push(cur);
      cur = [b];
    } else {
      cur.push(b);
    }
  }
  if (cur.length > 1) segs.push(cur);
  return segs;
}

export function CoverageFootprint() {
  const last = useRef(0);
  const [segs, setSegs] = useState<[number, number, number][][]>([]);

  useFrame(() => {
    const now = performance.now();
    if (now - last.current < 220) return;
    last.current = now;
    const sat = ephemeris.selected;
    if (!sat) {
      if (segs.length) setSegs([]);
      return;
    }
    const ring = footprintRing(sat.lat, sat.lon, sat.altKm, 5, 96);
    const pts: [number, number, number][] = ring.map((p) => {
      const v = latLonAltToXYZ(p.lat, p.lon, 22);
      return [v.x, v.y, v.z];
    });
    setSegs(splitAntimeridian(pts));
  });

  if (segs.length === 0) return null;

  return (
    <group>
      {segs.map((seg, i) => (
        <Line
          key={i}
          points={seg}
          color="#34d399"
          lineWidth={1.15}
          transparent
          opacity={0.72}
        />
      ))}
    </group>
  );
}
