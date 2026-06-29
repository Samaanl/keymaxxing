"use client";
import { GridTile } from "./GridTile";
import type { FlashState } from "@/hooks/useGameEngine";

interface Props {
  src: string;
  grid: number;
  onTile: (i: number) => void;
  flash: FlashState | null;
  guideTiles?: number[];
}

/** Fills its parent box exactly — the parent is sized to the image aspect so
 * tiles never distort. */
export function GameBoard({ src, grid, onTile, flash, guideTiles }: Props) {
  const tiles = Array.from({ length: grid * grid }, (_, i) => i);
  const guide = guideTiles && guideTiles.length ? new Set(guideTiles) : null;
  return (
    <div className="bevel h-full w-full border-2 border-ink bg-ink">
      <div
        className="grid h-full w-full gap-px"
        style={{
          gridTemplateColumns: `repeat(${grid}, 1fr)`,
          gridTemplateRows: `repeat(${grid}, 1fr)`,
        }}
      >
        {tiles.map((i) => (
          <GridTile
            key={i}
            src={src}
            grid={grid}
            index={i}
            onClick={onTile}
            flash={flash}
            guide={guide ? guide.has(i) : false}
          />
        ))}
      </div>
    </div>
  );
}
