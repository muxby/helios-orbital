"use client";

import { Locate } from "lucide-react";
import type { Observer } from "@/lib/types";
import { OBSERVER_CITIES, matchCityId } from "@/lib/observers";
import { useHeliosStore } from "@/lib/store";
import { IconButton } from "./IconButton";

type ObserverFormProps = {
  observer: Observer;
  onChange: (observer: Observer) => void;
};

export function ObserverForm({ observer, onChange }: ObserverFormProps) {
  const cityId = useHeliosStore((s) => s.observerCityId);
  const setObserverCity = useHeliosStore((s) => s.setObserverCity);
  const matched = matchCityId(observer.lat, observer.lon);
  const selectValue = cityId === "custom" ? "custom" : matched !== "custom" ? matched : cityId;

  function commit(partial: Partial<Observer>) {
    onChange({ ...observer, ...partial });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        commit({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          altM: pos.coords.altitude ?? observer.altM,
        });
      },
      () => {
        /* operator declined */
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <form
      className="flex min-w-0 flex-wrap items-center gap-2"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Observer location"
    >
      <label className="flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-[var(--muted)]">
        OBS
        <select
          value={selectValue}
          onChange={(e) => {
            const id = e.target.value;
            if (id === "custom") return;
            setObserverCity(id);
          }}
          className="h-7 max-w-[9.5rem] rounded-sm border border-[var(--line)] bg-black/30 px-1 font-mono text-[10px] text-[var(--cyan)] focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none"
          aria-label="Observer city"
        >
          {OBSERVER_CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
          {selectValue === "custom" ? <option value="custom">Custom</option> : null}
        </select>
      </label>
      <label className="flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-[var(--muted)]">
        LAT
        <input
          type="number"
          step="0.0001"
          min={-90}
          max={90}
          value={Number(observer.lat.toFixed(4))}
          onChange={(e) => commit({ lat: Number(e.target.value) })}
          className="h-7 w-[5.5rem] rounded-sm border border-[var(--line)] bg-black/30 px-1.5 font-mono text-[11px] text-[var(--cyan)] tabular-nums focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none"
        />
      </label>
      <label className="flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-[var(--muted)]">
        LON
        <input
          type="number"
          step="0.0001"
          min={-180}
          max={180}
          value={Number(observer.lon.toFixed(4))}
          onChange={(e) => commit({ lon: Number(e.target.value) })}
          className="h-7 w-[5.5rem] rounded-sm border border-[var(--line)] bg-black/30 px-1.5 font-mono text-[11px] text-[var(--cyan)] tabular-nums focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none"
        />
      </label>
      <IconButton label="Use my location" onClick={useMyLocation}>
        <Locate className="h-3.5 w-3.5" />
      </IconButton>
    </form>
  );
}
