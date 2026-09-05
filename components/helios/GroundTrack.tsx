"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useHeliosStore } from "@/lib/store";
import { ephemeris } from "./ephemeris";

function splitAntimeridian(pts: number[][]): [number, number, number][][] {
  if (pts.length < 2) return [];
  const segs: [number, number, number][][] = [];
  let cur: [number, number, number][] = [pts[0] as [number, number, number]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i] as [number, number, number];
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

export function GroundTrack() {
  const show = useHeliosStore((s) => s.showGroundTrack);
  const last = useRef(-1);
  const [segs, setSegs] = useState<[number, number, number][][]>([]);

  useFrame(() => {
    if (!show) return;
    if (ephemeris.version === last.current) return;
    last.current = ephemeris.version;
    if (ephemeris.ground.length > 2) setSegs(splitAntimeridian(ephemeris.ground));
  });

  if (!show || segs.length === 0) return null;

  return (
    <group>
      {segs.map((seg, i) => (
        <Line
          key={i}
          points={seg}
          color="#f5a524"
          lineWidth={1}
          transparent
          opacity={0.55}
        />
      ))}
    </group>
  );
}
