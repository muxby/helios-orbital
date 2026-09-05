"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useHeliosStore } from "@/lib/store";

export function Panel({
  title,
  onClose,
  children,
  className,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const reduced = useHeliosStore((s) => s.reducedMotion);
  return (
    <motion.aside
      initial={reduced ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: 16 }}
      transition={{ duration: reduced ? 0 : 0.15 }}
      className={cn(
        "pointer-events-auto flex h-[min(100dvh-56px,720px)] min-h-[280px] flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md",
        wide ? "w-[min(100vw-16px,420px)]" : "w-[min(100vw-16px,360px)]",
        className,
      )}
    >
      <header className="flex h-11 min-h-11 shrink-0 items-center justify-between border-b border-[var(--line)] px-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded p-1 text-[var(--muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cyan)]"
        >
          <X size={14} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </motion.aside>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-8 text-center text-xs leading-relaxed text-[var(--muted)]">
      {children}
    </p>
  );
}

export function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead className="sticky top-0 bg-[rgba(12,18,32,0.95)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
      <tr>
        {cols.map((c) => (
          <th key={c} className="px-2 py-2 text-left font-medium">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}
