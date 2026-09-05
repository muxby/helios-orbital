"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useHeliosStore } from "@/lib/store";
import { ephemeris } from "./ephemeris";
import { latLonAltToXYZ } from "./geo";

export function SelectionMarker() {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const linePos = useRef(new Float32Array(6));
  const lineAttr = useRef(new THREE.BufferAttribute(linePos.current, 3));
  const tmpSat = useRef(new THREE.Vector3());
  const tmpGnd = useRef(new THREE.Vector3());
  const showLabels = useHeliosStore((s) => s.showLabels);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const catalog = useHeliosStore((s) => s.catalog);
  const entry = catalog.find((s) => s.noradId === selectedNoradId);

  useFrame(({ clock }) => {
    const sat = ephemeris.selected;
    if (!sat || !group.current) {
      if (group.current) group.current.visible = false;
      return;
    }
    group.current.visible = true;
    const satP = latLonAltToXYZ(sat.lat, sat.lon, sat.altKm);
    const gndP = latLonAltToXYZ(sat.lat, sat.lon, 0);
    tmpSat.current.set(satP.x, satP.y, satP.z);
    tmpGnd.current.set(gndP.x, gndP.y, gndP.z);
    group.current.position.copy(tmpSat.current);
    if (glow.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.15;
      glow.current.scale.setScalar(pulse);
    }
    linePos.current[0] = tmpGnd.current.x - tmpSat.current.x;
    linePos.current[1] = tmpGnd.current.y - tmpSat.current.y;
    linePos.current[2] = tmpGnd.current.z - tmpSat.current.z;
    linePos.current[3] = 0;
    linePos.current[4] = 0;
    linePos.current[5] = 0;
    lineAttr.current.needsUpdate = true;
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={glow}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color="#f8feff" toneMapped={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.018, 0.024, 24]} />
        <meshBasicMaterial color="#22d3ee" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <line>
        <bufferGeometry>
          <primitive object={lineAttr.current} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.4} />
      </line>
      {showLabels && entry ? (
        <Html position={[0, 0.04, 0]} center style={{ pointerEvents: "none" }} occlude={false}>
          <div className="rounded-sm border border-cyan-400/40 bg-[#070b14]/85 px-1.5 py-0.5 font-mono text-[10px] tracking-wide whitespace-nowrap text-cyan-300">
            {entry.name}
          </div>
        </Html>
      ) : null}
    </group>
  );
}
