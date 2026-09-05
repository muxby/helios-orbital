"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { ephemeris } from "./ephemeris";

export function OrbitPath() {
  const last = useRef(-1);
  const [points, setPoints] = useState<[number, number, number][]>([
    [0, 0, 0],
    [0, 0.01, 0],
  ]);

  useFrame(() => {
    if (ephemeris.version === last.current) return;
    last.current = ephemeris.version;
    if (ephemeris.orbit.length > 2) {
      setPoints(ephemeris.orbit as [number, number, number][]);
    }
  });

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color="#22d3ee"
      lineWidth={1.25}
      transparent
      opacity={0.85}
    />
  );
}
