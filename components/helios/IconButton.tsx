"use client";

import { type ReactNode } from "react";
import { cn } from "./cn";

type IconButtonProps = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

export function IconButton({
  label,
  children,
  onClick,
  active,
  disabled,
  className,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--line)] text-[var(--muted)] transition-colors duration-150",
        "hover:border-[var(--cyan)] hover:text-[var(--cyan)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active && "border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
