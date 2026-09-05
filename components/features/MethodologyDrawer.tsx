"use client";

import { Panel } from "./Panel";
import { useFeatureUi } from "@/lib/feature-ui";

export function MethodologyDrawer() {
  const panel = useFeatureUi((s) => s.panel);
  const setPanel = useFeatureUi((s) => s.setPanel);
  if (panel !== "method") return null;

  return (
    <Panel title="Methodology" onClose={() => setPanel(null)} wide>
      <div className="space-y-4 px-3 py-3 text-[13px] leading-relaxed text-[var(--text)]">
        <p>
          <span className="text-[var(--cyan)]">SGP4 / TEME.</span> TLEs are mean elements in True Equator Mean
          Equinox. satellite.js runs SGP4; we do not numerically integrate, do not apply polar motion, and do not
          pretend this is an operational OD pipeline.
        </p>
        <p>
          <span className="text-[var(--cyan)]">Celestrak.</span> GP JSON by group, cached ~6h. If the fetch dies, we
          serve a baked sample so the demo still runs. Sample epochs are not live truth.
        </p>
        <p>
          <span className="text-[var(--cyan)]">Passes.</span> Observer look angles, 10° mask, 30s coarse grid, binary
          refine on AOS/LOS. Max el is the coarse-grid peak. Fine for a console, not a ground-station scheduler.
        </p>
        <p>
          <span className="text-[var(--cyan)]">Conjunctions.</span> Pairwise TEME range, min over a stepped window.
          No covariance, no CDM, no probability. Color is geometry only: &lt;5 km crit, &lt;20 km amber.
        </p>
        <p>
          <span className="text-[var(--cyan)]">Eclipse.</span> Conical umbra/penumbra vs a low-precision
          sun vector in TEME. Badge is geometry, not a lighting budget for solar arrays.
        </p>
        <p>
          <span className="text-[var(--cyan)]">Coverage.</span> Spherical Earth, 5° elevation mask, ground
          range = R · (acos((R/(R+h)) cos ε) − ε). Drawn on the globe and the 2D strip.
        </p>
        <p>
          <span className="text-[var(--cyan)]">Share URL.</span>{" "}
          <span className="font-mono">?norad=&lat=&lon=&t=</span> hydrates selection, observer, and sim
          epoch. TLE older than 7 days vs the clock is flagged STALE.
        </p>
        <p className="text-[var(--muted)]">
          Interview line: we shipped a real propagator in the browser, then were honest about what the screening is
          not.
        </p>
      </div>
    </Panel>
  );
}
