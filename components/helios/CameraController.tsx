"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useHeliosStore } from "@/lib/store";
import { ephemeris } from "./ephemeris";
import { latLonAltToXYZ } from "./geo";

type ControlsApi = {
  target: THREE.Vector3;
  update: () => void;
};

const HOME_CAM = new THREE.Vector3(0, 0.48, 2.9);
const MIN_ORIGIN = 1.78;

export function CameraController() {
  const controls = useRef<ControlsApi | null>(null);
  const focusGen = useHeliosStore((s) => s.cameraFocusGen);
  const focusNorad = useHeliosStore((s) => s.cameraFocusNorad);
  const cameraPreset = useHeliosStore((s) => s.cameraPreset);
  const cameraHomeGen = useHeliosStore((s) => s.cameraHomeGen);
  const { camera } = useThree();
  const lerping = useRef(false);
  const target = useRef(new THREE.Vector3());
  const camGoal = useRef(new THREE.Vector3(0, 0.48, 2.9));
  const satPos = useRef(new THREE.Vector3());

  useEffect(() => {
    camGoal.current.copy(HOME_CAM);
    target.current.set(0, 0, 0);
    lerping.current = true;
  }, [cameraHomeGen]);

  useEffect(() => {
    if (cameraPreset === "iss" || cameraPreset === null) return;
    const dist = cameraPreset === "geo" ? 4.4 : cameraPreset === "gps" ? 3.5 : 2.4;
    const y = cameraPreset === "geo" ? 0.12 : 0.48;
    camGoal.current.set(0, y, dist);
    target.current.set(0, 0, 0);
    lerping.current = true;
  }, [cameraPreset]);

  useEffect(() => {
    if (!focusNorad && cameraPreset !== "iss") return;
    const sat = ephemeris.selected;
    if (!sat) return;
    if (focusNorad && sat.noradId !== focusNorad && cameraPreset !== "iss") return;
    const p = latLonAltToXYZ(sat.lat, sat.lon, sat.altKm);
    satPos.current.set(p.x, p.y, p.z);
    const radial = Math.max(2.55, satPos.current.length() + 1.35);
    camGoal.current.copy(satPos.current).normalize().multiplyScalar(radial);
    target.current.copy(satPos.current).multiplyScalar(0.12);
    lerping.current = true;
  }, [focusGen, focusNorad, cameraPreset]);

  useFrame((_, dt) => {
    if (lerping.current && controls.current) {
      const k = 1 - Math.exp(-dt * 3.4);
      camera.position.lerp(camGoal.current, k);
      controls.current.target.lerp(target.current, k);
      controls.current.update();
      if (camera.position.distanceTo(camGoal.current) < 0.03) lerping.current = false;
    }
    const len = camera.position.length();
    if (len < MIN_ORIGIN) {
      camera.position.multiplyScalar(MIN_ORIGIN / len);
      controls.current?.update();
    }
  });

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.65}
      maxDistance={9}
      enablePan={false}
    />
  );
}
