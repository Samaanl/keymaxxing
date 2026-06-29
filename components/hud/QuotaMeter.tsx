"use client";
import type { HudSnapshot } from "@/lib/engine/types";

export function QuotaMeter({ hud }: { hud: HudSnapshot }) {
  const fill = Math.min(1, hud.quotaTarget > 0 ? hud.correct / hud.quotaTarget : 0);
  const met = hud.correct >= hud.quotaTarget;
  const remaining = hud.quotaOutOf - hud.presented;
  return (
    <div className="flex flex-col gap-1 font-term leading-none">
      <div className="flex items-center justify-between text-[10px] uppercase">
        <span className="text-bevelDark">
          Goal{" "}
          <span className={met ? "text-good" : "text-ink"}>
            {hud.correct}/{hud.quotaTarget}
          </span>
        </span>
        <span className="text-bevelDark">{remaining} left</span>
      </div>
      <div className="h-3 w-40 max-w-[40vw] border-2 border-ink bg-paper">
        <div
          className={`h-full ${met ? "bg-good" : "bg-drool"}`}
          style={{ width: `${fill * 100}%`, transition: "width 120ms linear" }}
        />
      </div>
    </div>
  );
}
