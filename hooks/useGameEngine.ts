"use client";
import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/engine/GameEngine";
import type { FlashKind, HudSnapshot, SubLevelConfig, SubLevelResult } from "@/lib/engine/types";
import { useAudio } from "@/components/AudioProvider";

interface Args {
  image: HTMLImageElement;
  natW: number;
  natH: number;
  config: SubLevelConfig;
  level: number;
  sub: number;
  dev?: boolean;
  onComplete: (r: SubLevelResult) => void;
}

export interface FlashState {
  tile: number;
  kind: FlashKind;
  key: number;
}

export function useGameEngine({ image, natW, natH, config, level, sub, dev, onComplete }: Args) {
  const audio = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beltRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const flashKey = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [guideTiles, setGuideTiles] = useState<number[]>([]);

  const [hud, setHud] = useState<HudSnapshot>({
    score: 0,
    streak: 0,
    multiplier: 1,
    correct: 0,
    presented: 0,
    quotaTarget: config.quotaTarget,
    quotaOutOf: config.quotaOutOf,
  });
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    if (!image) return;
    const engine = new GameEngine(
      { ...config, image, natW, natH, level, sub, dev },
      {
        onEvent: (e) => {
          switch (e.type) {
            case "correct":
              audio.play("ding");
              break;
            case "wrong":
              audio.play("buzz");
              break;
            case "miss":
              audio.play("whoosh");
              break;
            case "streakUp":
              audio.play("streak");
              break;
            case "complete":
              if (e.result.passed) audio.play("chime");
              onCompleteRef.current(e.result);
              break;
          }
        },
        onHud: setHud,
        onFlash: (tile, kind) => {
          flashKey.current += 1;
          setFlash({ tile, kind, key: flashKey.current });
        },
        onGuide: setGuideTiles,
      }
    );
    engineRef.current = engine;
    if (canvasRef.current) engine.attachCanvas(canvasRef.current);

    const measure = () => {
      const el = beltRef.current;
      if (el) engine.setBeltSize(el.clientWidth, el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (beltRef.current) ro.observe(beltRef.current);

    // small delay so layout settles before first frame
    const startId = requestAnimationFrame(() => {
      measure();
      engine.start();
    });

    return () => {
      cancelAnimationFrame(startId);
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // config/image refs are stable (from LEVELS); level+sub identify the run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, level, sub, natW, natH, dev]);

  // pause physics when the tab is hidden
  useEffect(() => {
    const onVis = () => {
      const e = engineRef.current;
      if (!e) return;
      if (document.hidden) e.pause();
      else e.resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const handleTileClick = (i: number) => engineRef.current?.handleTileClick(i);
  const forceWin = () => engineRef.current?.forceWin();

  return { hud, flash, guideTiles, canvasRef, beltRef, handleTileClick, forceWin };
}
