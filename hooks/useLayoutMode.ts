"use client";
import { useEffect, useState } from "react";

export interface LayoutMode {
  orientation: "portrait" | "landscape";
  desktop: boolean;
}

/** Tracks orientation + a desktop breakpoint for responsive layout switching. */
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>({ orientation: "portrait", desktop: false });

  useEffect(() => {
    const mqPortrait = window.matchMedia("(orientation: portrait)");
    const mqDesktop = window.matchMedia("(min-width: 900px)");
    const update = () =>
      setMode({
        orientation: mqPortrait.matches ? "portrait" : "landscape",
        desktop: mqDesktop.matches,
      });
    update();
    mqPortrait.addEventListener("change", update);
    mqDesktop.addEventListener("change", update);
    return () => {
      mqPortrait.removeEventListener("change", update);
      mqDesktop.removeEventListener("change", update);
    };
  }, []);

  return mode;
}
