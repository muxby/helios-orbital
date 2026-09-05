"use client";

import { useEffect } from "react";
import { useHeliosStore } from "@/lib/store";

export function HydrateHelios() {
  const reducedMotion = useHeliosStore((s) => s.reducedMotion);

  useEffect(() => {
    useHeliosStore.getState().hydrateFromUrl();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
  }, [reducedMotion]);

  return null;
}
