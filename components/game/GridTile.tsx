"use client";
import { memo } from "react";
import { tileBackgroundPosition } from "@/lib/imageCropper";
import type { FlashState } from "@/hooks/useGameEngine";

interface Props {
  src: string;
  grid: number;
  index: number;
  onClick: (i: number) => void;
  flash: FlashState | null;
  guide?: boolean;
}

function GridTileBase({ src, grid, index, onClick, flash, guide }: Props) {
  const pos = tileBackgroundPosition(index, grid);
  const showFlash = flash && flash.tile === index;
  return (
    <button
      type="button"
      aria-label={`tile ${index + 1}`}
      onClick={() => onClick(index)}
      className="relative block h-full w-full overflow-hidden outline-none active:translate-y-px"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${grid * 100}% ${grid * 100}%`,
        backgroundPosition: `${pos.x}% ${pos.y}%`,
        imageRendering: grid >= 6 ? "pixelated" : "auto",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {guide && (
        <span
          className="pointer-events-none absolute inset-0 animate-blink"
          style={{ boxShadow: "inset 0 0 0 4px #3ec45a, 0 0 10px #3ec45a" }}
        />
      )}
      {showFlash && (
        <span
          key={flash.key}
          className={`pointer-events-none absolute inset-0 ${
            flash.kind === "good" ? "animate-flashGood" : "animate-flashBad"
          }`}
        />
      )}
    </button>
  );
}

export const GridTile = memo(GridTileBase);
