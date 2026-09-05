"use client";

import { Search } from "lucide-react";
import { SEARCH_INPUT_ID } from "./constants";
import { cn } from "./cn";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SearchInput({ value, onChange, className }: SearchInputProps) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">Search catalog</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]"
      />
      <input
        id={SEARCH_INPUT_ID}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="NAME / NORAD  /"
        autoComplete="off"
        spellCheck={false}
        className="h-8 w-full rounded-sm border border-[var(--line)] bg-black/25 pr-2 pl-8 font-mono text-[11px] tracking-wide text-[var(--text)] placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--cyan)] focus-visible:outline-none"
      />
    </label>
  );
}
