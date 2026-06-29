/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import { pixelFont, termFont } from "@/app/fonts";
import {
  copyImage,
  downloadBlob,
  nativeShareImage,
  openXCompose,
  renderScoreCard,
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
    setTimeout(() => setStatus(""), 2200);
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
            const ok = await nativeShareImage(blob);
            if (!ok) {
              const copied = await copyImage(blob);
              flash(copied ? "Image copied to clipboard" : "Use Save PNG instead");
            }
          }}
        >
          📤 Share PNG
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
          disabled={!blob}
          onClick={async () => {
            if (!blob) return;
            const ok = await copyImage(blob);
            flash(ok ? "Image copied!" : "Copy not supported — use Save PNG");
          }}
        >
          📋 Copy PNG
        </PixelButton>
        <PixelButton
          variant="plain"
          disabled={!blob}
          onClick={async () => {
            if (!blob) return;
            onShareTrack?.();
            openXCompose(); // open synchronously (avoids popup blocker)
            const ok = await copyImage(blob);
            flash(ok ? "PNG copied — paste into X (Ctrl/⌘+V)" : "Save the PNG, then attach it on X");
          }}
        >
          𝕏 Post
        </PixelButton>
      </div>
      <p className="h-4 px-2 text-center font-term text-sm uppercase text-good">{status}</p>
    </div>
  );
}
