"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/audio/AudioEngine";
import { loadSave, saveSettings } from "@/lib/persistence";

type Sfx = "ding" | "buzz" | "whoosh" | "chime" | "streak";

interface AudioApi {
  muted: boolean;
  setMuted: (m: boolean) => void;
  /** Call from a user gesture; unlocks the context + starts music. */
  enable: () => void;
  play: (s: Sfx) => void;
}

const Ctx = createContext<AudioApi | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const engine = useRef(getAudio());
  const [muted, setMutedState] = useState(false);
  const enabledRef = useRef(false);

  // hydrate settings
  useEffect(() => {
    const s = loadSave().settings;
    engine.current.setVolumes(s.musicVol, s.sfxVol);
    engine.current.setMuted(s.muted);
    setMutedState(s.muted);
  }, []);

  // pause/resume audio with tab visibility
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) engine.current.suspend();
      else engine.current.wake();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const api: AudioApi = {
    muted,
    setMuted: (m) => {
      setMutedState(m);
      engine.current.setMuted(m);
      const s = loadSave().settings;
      saveSettings({ ...s, muted: m });
    },
    enable: () => {
      if (enabledRef.current) return;
      enabledRef.current = true;
      void engine.current.unlock().then(() => {
        if (!engine.current.isMusicPlaying) engine.current.startMusic();
      });
    },
    play: (s) => {
      const e = engine.current;
      switch (s) {
        case "ding":
          e.ding();
          break;
        case "buzz":
          e.buzz();
          break;
        case "whoosh":
          e.whoosh();
          break;
        case "chime":
          e.chime();
          break;
        case "streak":
          e.streak();
          break;
      }
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAudio(): AudioApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
