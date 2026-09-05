"use client";

import { Camera, Home, Maximize2 } from "lucide-react";
import { useHeliosStore } from "@/lib/store";
import { elevationAzimuth, rangeRateKmS, slantRangeKm } from "@/lib/coords";
import { propagateAt } from "@/lib/propagate";
import { eclipseKindAt } from "@/lib/eclipse";
import { captureHeliosPng, toggleHeliosFullscreen } from "@/lib/capture";
import { formatFixed } from "./format";
import { IconButton } from "./IconButton";

export function SelectionHud() {
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const catalog = useHeliosStore((s) => s.catalog);
  const epochMs = useHeliosStore((s) => s.clock.epochMs);
  const observer = useHeliosStore((s) => s.observer);
  const resetCamera = useHeliosStore((s) => s.resetCamera);
  const entry = catalog.find((s) => s.noradId === selectedNoradId) ?? null;
  const when = new Date(epochMs);
  const state = entry ? (propagateAt(entry, when, observer) ?? null) : null;
  const look = state ? elevationAzimuth(state.eci, observer, when) : null;
  const slant = state ? slantRangeKm(state, observer) : Number.NaN;
  const rate =
    state?.velocityEci != null
      ? rangeRateKmS(state.eci, state.velocityEci, observer, when)
      : Number.NaN;
  const eclipse = state ? eclipseKindAt(state.eci, when) : "sunlit";

  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
      <div className="pointer-events-auto flex gap-1">
        <IconButton label="Home camera (H)" onClick={() => resetCamera()}>
          <Home className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Fullscreen (F)" onClick={() => toggleHeliosFullscreen()}>
          <Maximize2 className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton
          label="Screenshot"
          onClick={() => captureHeliosPng(useHeliosStore.getState().selectedNoradId)}
        >
          <Camera className="h-3.5 w-3.5" />
        </IconButton>
      </div>
      {state ? (
        <div className="pointer-events-none rounded-sm border border-[var(--line)] bg-[#070b14]/80 px-2 py-1 font-mono text-[10px] tabular-nums text-[var(--cyan)] backdrop-blur-sm">
          <span>R {formatFixed(slant, 0, " km")}</span>
          <span className="mx-2 text-[var(--muted)]">·</span>
          <span>Ṙ {formatFixed(rate, 3, " km/s")}</span>
          {look ? (
            <>
              <span className="mx-2 text-[var(--muted)]">·</span>
              <span>
                AZ {formatFixed(look.azimuth, 0)} EL {formatFixed(look.elevation, 0)}
              </span>
            </>
          ) : null}
          {eclipse !== "sunlit" ? (
            <span className="ml-2 text-[var(--amber)]">ECLIPSED</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
