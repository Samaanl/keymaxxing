import type { LevelConfig, LevelImage, SubLevelConfig } from "./engine/types";

/**
 * The 5 drooling-cat meme images, ordered easy -> hard by visual difficulty.
 * Files live in /public/images (moved + renamed from the originals).
 */
export const LEVEL_IMAGES: LevelImage[] = [
  {
    id: 1,
    src: "/images/level1.jpg", // was HKYtR09bcAAOiU9.jpg
    width: 680,
    height: 614,
    title: "DOUBLE TROUBLE",
    blurb: "Two drooling kittens. Clean and clear — learn the ropes here.",
  },
  {
    id: 2,
    src: "/images/level2.png", // was 1meme.png
    width: 500,
    height: 333,
    title: "THE HORDE",
    blurb: "Hundreds of cats, all drooling. Good luck telling them apart.",
  },
  {
    id: 3,
    src: "/images/level3.png", // was meme.png
    width: 1206,
    height: 724,
    title: "THE CREATION",
    blurb: "A masterpiece of drool. Wide, sprawling, full of detail.",
  },
  {
    id: 4,
    src: "/images/level4.jpg", // was HKiyfM4aMAA2M6O.jpg
    width: 986,
    height: 877,
    title: "NIGHT SHIFT",
    blurb: "A cat, a laptop, the dark. Squint hard.",
  },
  {
    id: 5,
    src: "/images/level5.jpg", // was drooling-cat-meme.jpg
    width: 680,
    height: 544,
    title: "FRIDGE RAID",
    blurb: "Black-and-white, low light, max cheese. The final boss.",
  },
];

/** Base difficulty ladder shared by every level. */
const BASE_SUBLEVELS: SubLevelConfig[] = [
  { grid: 3, beltCapacity: 1, quotaTarget: 7, quotaOutOf: 9, chunkSeconds: 5.0 },
  { grid: 4, beltCapacity: 2, quotaTarget: 10, quotaOutOf: 14, chunkSeconds: 4.3 },
  { grid: 6, beltCapacity: 3, quotaTarget: 14, quotaOutOf: 20, chunkSeconds: 3.5 },
  { grid: 8, beltCapacity: 4, quotaTarget: 19, quotaOutOf: 28, chunkSeconds: 2.9 },
];

/** Later levels run the belt a little faster (shorter cross time). */
const LEVEL_SPEED_FACTOR = [1.0, 0.96, 0.92, 0.88, 0.82];

export const LEVELS: LevelConfig[] = LEVEL_IMAGES.map((image, i) => ({
  image,
  subLevels: BASE_SUBLEVELS.map((sl) => ({
    ...sl,
    chunkSeconds: +(sl.chunkSeconds * LEVEL_SPEED_FACTOR[i]).toFixed(2),
  })),
}));

export const TOTAL_LEVELS = LEVELS.length; // 5
export const SUBLEVELS_PER_LEVEL = BASE_SUBLEVELS.length; // 4

export const SPEED_LABEL = ["SLOW", "MEDIUM", "FAST", "VERY FAST"];

export function getLevel(level: number): LevelConfig {
  return LEVELS[level - 1];
}

export function getSubLevel(level: number, sub: number): SubLevelConfig {
  return LEVELS[level - 1].subLevels[sub];
}
