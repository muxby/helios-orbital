"use client";

import { useEffect, useRef } from "react";
import { useHeliosStore } from "@/lib/store";
import { groundTrack, propagateMany, visibleSlice } from "@/lib/propagate";
import { filteredCatalog } from "@/lib/store";
import { footprintRing } from "@/lib/coverage";
import { OBJECT_TYPE_HEX } from "@/lib/object-style";

function lonLatToXy(lon: number, lat: number, w: number, h: number) {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

export function MapStrip({ fillFallback = false }: { fillFallback?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const show = useHeliosStore((s) => s.showMap2d);
  const catalog = useHeliosStore((s) => s.catalog);
  const maxRender = useHeliosStore((s) => s.maxRender);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const showGroundTrack = useHeliosStore((s) => s.showGroundTrack);
  const epochMs = useHeliosStore((s) => s.clock.epochMs);
  const orbitClassFilter = useHeliosStore((s) => s.orbitClassFilter);
  const searchQuery = useHeliosStore((s) => s.searchQuery);
  const fill = fillFallback && show;

  useEffect(() => {
    if (!show && !fill) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 960;
    const h = canvas.clientHeight || 160;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(34,211,238,0.08)";
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) {
      const { x } = lonLatToXy(lon, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const { y } = lonLatToXy(0, lat, w, h);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const state = useHeliosStore.getState();
    const list = visibleSlice(
      filteredCatalog({ ...state, catalog, maxRender, orbitClassFilter, searchQuery }),
      maxRender,
    );
    const states = propagateMany(list, new Date(epochMs));
    for (const s of states) {
      const entry = catalog.find((e) => e.noradId === s.noradId);
      ctx.fillStyle =
        s.noradId === selectedNoradId
          ? "#ffffff"
          : entry
            ? OBJECT_TYPE_HEX[entry.objectType]
            : "rgba(34,211,238,0.85)";
      const { x, y } = lonLatToXy(s.lon, s.lat, w, h);
      const r = s.noradId === selectedNoradId ? 3.2 : 1.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (showGroundTrack && selectedNoradId != null) {
      const entry = catalog.find((e) => e.noradId === selectedNoradId);
      if (entry) {
        const track = groundTrack(entry, new Date(epochMs), 90, 45);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        let started = false;
        let prevLon: number | null = null;
        for (const p of track) {
          const { x, y } = lonLatToXy(p.lon, p.lat, w, h);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else if (prevLon != null && Math.abs(p.lon - prevLon) > 180) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          prevLon = p.lon;
        }
        ctx.stroke();
      }
    }

    if (selectedNoradId != null) {
      const sel = states.find((s) => s.noradId === selectedNoradId);
      if (sel) {
        const ring = footprintRing(sel.lat, sel.lon, sel.altKm, 5, 72);
        ctx.strokeStyle = "rgba(52,211,153,0.85)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let started = false;
        let prevLon: number | null = null;
        for (const p of ring) {
          const { x, y } = lonLatToXy(p.lon, p.lat, w, h);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else if (prevLon != null && Math.abs(p.lon - prevLon) > 180) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          prevLon = p.lon;
        }
        ctx.stroke();
      }
    }
  }, [show, fill, catalog, maxRender, selectedNoradId, showGroundTrack, epochMs, orbitClassFilter, searchQuery]);

  if (!show && !fill) return null;

  return (
    <div
      className={
        fill
          ? "pointer-events-auto absolute inset-0 z-0 min-h-[200px]"
          : "pointer-events-auto h-40 min-h-40 w-full border-t border-[var(--line)]"
      }
    >
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Equirectangular satellite map" />
    </div>
  );
}
