"use client";
import { getSubLevel, SPEED_LABEL, SUBLEVELS_PER_LEVEL } from "@/lib/levels";
import { starKey, unlockedSubLevel, type SaveData } from "@/lib/persistence";
import { PixelButton } from "@/components/ui/PixelButton";
import { BevelPanel } from "@/components/ui/BevelPanel";
import { Stars } from "@/components/ui/Stars";

interface Props {
  level: number;
  levelTitle: string;
  save: SaveData;
  dev: boolean;
  onPick: (sub: number) => void;
  onBack: () => void;
}

export function SubLevelSelect({ level, levelTitle, save, dev, onPick, onBack }: Props) {
  const unlocked = dev ? SUBLEVELS_PER_LEVEL - 1 : unlockedSubLevel(save, level, SUBLEVELS_PER_LEVEL);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-pixel text-[10px] text-bevelDark">LEVEL {level}</div>
          <h2 className="font-pixel text-lg text-ink sm:text-2xl">{levelTitle}</h2>
        </div>
        <PixelButton variant="plain" onClick={onBack}>
          ← Back
        </PixelButton>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: SUBLEVELS_PER_LEVEL }, (_, s) => {
          const cfg = getSubLevel(level, s);
          const stars = save.progress.stars[starKey(level, s)] ?? 0;
          const completed = stars > 0;
          const locked = s > unlocked;
          return (
            <button
              key={s}
              type="button"
              disabled={locked}
              onClick={() => onPick(s)}
              className="text-left disabled:cursor-not-allowed"
            >
              <BevelPanel
                className={`flex items-center justify-between gap-3 p-3 transition-transform ${
                  locked ? "opacity-60" : "btn-press hover:brightness-105"
                }`}
              >
                <div>
                  <div className="font-pixel text-xs text-ink">SUB-LEVEL {s + 1}</div>
                  <div className="font-term text-base text-bevelDark">
                    {cfg.grid}×{cfg.grid} · {SPEED_LABEL[s]} · goal {cfg.quotaTarget}/{cfg.quotaOutOf}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {locked ? (
                    <span className="text-2xl">🔒</span>
                  ) : completed ? (
                    <Stars count={stars} size="text-xl" />
                  ) : (
                    <span className="font-pixel text-[10px] text-drool">PLAY ▶</span>
                  )}
                </div>
              </BevelPanel>
            </button>
          );
        })}
      </div>
    </div>
  );
}
