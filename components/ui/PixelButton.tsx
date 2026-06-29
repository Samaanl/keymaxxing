"use client";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "good" | "warn" | "bad" | "plain";

const VARIANT_BG: Record<Variant, string> = {
  primary: "bg-drool",
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  plain: "bg-panel",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

export function PixelButton({ variant = "primary", full, className = "", children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={[
        "bevel btn-press select-none font-pixel uppercase tracking-wide text-ink",
        "border-2 border-ink px-5 py-3 text-[10px] sm:text-xs leading-relaxed",
        "transition-transform disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_BG[variant],
        full ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
