"use client";
import { useEffect, useState } from "react";
import { SPEED_LABEL } from "@/lib/levels";
import type { SubLevelConfig } from "@/lib/engine/types";
import { PixelButton } from "@/components/ui/PixelButton";
import { BevelPanel } from "@/components/ui/BevelPanel";

interface Props {
  level: number;
  sub: number;
  levelTitle: string;
  config: SubLevelConfig;
  onGo: () => void;
}

export function SubLevelIntro({ level, sub, levelTitle, config, onGo }: Props) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    setCount(3);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          onGo();
          return 0;
        }
        return c - 1;
      });
    }, 700);
    return () => clearInterval(id);
    // restart countdown whenever the sub-level changes
  }, [level, sub, onGo]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="font-pixel text-xs text-bevelDark">
        LEVEL {level} · SUB-LEVEL {sub + 1}
      </div>
      <h2 className="font-pixel text-2xl text-ink sm:text-3xl">{levelTitle}</h2>

      <BevelPanel className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 p-4 font-term text-lg uppercase">
        <span>
          <span className="text-bevelDark">Grid </span>
          <span className="text-ink">
            {config.grid}×{config.grid}
          </span>
        </span>
        <span>
          <span className="text-bevelDark">Speed </span>
          <span className="text-ink">{SPEED_LABEL[sub]}</span>
        </span>
        <span>
          <span className="text-bevelDark">Belt </span>
          <span className="text-ink">{config.beltCapacity}×</span>
        </span>
        <span>
          <span className="text-bevelDark">Goal </span>
          <span className="text-good">
            {config.quotaTarget}/{config.quotaOutOf}
          </span>
        </span>
      </BevelPanel>

      <div className="font-pixel text-5xl text-drool animate-pop" key={count}>
        {count > 0 ? count : "GO!"}
      </div>

      <PixelButton variant="primary" onClick={onGo}>
        GO! ▶
      </PixelButton>
    </div>
  );
}
