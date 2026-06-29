"use client";
import type { HudSnapshot } from "@/lib/engine/types";

export function ScoreBoard({ hud }: { hud: HudSnapshot }) {
  return (
    <div className="flex items-center gap-3 font-term leading-none">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-bevelDark">Score</span>
        <span className="text-2xl text-ink tabular-nums">{hud.score}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-bevelDark">Streak</span>
        <span className="flex items-baseline gap-1">
          <span className="text-2xl text-ink tabular-nums">{hud.streak}</span>
          {hud.multiplier > 1 && (
            <span className="font-pixel text-[10px] text-bad animate-pop">{hud.multiplier}x</span>
          )}
        </span>
      </div>
    </div>
  );
}
