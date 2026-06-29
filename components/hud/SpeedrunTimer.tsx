"use client";
import { useEffect, useRef } from "react";
import type { RunClock } from "@/lib/runClock";
import { formatTime } from "@/lib/scoring";

/** Always-visible digital speedrun clock. Self-updates via rAF, writes
 * straight to the DOM node so it never triggers a React re-render. */
export function SpeedrunTimer({
  clock,
  color = "#3ec45a",
  className = "",
}: {
  clock: RunClock;
  color?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) ref.current.textContent = formatTime(clock.ms);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clock]);
  return (
    <span
      ref={ref}
      className={`font-term inline-block border-2 border-ink bg-[#0c0e0b] px-2 py-0.5 leading-none ${className}`}
      style={{ color, textShadow: `0 0 6px ${color}aa`, letterSpacing: "0.08em" }}
    >
      00:00.00
    </span>
  );
}
