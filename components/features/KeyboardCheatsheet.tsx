"use client";

import { useFeatureUi } from "@/lib/feature-ui";

const ROWS: [string, string][] = [
  ["⌘ / Ctrl K", "Command palette"],
  ["?", "This cheatsheet"],
  ["Esc", "Close overlay / clear"],
  ["Space", "Play / pause — ignored while typing in search"],
  ["[  ]", "Sim rate down / up"],
  ["/", "Focus catalog search"],
  ["H", "Home / reset camera (full Earth)"],
  ["F", "Fullscreen"],
  ["P", "Pass predictor"],
  ["C", "Conjunction board"],
  ["M", "Toggle 2D map"],
  ["G", "Go to ISS"],
  ["Click pass row", "Select sat, jump clock to AOS"],
];

export function KeyboardCheatsheet() {
  const panel = useFeatureUi((s) => s.panel);
  const setPanel = useFeatureUi((s) => s.setPanel);
  if (panel !== "cheatsheet") return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[75] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-label="Keyboard cheatsheet"
      onClick={() => setPanel(null)}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Keyboard
        </h2>
        <ul className="divide-y divide-[var(--line)] text-sm">
          {ROWS.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between gap-4 py-2">
              <span className="font-mono text-[var(--cyan)]">{k}</span>
              <span className="text-right text-[var(--muted)]">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
