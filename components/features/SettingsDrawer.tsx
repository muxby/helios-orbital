"use client";

import { Panel } from "./Panel";
import { useFeatureUi } from "@/lib/feature-ui";
import { useHeliosStore } from "@/lib/store";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2 text-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SettingsDrawer() {
  const panel = useFeatureUi((s) => s.panel);
  const setPanel = useFeatureUi((s) => s.setPanel);
  const maxRender = useHeliosStore((s) => s.maxRender);
  const showLabels = useHeliosStore((s) => s.showLabels);
  const showGroundTrack = useHeliosStore((s) => s.showGroundTrack);
  const showTerminator = useHeliosStore((s) => s.showTerminator);
  const reducedMotion = useHeliosStore((s) => s.reducedMotion);
  const showMap2d = useHeliosStore((s) => s.showMap2d);
  const setMaxRender = useHeliosStore((s) => s.setMaxRender);
  const setShowLabels = useHeliosStore((s) => s.setShowLabels);
  const setShowGroundTrack = useHeliosStore((s) => s.setShowGroundTrack);
  const setShowTerminator = useHeliosStore((s) => s.setShowTerminator);
  const setReducedMotion = useHeliosStore((s) => s.setReducedMotion);
  const setShowMap2d = useHeliosStore((s) => s.setShowMap2d);

  if (panel !== "settings") return null;

  return (
    <Panel title="Settings" onClose={() => setPanel(null)}>
      <Row label="Max render">
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={maxRender}
          onChange={(e) => setMaxRender(Number(e.target.value))}
          className="w-36 accent-[var(--cyan)]"
        />
        <span className="w-12 font-mono text-xs tabular-nums text-[var(--cyan)]">{maxRender}</span>
      </Row>
      <Row label="Labels">
        <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
      </Row>
      <Row label="Ground track">
        <input
          type="checkbox"
          checked={showGroundTrack}
          onChange={(e) => setShowGroundTrack(e.target.checked)}
        />
      </Row>
      <Row label="Terminator">
        <input
          type="checkbox"
          checked={showTerminator}
          onChange={(e) => setShowTerminator(e.target.checked)}
        />
      </Row>
      <Row label="2D map">
        <input type="checkbox" checked={showMap2d} onChange={(e) => setShowMap2d(e.target.checked)} />
      </Row>
      <Row label="Reduced motion">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
        />
      </Row>
      <p className="px-3 py-3 text-[11px] leading-relaxed text-[var(--muted)]">
        Watchlist, observer city, terminator, and these flags persist in localStorage. URL{" "}
        <span className="font-mono">?norad=&lat=&lon=&t=</span> hydrates selection, observer, and sim
        epoch.
      </p>
    </Panel>
  );
}
