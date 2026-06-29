"use client";
import { useEffect, useState } from "react";
import type { LevelImage } from "@/lib/engine/types";

export interface LoadedImages {
  map: Record<number, HTMLImageElement>;
  loaded: boolean;
  progress: number; // 0..1
}

/** Preload + decode all level images once, up front. */
export function useImageLoader(images: LevelImage[]): LoadedImages {
  const [state, setState] = useState<LoadedImages>({ map: {}, loaded: false, progress: 0 });

  useEffect(() => {
    let cancelled = false;
    const result: Record<number, HTMLImageElement> = {};
    let done = 0;

    Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            const el = new Image();
            el.decoding = "async";
            const finish = () => {
              done++;
              if (!cancelled) setState((s) => ({ ...s, progress: done / images.length }));
              resolve();
            };
            el.onload = () => {
              result[img.id] = el;
              finish();
            };
            el.onerror = finish;
            el.src = img.src;
          })
      )
    ).then(() => {
      if (!cancelled) setState({ map: result, loaded: true, progress: 1 });
    });

    return () => {
      cancelled = true;
    };
  }, [images]);

  return state;
}
