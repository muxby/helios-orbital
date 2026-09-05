"use client";

import { RefreshCw } from "lucide-react";

type ErrorBannerProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorBanner({
  message = "Celestrak unreachable — sample catalog",
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border border-[var(--amber)]/40 bg-[var(--amber)]/10 px-2 py-1.5 font-mono text-[10px] leading-snug text-[var(--amber)]"
    >
      <span className="flex-1">{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry catalog fetch"
          className="inline-flex items-center gap-1 rounded-sm border border-[var(--amber)]/40 px-1.5 py-0.5 tracking-[0.12em] uppercase hover:bg-[var(--amber)]/15 focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:outline-none"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
