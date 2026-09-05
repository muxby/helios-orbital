"use client";

import { cn } from "./cn";

type EmptyStateProps = {
  loading?: boolean;
  message?: string;
  className?: string;
};

export function EmptyState({
  loading,
  message = "NO OBJECTS IN VIEW",
  className,
}: EmptyStateProps) {
  if (loading) {
    return (
      <div className={cn("space-y-2 p-3", className)} aria-busy="true" aria-label="Loading catalog">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-sm bg-white/8" />
            <div className="h-3 flex-1 animate-pulse rounded-sm bg-white/8" style={{ animationDelay: `${i * 40}ms` }} />
            <div className="h-3 w-8 animate-pulse rounded-sm bg-white/8" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-[120px] items-center justify-center px-4 text-center font-mono text-[11px] tracking-[0.16em] text-[var(--muted)]",
        className,
      )}
    >
      {message}
    </div>
  );
}
