"use client";

import { useEffect, useRef, useState } from "react";
import { useHeliosStore } from "@/lib/store";
import { nextIssPass } from "@/lib/passes";
import { scanConjunctions } from "@/lib/conjunction";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/cn";

interface Toast {
  id: string;
  tone: "amber" | "crit" | "info";
  title: string;
  body: string;
}

const seenToasts = new Set<string>();

export function AlertToasts() {
  const catalog = useHeliosStore((s) => s.catalog);
  const observer = useHeliosStore((s) => s.observer);
  const selectedNoradId = useHeliosStore((s) => s.selectedNoradId);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef(seenToasts);

  useEffect(() => {
    if (catalog.length === 0) return;
    const push = (t: Toast) => {
      if (seen.current.has(t.id)) return;
      seen.current.add(t.id);
      setToasts((prev) => [...prev.slice(-3), t]);
    };

    const iss = nextIssPass(catalog, observer, Date.now());
    if (iss && iss.aos - Date.now() <= 2 * 3_600_000 && iss.aos >= Date.now() - 60_000) {
      push({
        id: `iss-${iss.aos}`,
        tone: "info",
        title: "ISS pass",
        body: `AOS ${formatDuration(iss.aos - Date.now())} · max el ${iss.maxEl.toFixed(0)}°`,
      });
    }

    if (selectedNoradId != null) {
      const hits = scanConjunctions(catalog, Date.now(), 3, 90, 18, selectedNoradId);
      const close = hits.find((c) => c.missKm >= 1 && c.missKm < 10);
      if (close) {
        push({
          id: `cj-${close.a}-${close.b}-${close.tca}`,
          tone: close.missKm < 5 ? "crit" : "amber",
          title: "Close approach",
          body: `Miss ${close.missKm.toFixed(1)} km · TCA ${formatDuration(close.tca - Date.now())}`,
        });
      }
    }
  }, [catalog, observer, selectedNoradId]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-auto fixed bottom-24 right-3 z-[70] flex w-[min(100vw-24px,320px)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
          className={cn(
            "rounded-lg border px-3 py-2 text-left text-xs shadow-lg backdrop-blur-md",
            t.tone === "crit"
              ? "border-[var(--crit)] bg-[rgba(244,63,94,0.12)]"
              : t.tone === "amber"
                ? "border-[var(--amber)] bg-[rgba(245,158,11,0.12)]"
                : "border-[var(--line)] bg-[var(--panel)]",
          )}
        >
          <div className="font-semibold tracking-wide">{t.title}</div>
          <div className="font-mono text-[var(--muted)]">{t.body}</div>
        </button>
      ))}
    </div>
  );
}
