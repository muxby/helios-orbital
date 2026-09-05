"use client";

import dynamic from "next/dynamic";

const HeliosApp = dynamic(
  () => import("@/components/helios/HeliosApp").then((m) => m.HeliosApp),
  {
    ssr: false,
    loading: () => (
      <div
        id="helios-root"
        className="relative flex h-dvh w-screen flex-col overflow-hidden bg-[#070b14] text-[var(--text)]"
      >
        <header className="helios-panel flex h-12 shrink-0 items-center gap-3 border-x-0 border-t-0 px-3">
          <span className="font-sans text-[15px] font-semibold tracking-[0.42em]">HELIOS</span>
          <span className="hidden font-mono text-[9px] tracking-[0.22em] text-[var(--muted)] sm:inline">
            ORBITAL INTELLIGENCE
          </span>
          <div id="helios-palette-slot" className="min-w-0 flex-1" />
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="helios-panel hidden w-[320px] shrink-0 lg:block" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center justify-center font-mono text-[11px] tracking-[0.22em] text-[var(--muted)]">
            INITIALIZING VIEWPORT
          </div>
          <aside className="helios-panel hidden w-[340px] shrink-0 lg:block" aria-hidden />
        </div>
        <footer className="helios-panel h-[88px] shrink-0 border-x-0 border-b-0" />
      </div>
    ),
  },
);

export default function Home() {
  return <HeliosApp />;
}
