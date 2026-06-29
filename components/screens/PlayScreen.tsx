"use client";
import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ConveyorBelt } from "@/components/game/ConveyorBelt";
import { ScoreBoard } from "@/components/hud/ScoreBoard";
import { QuotaMeter } from "@/components/hud/QuotaMeter";
import { SpeedrunTimer } from "@/components/hud/SpeedrunTimer";
import { MuteToggle } from "@/components/hud/SettingsBar";
import { useGameEngine } from "@/hooks/useGameEngine";
import type { SubLevelConfig, SubLevelResult } from "@/lib/engine/types";
import type { RunClock } from "@/lib/runClock";

interface Props {
  image: HTMLImageElement;
  imgSrc: string;
  aspect: number; // natW / natH
  config: SubLevelConfig;
  level: number;
  sub: number;
  mode: "campaign" | "speedrun";
  dev: boolean;
  clock: RunClock;
  onComplete: (r: SubLevelResult) => void;
  onRestart: () => void;
  onQuit: () => void;
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="bevel btn-press border-2 border-ink bg-panel px-2 py-1 font-term text-lg leading-none transition-transform"
    >
      {children}
    </button>
  );
}

export function PlayScreen(props: Props) {
  const { image, imgSrc, aspect, config, level, sub, mode, dev, clock, onComplete, onRestart, onQuit } = props;
  const { hud, flash, guideTiles, canvasRef, beltRef, handleTileClick, forceWin } = useGameEngine({
    image,
    natW: image.naturalWidth,
    natH: image.naturalHeight,
    config,
    level,
    sub,
    dev,
    onComplete,
  });

  // Fit the board to its container while preserving image aspect.
  const fitRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      let w = cw;
      let h = cw / aspect;
      if (h > ch) {
        h = ch;
        w = ch * aspect;
      }
      setBox({ w: Math.floor(w), h: Math.floor(h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col gap-2 p-2 sm:p-3">
      {/* HUD */}
      <div className="flex items-center justify-between gap-2">
        {mode === "speedrun" ? (
          <SpeedrunTimer clock={clock} className="text-xl sm:text-2xl" />
        ) : (
          <span className="font-pixel text-[10px] text-bevelDark">
            LV {level}-{sub + 1}
          </span>
        )}
        <ScoreBoard hud={hud} />
        <div className="hidden sm:block">
          <QuotaMeter hud={hud} />
        </div>
        <div className="flex items-center gap-1.5">
          {dev && (
            <button
              type="button"
              onClick={forceWin}
              className="bevel btn-press border-2 border-ink bg-good px-2 py-1 font-pixel text-[9px] leading-none transition-transform"
              title="Dev: instant win"
            >
              WIN
            </button>
          )}
          <IconBtn label="Restart sub-level" onClick={onRestart}>
            ↻
          </IconBtn>
          <IconBtn label="Quit to menu" onClick={onQuit}>
            ⌂
          </IconBtn>
          <MuteToggle />
        </div>
      </div>
      <div className="sm:hidden">
        <QuotaMeter hud={hud} />
      </div>

      {/* Board */}
      <div ref={fitRef} className="grid min-h-0 flex-1 place-items-center">
        <div style={{ width: box.w, height: box.h }}>
          {box.w > 0 && (
            <GameBoard
              src={imgSrc}
              grid={config.grid}
              onTile={handleTileClick}
              flash={flash}
              guideTiles={dev ? guideTiles : undefined}
            />
          )}
        </div>
      </div>

      {/* Belt */}
      <ConveyorBelt wrapRef={beltRef} canvasRef={canvasRef} />
      <p className="text-center font-term text-[11px] uppercase text-bevelDark">
        {dev ? "DEV MODE · green = correct tile" : "← tap the matching tile before it slides off"}
      </p>
    </div>
  );
}
