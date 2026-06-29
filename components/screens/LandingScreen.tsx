"use client";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { formatTime } from "@/lib/scoring";
import { PixelButton } from "@/components/ui/PixelButton";
import { Marquee } from "@/components/ui/Marquee";
import { SevenSegment } from "@/components/ui/SevenSegment";
import { MuteToggle } from "@/components/hud/SettingsBar";
import { BevelPanel } from "@/components/ui/BevelPanel";

interface Props {
  onPlay: () => void;
  onSpeedrun: () => void;
  bestSpeedrunMs: number | null;
  srcs: string[];
  dev: boolean;
  onEnableDev: () => void;
  onDisableDev: () => void;
}

const DEV_CODE = "DROOL";

export function LandingScreen({
  onPlay,
  onSpeedrun,
  bestSpeedrunMs,
  srcs,
  dev,
  onEnableDev,
  onDisableDev,
}: Props) {
  const [taps, setTaps] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  const tapSecret = () => {
    setTaps((t) => {
      const n = t + 1;
      if (n >= 20) {
        setShowCode(true);
        return 0;
      }
      return n;
    });
  };

  const submitCode = () => {
    if (code.trim().toUpperCase() === DEV_CODE) {
      onEnableDev();
      setShowCode(false);
      setCode("");
      setErr(false);
    } else {
      setErr(true);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div className="absolute right-3 top-3 z-10">
        <MuteToggle />
      </div>

      {dev && (
        <button
          type="button"
          onClick={onDisableDev}
          className="bevel btn-press absolute left-3 top-3 z-10 border-2 border-ink bg-good px-2 py-1 font-pixel text-[9px] text-ink"
          title="Disable developer mode"
        >
          DEV MODE ✕
        </button>
      )}

      <div className="pt-6">
        <Marquee srcs={srcs} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-5 py-8 text-center">
        <div>
          <h1 className="font-pixel text-3xl leading-tight text-ink sm:text-5xl">
            PIX<span className="text-drool">RECALL</span>
          </h1>
          <div className="mx-auto mt-1 h-1 w-24 bg-drool" />
        </div>
        <p className="max-w-md font-term text-lg uppercase text-bevelDark sm:text-xl">
          {BRAND.tagline} {BRAND.blurb}
        </p>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <PixelButton variant="primary" full onClick={onPlay} className="!text-sm sm:!text-base">
            ▶ Play
          </PixelButton>
          <PixelButton variant="warn" full onClick={onSpeedrun}>
            ⏱ Speedrun Mode
          </PixelButton>
          <PixelButton variant="plain" full disabled title="Coming soon">
            📅 Daily Challenge — Soon
          </PixelButton>
        </div>

        {bestSpeedrunMs !== null && (
          <div className="flex items-center gap-2 font-term text-sm uppercase text-bevelDark">
            <span>Best run</span>
            <SevenSegment value={formatTime(bestSpeedrunMs)} color="#f4c20d" className="text-base" />
          </div>
        )}

        {showCode && (
          <BevelPanel className="flex flex-col items-center gap-2 p-4">
            <span className="font-pixel text-[10px] text-bevelDark">ENTER ACCESS CODE</span>
            <input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setErr(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && submitCode()}
              className="w-40 border-2 border-ink bg-paper px-2 py-1 text-center font-term text-lg uppercase text-ink outline-none"
              placeholder="••••"
            />
            <div className="flex gap-2">
              <PixelButton variant="good" onClick={submitCode}>
                Enter
              </PixelButton>
              <PixelButton variant="plain" onClick={() => setShowCode(false)}>
                Cancel
              </PixelButton>
            </div>
            {err && <span className="font-term text-sm text-bad">WRONG CODE</span>}
          </BevelPanel>
        )}
      </div>

      <div className="relative pb-4">
        <Marquee srcs={[...srcs].reverse()} />
        {/* secret dev trigger: tap this corner 5 times */}
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={tapSecret}
          className="absolute bottom-0 right-0 h-14 w-14 opacity-0"
        />
      </div>
    </div>
  );
}
