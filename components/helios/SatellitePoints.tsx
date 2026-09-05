"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useHeliosStore } from "@/lib/store";
import { useHeliosUiStore } from "./ui-store";
import { ephemeris } from "./ephemeris";

export function SatellitePoints() {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const pointsRef = useRef<THREE.Points>(null);

  useLayoutEffect(() => {
    const geo = geomRef.current;
    if (!geo) return;
    geo.setAttribute("position", new THREE.BufferAttribute(ephemeris.positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(ephemeris.colors, 3));
  }, []);

  useFrame(() => {
    const geo = geomRef.current;
    if (!geo) return;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
    const col = geo.getAttribute("color") as THREE.BufferAttribute | undefined;
    if (pos) pos.needsUpdate = true;
    if (col) col.needsUpdate = true;
    geo.setDrawRange(0, ephemeris.count);
  });

  function onMove(e: ThreeEvent<PointerEvent>) {
    const i = e.index;
    if (i == null || i >= ephemeris.count) return;
    e.stopPropagation();
    useHeliosStore.getState().setHovered(ephemeris.ids[i]);
    useHeliosUiStore.getState().setHover({
      noradId: ephemeris.ids[i],
      name: ephemeris.names[i],
      altKm: ephemeris.alts[i],
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
    });
  }

  function onOut() {
    useHeliosStore.getState().setHovered(null);
    useHeliosUiStore.getState().setHover(null);
  }

  function onClick(e: ThreeEvent<MouseEvent>) {
    const i = e.index;
    if (i == null || i >= ephemeris.count) return;
    e.stopPropagation();
    useHeliosStore.getState().setSelected(ephemeris.ids[i]);
  }

  function onDoubleClick(e: ThreeEvent<MouseEvent>) {
    const i = e.index;
    if (i == null || i >= ephemeris.count) return;
    e.stopPropagation();
    const id = ephemeris.ids[i];
    const store = useHeliosStore.getState();
    store.setSelected(id);
    store.focusCamera(id);
  }

  return (
    <points
      ref={pointsRef}
      frustumCulled={false}
      onPointerMove={onMove}
      onPointerOut={onOut}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <bufferGeometry ref={geomRef} />
      <pointsMaterial
        vertexColors
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        transparent
        opacity={0.95}
        toneMapped={false}
      />
    </points>
  );
}
