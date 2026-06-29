/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { pixelFont, termFont } from "@/app/fonts";
import {
  buildEmojiResults,
  copyText,
  downloadBlob,
  nativeShare,
  renderScoreCard,
  tweetIntent,
} from "@/lib/share";
import type { Grade } from "@/lib/scoring";
import { PixelButton } from "@/components/ui/PixelButton";

interface Props {
  image: HTMLImageElement;
  title: string;
  subtitle: string;
  grade: Grade;
  stars: number;
  timeText: string;
  accuracy: number;
  score: number;
  onShareTrack?: () => void;
}

export function ShareSheet(props: Props) {
  const { image, title, subtitle, grade, stars, timeText, accuracy, score, onShareTrack } = props;
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("");

  const emoji = buildEmojiResults({ subtitle, timeText, accuracy, grade, stars });

  useEffect(() => {
    let alive = true;
    let objUrl: string | null = null;
    renderScoreCard({
      image,
      title,
      subtitle,
      grade,
      stars,
      timeText,
      accuracy,
      score,
      pixelFamily: pixelFont.style.fontFamily,
      termFamily: termFont.style.fontFamily,
    }).then((b) => {
      if (!alive) return;
      setBlob(b);
      objUrl = URL.createObjectURL(b);
      setUrl(objUrl);
    });
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [image, title, subtitle, grade, stars, timeText, accuracy, score]);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 1800);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-sm border-2 border-ink bg-paper">
        {url ? (
          <img src={url} alt="Your score card" className="block w-full" />
        ) : (
          <div className="grid aspect-[1200/630] place-items-center font-term text-bevelDark animate-blink">
            drawing card…
          </div>
        )}
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        <PixelButton
          variant="primary"
          disabled={!blob}
          onClick={async () => {
            if (!blob) return;
            onShareTrack?.();
            const ok = await nativeShare(blob, emoji);
            if (!ok) {
              const copied = await copyText(emoji);
              flash(copied ? "Copied results!" : "Use Save / X instead");
            }
          }}
        >
          📤 Share
        </PixelButton>
        <PixelButton
          variant="plain"
          disabled={!blob}
          onClick={() => {
            if (blob) downloadBlob(blob);
            flash("Saved PNG");
          }}
        >
          💾 Save PNG
        </PixelButton>
        <PixelButton
          variant="plain"
          onClick={async () => {
            const ok = await copyText(emoji);
            flash(ok ? "Copied!" : "Copy failed");
          }}
        >
          📋 Copy
        </PixelButton>
        <PixelButton
          variant="plain"
          onClick={() => {
            onShareTrack?.();
            window.open(tweetIntent(emoji), "_blank", "noopener,noreferrer");
          }}
        >
          𝕏 Post
        </PixelButton>
      </div>
      <p className="h-4 font-term text-sm uppercase text-good">{status}</p>
    </div>
  );
}
