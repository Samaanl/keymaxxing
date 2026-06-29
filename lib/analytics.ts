/** Thin, guarded GoatCounter event wrapper. No-ops if the script hasn't loaded. */

declare global {
  interface Window {
    goatcounter?: {
      count: (opts: { path: string; title?: string; event?: boolean }) => void;
    };
  }
}

export function track(path: string, title?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.goatcounter?.count({ path: `event/${path}`, title: title ?? path, event: true });
  } catch {
    /* analytics must never break gameplay */
  }
}

/** Bucket a session length (ms) into a coarse label for aggregation. */
export function sessionBucket(ms: number): string {
  const min = ms / 60000;
  if (min < 1) return "lt1m";
  if (min < 3) return "1to3m";
  if (min < 5) return "3to5m";
  if (min < 10) return "5to10m";
  if (min < 20) return "10to20m";
  return "gt20m";
}
