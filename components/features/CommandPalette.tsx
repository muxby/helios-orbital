"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CONSTELLATION_PRESETS } from "@/lib/presets";
import { GROUPS } from "@/lib/groups";
import { filteredCatalog, useHeliosStore } from "@/lib/store";
import { useFeatureUi } from "@/lib/feature-ui";
import { downloadText, ephemerisCsv } from "@/lib/export-ephemeris";
import { findEntry } from "@/lib/propagate";
import { captureHeliosPng, toggleHeliosFullscreen } from "@/lib/capture";
import { copyText, heliosShareUrl } from "@/lib/share";
import { cn } from "@/lib/cn";

const RATES = [1, 10, 60, 300, 1000];

interface Cmd {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useFeatureUi((s) => s.paletteOpen);
  const setPaletteOpen = useFeatureUi((s) => s.setPaletteOpen);
  const setPanel = useFeatureUi((s) => s.setPanel);
  const catalog = useHeliosStore((s) => s.catalog);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const store = useHeliosStore;

  const commands = useMemo<Cmd[]>(() => {
    const s = store.getState();
    const sats = filteredCatalog({ ...s, searchQuery: q, catalog }).slice(0, 12);
    const satCmds: Cmd[] = sats.map((e) => ({
      id: `sat-${e.noradId}`,
      group: "Satellites",
      label: e.name,
      hint: String(e.noradId),
      run: () => s.setSelected(e.noradId),
    }));
    const groupCmds: Cmd[] = GROUPS.map((g) => ({
      id: `grp-${g.id}`,
      group: "Groups",
      label: `Jump ${g.label}`,
      hint: g.id,
      run: () => s.setActiveGroup(g.id),
    }));
    const rateCmds: Cmd[] = RATES.map((rate) => ({
      id: `rate-${rate}`,
      group: "Clock",
      label: `Rate ${rate}x`,
      run: () => s.setRate(rate),
    }));
    const presetCmds: Cmd[] = CONSTELLATION_PRESETS.map((p) => ({
      id: `pre-${p.id}`,
      group: "Presets",
      label: p.label,
      hint: p.hint,
      run: () => {
        s.setActiveGroup(p.group);
        s.setFilter(p.filter);
        if (p.norad) s.setSelected(p.norad);
        s.setCameraPreset(p.camera);
      },
    }));
    const toggles: Cmd[] = [
      {
        id: "tog-labels",
        group: "Display",
        label: s.showLabels ? "Hide labels" : "Show labels",
        run: () => s.setShowLabels(!s.showLabels),
      },
      {
        id: "tog-track",
        group: "Display",
        label: s.showGroundTrack ? "Hide ground track" : "Show ground track",
        run: () => s.setShowGroundTrack(!s.showGroundTrack),
      },
      {
        id: "tog-term",
        group: "Display",
        label: s.showTerminator ? "Hide terminator" : "Show terminator",
        run: () => s.setShowTerminator(!s.showTerminator),
      },
      {
        id: "tog-map",
        group: "Display",
        label: s.showMap2d ? "Hide 2D map" : "Show 2D map",
        run: () => s.setShowMap2d(!s.showMap2d),
      },
      {
        id: "go-iss",
        group: "Presets",
        label: "Go to ISS",
        hint: "25544",
        run: () => {
          s.setActiveGroup("stations");
          s.setCameraPreset("iss");
          s.setSelected(25544);
        },
      },
      {
        id: "home-cam",
        group: "Display",
        label: "Home camera",
        hint: "H",
        run: () => s.resetCamera(),
      },
      {
        id: "fullscreen",
        group: "Display",
        label: "Toggle fullscreen",
        hint: "F",
        run: () => toggleHeliosFullscreen(),
      },
      {
        id: "shot",
        group: "Display",
        label: "Screenshot globe",
        run: () => captureHeliosPng(s.selectedNoradId),
      },
      {
        id: "share",
        group: "Display",
        label: "Copy share link",
        hint: "?norad=&lat=&lon=&t=",
        run: () => {
          void copyText(
            heliosShareUrl({
              noradId: s.selectedNoradId,
              observer: s.observer,
              epochMs: s.clock.epochMs,
            }),
          );
        },
      },
      {
        id: "open-pass",
        group: "Panels",
        label: "Pass predictor",
        run: () => setPanel("passes"),
      },
      {
        id: "open-conj",
        group: "Panels",
        label: "Conjunction board",
        run: () => setPanel("conjunctions"),
      },
      {
        id: "open-cmp",
        group: "Panels",
        label: "Compare mode",
        run: () => setPanel("compare"),
      },
      {
        id: "open-set",
        group: "Panels",
        label: "Settings",
        run: () => setPanel("settings"),
      },
      {
        id: "open-meth",
        group: "Panels",
        label: "Methodology",
        run: () => setPanel("method"),
      },
      {
        id: "export",
        group: "Panels",
        label: "Export selected ephemeris CSV",
        hint: "90 min",
        run: () => {
          const entry = findEntry(s.catalog, s.selectedNoradId);
          if (!entry) return;
          const csv = ephemerisCsv(entry, s.clock.epochMs, 90, 30);
          downloadText(`helios-${entry.noradId}-90min.csv`, csv);
        },
      },
    ];
    const all = [...satCmds, ...presetCmds, ...groupCmds, ...rateCmds, ...toggles];
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (c) =>
        c.label.toLowerCase().includes(query) ||
        (c.hint ?? "").toLowerCase().includes(query) ||
        c.group.toLowerCase().includes(query),
    );
  }, [catalog, q, setPanel, store]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setIdx(0);
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(commands.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = commands[idx];
        if (cmd) {
          cmd.run();
          setPaletteOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, commands, idx, setPaletteOpen]);

  if (!open || typeof document === "undefined") return null;

  const body = (
    <div
      className="pointer-events-auto fixed inset-0 z-[80] flex items-start justify-center bg-black/55 px-3 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sats, groups, rate, ISS…"
          className="h-12 w-full border-b border-[var(--line)] bg-transparent px-4 font-mono text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        />
        <ul className="max-h-[min(52vh,420px)] min-h-[160px] overflow-auto py-1">
          {commands.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-[var(--muted)]">No matches</li>
          ) : (
            commands.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => {
                    c.run();
                    setPaletteOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2 text-left text-sm",
                    i === idx ? "bg-[rgba(34,211,238,0.12)] text-[var(--cyan)]" : "text-[var(--text)]",
                  )}
                >
                  <span>
                    <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {c.group}
                    </span>
                    {c.label}
                  </span>
                  {c.hint ? (
                    <span className="font-mono text-[11px] tabular-nums text-[var(--muted)]">{c.hint}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="border-t border-[var(--line)] px-4 py-2 font-mono text-[10px] text-[var(--muted)]">
          ↑↓ navigate · enter run · esc close
        </p>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
