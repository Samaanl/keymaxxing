import { BRAND } from "@/lib/brand";

export function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-pixel text-2xl text-ink">{BRAND.name.toUpperCase()}</h1>
      <div className="h-4 w-56 max-w-[70vw] border-2 border-ink bg-paper">
        <div className="h-full bg-drool" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <p className="font-term text-sm uppercase text-bevelDark animate-blink">Loading cats…</p>
    </div>
  );
}
