/* eslint-disable @next/next/no-img-element */
"use client";
import { LEVELS, SUBLEVELS_PER_LEVEL } from "@/lib/levels";
import { starKey, type SaveData } from "@/lib/persistence";
import { PixelButton } from "@/components/ui/PixelButton";
import { BevelPanel } from "@/components/ui/BevelPanel";

interface Props {
  save: SaveData;
  dev: boolean;
  onPick: (level: number) => void;
  onBack: () => void;
}

export function LevelSelectScreen({ save, dev, onPick, onBack }: Props) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-lg text-ink sm:text-2xl">SELECT LEVEL</h2>
        <PixelButton variant="plain" onClick={onBack}>
          ← Back
        </PixelButton>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LEVELS.map((lvl, i) => {
          const levelNum = i + 1;
          const locked = !dev && levelNum > save.progress.unlockedLevel;
          let totalStars = 0;
          let maxStars = SUBLEVELS_PER_LEVEL * 3;
          for (let s = 0; s < SUBLEVELS_PER_LEVEL; s++) {
            totalStars += save.progress.stars[starKey(levelNum, s)] ?? 0;
          }
          return (
            <button
              key={levelNum}
              type="button"
              disabled={locked}
              onClick={() => onPick(levelNum)}
              className="text-left disabled:cursor-not-allowed"
            >
              <BevelPanel
                className={`flex items-center gap-3 p-2 transition-transform ${
                  locked ? "opacity-60" : "btn-press hover:brightness-105"
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden border-2 border-ink bg-ink">
                  <img
                    src={lvl.image.src}
                    alt={lvl.image.title}
                    className="h-full w-full object-cover"
                    style={{ imageRendering: "auto", filter: locked ? "grayscale(1)" : "none" }}
                  />
                  {locked && (
                    <span className="absolute inset-0 grid place-items-center bg-black/40 text-2xl">
                      🔒
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-pixel text-[10px] text-bevelDark">LEVEL {levelNum}</div>
                  <div className="truncate font-term text-xl text-ink">{lvl.image.title}</div>
                  <div className="font-term text-sm text-warn">
                    {"★".repeat(Math.min(3, Math.round(totalStars / 4)))}
                    <span className="text-bevelDark"> {totalStars}/{maxStars}</span>
                  </div>
                </div>
              </BevelPanel>
            </button>
          );
        })}
      </div>
    </div>
  );
}
