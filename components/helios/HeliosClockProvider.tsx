"use client";

import { useEffect } from "react";
import { useHeliosStore } from "@/lib/store";
import { useHeliosUiStore } from "./ui-store";
import { claimClock } from "@/lib/clock-owner";

export function HeliosClockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    claimClock("helios-ui");
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let fpsStamp = last;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frames += 1;
      if (now - fpsStamp >= 500) {
        useHeliosUiStore.getState().setFps(Math.round((frames * 1000) / (now - fpsStamp)));
        frames = 0;
        fpsStamp = now;
      }
      const store = useHeliosStore.getState();
      if (store.clock.playing) {
        store.setClock({
          epochMs: store.clock.epochMs + dt * 1000 * store.clock.rate,
        });
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <>{children}</>;
}
