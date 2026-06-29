"use client";
import type { RefObject } from "react";

interface Props {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  className?: string;
}

export function ConveyorBelt({ wrapRef, canvasRef, className = "" }: Props) {
  return (
    <div
      ref={wrapRef}
      className={`bevel-in relative w-full overflow-hidden border-2 border-ink bg-[#1c1c22] ${className}`}
      style={{ height: "clamp(96px, 17vh, 168px)" }}
    >
      <canvas ref={canvasRef} className="block" />
      {/* "answer line" hint near the left edge */}
      <div className="pointer-events-none absolute left-2 top-0 h-full w-0.5 bg-drool/40" />
    </div>
  );
}
