"use client";
import { formatTime, GRADE_COLOR, type Grade } from "@/lib/scoring";
import { PixelButton } from "@/components/ui/PixelButton";
import { BevelPanel } from "@/components/ui/BevelPanel";
import { Stars } from "@/components/ui/Stars";
import { ShareSheet } from "@/components/share/ShareSheet";

interface Props {
  heading: string; // "LEVEL COMPLETE" / "RUN COMPLETE" / "RUN OVER"
  image: HTMLImageElement;
  title: string; // level title or "SPEEDRUN"
  subtitle: string;
  timeMs: number;
  grade: Grade;
  accuracy: number;
  score: number;
  stars: number; // 0 hides
  isNewPB: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  onMenu: () => void;
  onShareTrack?: () => void;
}

export function EndScreen(props: Props) {
  const timeText = formatTime(props.timeMs);
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col items-center gap-4 p-4 py-6">
      <h2 className="font-pixel text-xl text-ink sm:text-2xl">{props.heading}</h2>

      {props.isNewPB && (
        <div className="font-pixel text-xs text-bad animate-pop">★ NEW PERSONAL BEST ★</div>
      )}

      <BevelPanel className="flex w-full max-w-sm items-center justify-between gap-3 p-4">
        <div
          className="font-pixel text-7xl leading-none"
          style={{ color: GRADE_COLOR[props.grade], textShadow: "2px 2px 0 #181820" }}
        >
          {props.grade}
        </div>
        <div className="flex flex-col items-end gap-1 font-term text-lg">
          <div>
            <span className="text-bevelDark">TIME </span>
            <span className="text-ink">{timeText}</span>
          </div>
          <div>
            <span className="text-bevelDark">ACC </span>
            <span className="text-ink">{Math.round(props.accuracy * 100)}%</span>
          </div>
          <div>
            <span className="text-bevelDark">SCORE </span>
            <span className="text-ink">{props.score}</span>
          </div>
          {props.stars > 0 && <Stars count={props.stars} size="text-xl" />}
        </div>
      </BevelPanel>

      <ShareSheet
        image={props.image}
        title={props.title}
        subtitle={props.subtitle}
        grade={props.grade}
        stars={props.stars}
        timeText={timeText}
        accuracy={props.accuracy}
        score={props.score}
        onShareTrack={props.onShareTrack}
      />

      <div className="flex w-full max-w-sm flex-col gap-2">
        <PixelButton variant="primary" full onClick={props.onPrimary}>
          {props.primaryLabel}
        </PixelButton>
        <PixelButton variant="plain" full onClick={props.onMenu}>
          ⌂ Menu
        </PixelButton>
      </div>
    </div>
  );
}
