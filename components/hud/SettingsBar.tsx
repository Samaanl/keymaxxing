"use client";
import { useAudio } from "@/components/AudioProvider";

export function MuteToggle({ className = "" }: { className?: string }) {
  const audio = useAudio();
  return (
    <button
      type="button"
      aria-label={audio.muted ? "Unmute" : "Mute"}
      onClick={() => audio.setMuted(!audio.muted)}
      className={`bevel btn-press border-2 border-ink bg-panel px-2 py-1 font-term text-lg leading-none transition-transform ${className}`}
    >
      {audio.muted ? "🔇" : "🔊"}
    </button>
  );
}
