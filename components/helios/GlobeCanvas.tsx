"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useHeliosStore } from "@/lib/store";
import type { CatalogEntry } from "@/lib/types";
import { propagateAt, propagateMany, orbitSamples, groundTrack } from "@/lib/propagate";
import { Earth } from "./Earth";
import { SatellitePoints } from "./SatellitePoints";
import { OrbitPath } from "./OrbitPath";
import { GroundTrack } from "./GroundTrack";
import { SelectionMarker } from "./SelectionMarker";
import { CameraController } from "./CameraController";
import { CoverageFootprint } from "./CoverageFootprint";
import { ephemeris, resetEphemerisBuffers } from "./ephemeris";
import { latLonAltToXYZ } from "./geo";
import { OBJECT_TYPE_RGB } from "@/lib/object-style";

function pickVisible(
  catalog: CatalogEntry[],
  maxRender: number,
  selected: number | null,
  watchlist: number[],
): CatalogEntry[] {
  const cap = Math.max(50, Math.min(800, maxRender));
  const picked: CatalogEntry[] = [];
  const seen = new Set<number>();
  const add = (entry?: CatalogEntry) => {
    if (!entry || seen.has(entry.noradId) || picked.length >= cap) return;
    seen.add(entry.noradId);
    picked.push(entry);
  };
  add(catalog.find((c) => c.noradId === selected));
  for (const id of watchlist) add(catalog.find((c) => c.noradId === id));
  for (const entry of catalog) add(entry);
  return picked;
}

function writePoint(
  i: number,
  lat: number,
  lon: number,
  altKm: number,
  color: [number, number, number],
  noradId: number,
  name: string,
) {
  const p = latLonAltToXYZ(lat, lon, altKm);
  const o = i * 3;
  ephemeris.positions[o] = p.x;
  ephemeris.positions[o + 1] = p.y;
  ephemeris.positions[o + 2] = p.z;
  ephemeris.colors[o] = color[0];
  ephemeris.colors[o + 1] = color[1];
  ephemeris.colors[o + 2] = color[2];
  ephemeris.ids[i] = noradId;
  ephemeris.names[i] = name;
  ephemeris.alts[i] = altKm;
}

function EphemerisTicker() {
  const lastFull = useRef(0);
  const lastOrbit = useRef(0);
  const visRef = useRef<CatalogEntry[]>([]);

  useFrame(() => {
    const store = useHeliosStore.getState();
    const when = new Date(store.clock.epochMs);
    const selectedId = store.selectedNoradId;
    const selected = store.catalog.find((c) => c.noradId === selectedId) ?? null;

    if (selected) {
      try {
        const s = propagateAt?.(selected, when) ?? null;
        ephemeris.selected = s;
      } catch {
        ephemeris.selected = null;
      }
    } else {
      ephemeris.selected = null;
    }

    const now = performance.now();
    if (now - lastFull.current > 500 || visRef.current.length === 0) {
      lastFull.current = now;
      resetEphemerisBuffers(store.maxRender);
      visRef.current = pickVisible(
        store.catalog,
        store.maxRender,
        selectedId,
        store.watchlist,
      );
      let states = [] as ReturnType<NonNullable<typeof propagateMany>>;
      try {
        states = propagateMany?.(visRef.current, when) ?? [];
      } catch {
        states = [];
      }
      const byId = new Map(states.map((s) => [s.noradId, s]));
      let count = 0;
      for (const entry of visRef.current) {
        let st = byId.get(entry.noradId);
        if (!st) {
          try {
            st = propagateAt?.(entry, when) ?? undefined;
          } catch {
            st = undefined;
          }
        }
        if (!st) continue;
        const isSel = st.noradId === selectedId;
        const watched = store.watchlist.includes(st.noradId);
        const base = OBJECT_TYPE_RGB[entry.objectType] ?? OBJECT_TYPE_RGB.unknown;
        const color: [number, number, number] = isSel
          ? [1, 1, 1]
          : watched
            ? [1, 0.92, 0.55]
            : base;
        writePoint(count, st.lat, st.lon, st.altKm, color, st.noradId, st.name);
        count += 1;
      }
      ephemeris.count = count;
    }

    if (selected && now - lastOrbit.current > 700) {
      lastOrbit.current = now;
      try {
        const samples = orbitSamples?.(selected, when, 96) ?? [];
        ephemeris.orbit = samples.map((p) => {
          const v = latLonAltToXYZ(p.lat, p.lon, p.altKm);
          return [v.x, v.y, v.z];
        });
        if (store.showGroundTrack) {
          const track = groundTrack?.(selected, when, 96, 45) ?? [];
          ephemeris.ground = track.map((p) => {
            const v = latLonAltToXYZ(p.lat, p.lon, 18);
            return [v.x, v.y, v.z];
          });
        } else {
          ephemeris.ground = [];
        }
        ephemeris.version += 1;
      } catch {
        ephemeris.orbit = [];
        ephemeris.ground = [];
      }
    }

    if (ephemeris.selected && selectedId != null) {
      const i = ephemeris.ids.indexOf(selectedId);
      if (i >= 0 && i < ephemeris.count) {
        writePoint(
          i,
          ephemeris.selected.lat,
          ephemeris.selected.lon,
          ephemeris.selected.altKm,
          [1, 1, 1],
          ephemeris.selected.noradId,
          ephemeris.selected.name,
        );
      }
    }
  });

  return null;
}

export default function GlobeCanvas() {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      camera={{ position: [0, 0.48, 2.9], fov: 42, near: 0.08, far: 200 }}
      dpr={[1, 1.75]}
      raycaster={{
        params: {
          Mesh: {},
          Line: { threshold: 0.1 },
          LOD: {},
          Points: { threshold: 0.045 },
          Sprite: {},
        },
      }}
      style={{ width: "100%", height: "100%", background: "#070b14" }}
    >
      <color attach="background" args={["#070b14"]} />
      <Stars radius={90} depth={42} count={5000} factor={2.8} saturation={0} fade speed={0.35} />
      <Earth />
      <EphemerisTicker />
      <SatellitePoints />
      <OrbitPath />
      <GroundTrack />
      <CoverageFootprint />
      <SelectionMarker />
      <CameraController />
    </Canvas>
  );
}
