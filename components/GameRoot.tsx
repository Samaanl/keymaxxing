"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LEVELS,
  LEVEL_IMAGES,
  SUBLEVELS_PER_LEVEL,
  TOTAL_LEVELS,
  getSubLevel,
} from "@/lib/levels";
import {
  loadSave,
  recordLevelPB,
  recordSpeedrunPB,
  recordStars,
  saveDev,
  unlockLevel,
  type SaveData,
} from "@/lib/persistence";
import { RunClock } from "@/lib/runClock";
import { gradeRun, precision } from "@/lib/scoring";
import type { SubLevelResult } from "@/lib/engine/types";
import { EVENTS } from "@/lib/brand";
import { sessionBucket, track } from "@/lib/analytics";
import { useAudio } from "@/components/AudioProvider";
import { useImageLoader } from "@/hooks/useImageLoader";

import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { LevelSelectScreen } from "@/components/screens/LevelSelectScreen";
import { SubLevelSelect } from "@/components/screens/SubLevelSelect";
import { SubLevelIntro } from "@/components/screens/SubLevelIntro";
import { PlayScreen } from "@/components/screens/PlayScreen";
import { EndScreen } from "@/components/screens/EndScreen";
import { BevelPanel } from "@/components/ui/BevelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { Stars } from "@/components/ui/Stars";

type Screen =
  | "landing"
  | "levelselect"
  | "sublevelselect"
  | "intro"
  | "playing"
  | "subresult"
  | "end";
type Mode = "campaign" | "speedrun";

interface Agg {
  correct: number;
  presented: number;
  missed: number;
  wrong: number;
  score: number;
}
const blankAgg = (): Agg => ({ correct: 0, presented: 0, missed: 0, wrong: 0, score: 0 });

export function GameRoot() {
  const images = useImageLoader(LEVEL_IMAGES);
  const audio = useAudio();

  const [mounted, setMounted] = useState(false);
  const [save, setSave] = useState<SaveData | null>(null);
  const [dev, setDev] = useState(false);

  const [screen, setScreen] = useState<Screen>("landing");
  const [mode, setMode] = useState<Mode>("campaign");
  const [level, setLevel] = useState(1);
  const [sub, setSub] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [lastResult, setLastResult] = useState<SubLevelResult | null>(null);
  const [playNonce, setPlayNonce] = useState(0);

  const aggRef = useRef<Agg>(blankAgg());
  const clockRef = useRef<RunClock | null>(null);
  if (!clockRef.current) clockRef.current = new RunClock();
  const clock = clockRef.current;
  const newPBRef = useRef(false);
  const sessionStartRef = useRef<number | null>(null);
  const screenRef = useRef<Screen>(screen);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    const s = loadSave();
    setSave(s);
    setDev(s.settings.dev);
    setMounted(true);
  }, []);

  // pause the speedrun clock when the tab is hidden mid-game
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) clock.pause();
      else if (screenRef.current === "playing") clock.start();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [clock]);

  const refresh = useCallback(() => setSave(loadSave()), []);

  const finalizeSession = useCallback(() => {
    const start = sessionStartRef.current ?? performance.now();
    track(EVENTS.session(sessionBucket(performance.now() - start)));
  }, []);

  const startCampaignAt = useCallback(
    (lv: number, sl: number) => {
      setMode("campaign");
      setLevel(lv);
      setSub(sl);
      aggRef.current = blankAgg();
      clock.reset();
      audio.enable();
      track(EVENTS.startCampaign);
      track(EVENTS.levelReached(lv));
      sessionStartRef.current = performance.now();
      setScreen("intro");
    },
    [audio, clock]
  );

  const startSpeedrun = useCallback(() => {
    setMode("speedrun");
    setLevel(1);
    setSub(0);
    aggRef.current = blankAgg();
    clock.reset();
    audio.enable();
    track(EVENTS.startSpeedrun);
    track(EVENTS.levelReached(1));
    sessionStartRef.current = performance.now();
    setScreen("intro");
  }, [audio, clock]);

  const beginPlay = useCallback(() => {
    clock.start();
    setScreen("playing");
  }, [clock]);

  const restartSub = useCallback(() => {
    setPlayNonce((n) => n + 1); // remount PlayScreen -> fresh engine, same sub-level
    setScreen("playing");
  }, []);

  const quitToMenu = useCallback(() => {
    clock.pause();
    setScreen("landing");
  }, [clock]);

  const handleComplete = useCallback(
    (result: SubLevelResult) => {
      clock.pause();
      setLastResult(result);
      if (result.passed) {
        const a = aggRef.current;
        a.correct += result.correct;
        a.presented += result.presented;
        a.missed += result.missed;
        a.wrong += result.wrong;
        a.score += result.score;
        recordStars(result.level, result.sub, result.stars);
        refresh();
        track(EVENTS.subCleared(result.level, result.sub));
      }
      setScreen("subresult");
    },
    [clock, refresh]
  );

  const continueFromResult = useCallback(() => {
    const r = lastResult;
    if (!r) return;
    if (!r.passed) {
      setScreen("intro"); // retry same sub-level
      return;
    }
    if (sub < SUBLEVELS_PER_LEVEL - 1) {
      setSub(sub + 1);
      setScreen("intro");
      return;
    }
    // finished SL4 of this level
    const next = Math.min(level + 1, TOTAL_LEVELS);
    unlockLevel(next);
    refresh();

    if (mode === "campaign") {
      const { isNew } = recordLevelPB(level, clock.ms);
      newPBRef.current = isNew;
      refresh();
      track(EVENTS.levelComplete(level));
      finalizeSession();
      setScreen("end");
    } else {
      if (level < TOTAL_LEVELS) {
        setLevel(level + 1);
        setSub(0);
        track(EVENTS.levelReached(level + 1));
        setScreen("intro");
      } else {
        const { isNew } = recordSpeedrunPB(clock.ms);
        newPBRef.current = isNew;
        refresh();
        track(EVENTS.runComplete);
        finalizeSession();
        setScreen("end");
      }
    }
  }, [lastResult, sub, level, mode, clock, refresh, finalizeSession]);

  const enableDev = useCallback(() => {
    saveDev(true);
    setDev(true);
    refresh();
  }, [refresh]);

  const disableDev = useCallback(() => {
    saveDev(false);
    setDev(false);
    refresh();
  }, [refresh]);

  if (!mounted || !save || !images.loaded) {
    return <LoadingScreen progress={images.progress} />;
  }

  const srcs = LEVEL_IMAGES.map((i) => i.src);

  if (screen === "landing") {
    return (
      <LandingScreen
        onPlay={() => setScreen("levelselect")}
        onSpeedrun={startSpeedrun}
        bestSpeedrunMs={save.pb.speedrunMs}
        srcs={srcs}
        dev={dev}
        onEnableDev={enableDev}
        onDisableDev={disableDev}
      />
    );
  }

  if (screen === "levelselect") {
    return (
      <LevelSelectScreen
        save={save}
        dev={dev}
        onPick={(lv) => {
          setSelectedLevel(lv);
          setScreen("sublevelselect");
        }}
        onBack={() => setScreen("landing")}
      />
    );
  }

  if (screen === "sublevelselect") {
    return (
      <SubLevelSelect
        level={selectedLevel}
        levelTitle={LEVELS[selectedLevel - 1].image.title}
        save={save}
        dev={dev}
        onPick={(sl) => startCampaignAt(selectedLevel, sl)}
        onBack={() => setScreen("levelselect")}
      />
    );
  }

  if (screen === "intro") {
    return (
      <SubLevelIntro
        level={level}
        sub={sub}
        levelTitle={LEVELS[level - 1].image.title}
        config={getSubLevel(level, sub)}
        onGo={beginPlay}
      />
    );
  }

  if (screen === "playing") {
    const lvl = LEVELS[level - 1];
    const img = images.map[level];
    return (
      <PlayScreen
        key={`${level}-${sub}-${playNonce}`}
        image={img}
        imgSrc={lvl.image.src}
        aspect={img.naturalWidth / img.naturalHeight}
        config={getSubLevel(level, sub)}
        level={level}
        sub={sub}
        mode={mode}
        dev={dev}
        clock={clock}
        onComplete={handleComplete}
        onRestart={restartSub}
        onQuit={quitToMenu}
      />
    );
  }

  if (screen === "subresult" && lastResult) {
    const r = lastResult;
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 p-6 text-center">
        <h2 className={`font-pixel text-2xl ${r.passed ? "text-good" : "text-bad"}`}>
          {r.passed ? "SUB-LEVEL CLEARED" : "QUOTA MISSED"}
        </h2>
        {r.passed && <Stars count={r.stars} size="text-4xl" className="animate-pop" />}
        <BevelPanel className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 p-4 font-term text-lg">
          <span>
            <span className="text-bevelDark">MATCHED </span>
            <span className={r.passed ? "text-good" : "text-bad"}>
              {r.correct}/{r.quotaTarget}
            </span>
          </span>
          <span>
            <span className="text-bevelDark">MISSED </span>
            <span className="text-ink">{r.missed}</span>
          </span>
          <span>
            <span className="text-bevelDark">WRONG </span>
            <span className="text-ink">{r.wrong}</span>
          </span>
          <span>
            <span className="text-bevelDark">ACC </span>
            <span className="text-ink">{Math.round(r.accuracy * 100)}%</span>
          </span>
        </BevelPanel>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <PixelButton variant={r.passed ? "good" : "warn"} full onClick={continueFromResult}>
            {r.passed ? "Continue ▶" : "Retry ↻"}
          </PixelButton>
          <PixelButton variant="plain" full onClick={() => setScreen("landing")}>
            ⌂ Menu
          </PixelButton>
        </div>
      </div>
    );
  }

  if (screen === "end") {
    const a = aggRef.current;
    const accuracy = precision(a.correct, a.missed, a.wrong);
    const grade = gradeRun({
      correct: a.correct,
      presented: a.presented,
      missed: a.missed,
      wrong: a.wrong,
    });
    const isCampaign = mode === "campaign";
    const img = images.map[level];
    const levelTitle = LEVELS[level - 1].image.title;

    const hasNext = isCampaign && level < TOTAL_LEVELS;
    const primaryLabel = isCampaign
      ? hasNext
        ? "Next Level ▶"
        : "Replay Level ↻"
      : "Play Again ↻";
    const onPrimary = isCampaign
      ? () => startCampaignAt(hasNext ? level + 1 : level, 0)
      : () => startSpeedrun();

    return (
      <EndScreen
        heading={isCampaign ? "LEVEL COMPLETE" : "RUN COMPLETE"}
        image={img}
        title={isCampaign ? levelTitle : "SPEEDRUN"}
        subtitle={isCampaign ? `Level ${level} cleared` : "All 5 levels"}
        timeMs={clock.ms}
        grade={grade}
        accuracy={accuracy}
        score={a.score}
        stars={isCampaign && lastResult ? lastResult.stars : 0}
        isNewPB={newPBRef.current}
        primaryLabel={primaryLabel}
        onPrimary={onPrimary}
        onMenu={() => setScreen("landing")}
        onShareTrack={() => track(EVENTS.share)}
      />
    );
  }

  return null;
}
