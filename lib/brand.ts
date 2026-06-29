/** Central branding + identifiers for PixRecall. */
export const BRAND = {
  name: "PixRecall",
  tagline: "Match the tile. Beat the clock.",
  blurb: "Spot the drooling-cat tile before it slides off the belt.",
  // Fallback share URL; at runtime we prefer window.location.origin.
  url: "https://pixrecall.vercel.app",
  hashtag: "PixRecall",
} as const;

/** GoatCounter endpoint (site code: pix). */
export const GOATCOUNTER = "https://pix.goatcounter.com/count";

/** Analytics event paths. */
export const EVENTS = {
  startCampaign: "start-campaign",
  startSpeedrun: "start-speedrun",
  levelReached: (n: number) => `level-${n}-reached`,
  subCleared: (l: number, s: number) => `sublevel-${l}-${s}-cleared`,
  runComplete: "run-complete",
  levelComplete: (n: number) => `level-${n}-complete`,
  share: "share-clicked",
  session: (bucket: string) => `session-${bucket}`,
} as const;
