"use client";

import { useHeliosStore } from "@/lib/store";
import { useFeatureUi } from "@/lib/feature-ui";
import { cn } from "@/lib/cn";

export function StatusBanners() {
  const status = useHeliosStore((s) => s.catalogStatus);
  const source = useHeliosStore((s) => s.catalogSource);
  const error = useHeliosStore((s) => s.catalogError);
  const catalog = useHeliosStore((s) => s.catalog);
  const setCatalogStatus = useHeliosStore((s) => s.setCatalogStatus);
  const activeGroup = useHeliosStore((s) => s.activeGroup);
  const setActiveGroup = useHeliosStore((s) => s.setActiveGroup);
  const setPanel = useFeatureUi((s) => s.setPanel);

  const retry = () => {
    setCatalogStatus("idle");
    setActiveGroup(activeGroup);
  };

  return (
    <div className="pointer-events-auto flex min-h-8 flex-col justify-center">
      {status === "loading" && catalog.length === 0 ? (
        <div className="h-8 min-h-8 overflow-hidden rounded border border-[var(--line)] bg-[var(--panel)] px-3">
          <div className="h-full w-2/3 animate-pulse bg-[rgba(34,211,238,0.08)]" />
        </div>
      ) : null}
      {status === "ready" && catalog.length === 0 ? (
        <div className="flex h-8 min-h-8 items-center justify-between rounded border border-[var(--line)] bg-[var(--panel)] px-3 text-[11px] text-[var(--muted)]">
          Empty catalog for this group.
          <button type="button" className="text-[var(--cyan)]" onClick={retry}>
            Retry
          </button>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="flex h-8 min-h-8 items-center justify-between rounded border border-[var(--crit)] bg-[rgba(244,63,94,0.1)] px-3 text-[11px]">
          <span>{error ?? "Catalog error"}</span>
          <button type="button" className="text-[var(--cyan)]" onClick={retry}>
            Retry
          </button>
        </div>
      ) : null}
      {source === "sample" && status === "ready" ? (
        <div className="flex h-8 min-h-8 items-center justify-between rounded border border-[var(--amber)] bg-[rgba(245,158,11,0.1)] px-3 text-[11px] text-[var(--amber)]">
          <span>Celestrak unreachable — sample catalog</span>
          <span className="flex gap-2">
            <button type="button" className="text-[var(--cyan)]" onClick={() => setPanel("method")}>
              Why
            </button>
            <button type="button" className="text-[var(--cyan)]" onClick={retry}>
              Retry
            </button>
          </span>
        </div>
      ) : null}
      <span className={cn("sr-only")} aria-live="polite">
        {status} {source}
      </span>
    </div>
  );
}
