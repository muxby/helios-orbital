"use client";

import { CATALOG_GROUPS } from "./constants";
import { cn } from "./cn";

type GroupTabsProps = {
  active: string;
  onChange: (group: string) => void;
};

export function GroupTabs({ active, onChange }: GroupTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Catalog groups"
      className="helios-scroll flex gap-1 overflow-x-auto pb-1"
    >
      {CATALOG_GROUPS.map((group) => {
        const selected = group.id === active;
        return (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(group.id)}
            className={cn(
              "shrink-0 rounded-sm border px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none",
              selected
                ? "border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]"
                : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--text)]",
            )}
          >
            {group.label}
          </button>
        );
      })}
    </div>
  );
}
