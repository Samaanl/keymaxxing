export type GridSize = 3 | 4 | 6 | 8;

export interface TileRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface LevelImage {
  id: number; // 1..5
  src: string; // /images/levelN.ext
  width: number; // natural width (for aspect ratio before load)
  height: number;
  title: string; // short display name
  blurb: string; // flavor text
}

export interface SubLevelConfig {
  grid: GridSize;
  beltCapacity: number; // max live chunks on the belt
  quotaTarget: number; // correct matches needed to pass
  quotaOutOf: number; // total chunks presented this sub-level
  chunkSeconds: number; // seconds for a chunk to cross the belt
}

export interface LevelConfig {
  image: LevelImage;
  subLevels: SubLevelConfig[]; // length 4
}

export interface Chunk {
  id: number;
  tileIndex: number;
  x: number; // left edge, in belt CSS px
  w: number; // draw width (CSS px)
  h: number; // draw height (CSS px)
  sprite: HTMLCanvasElement; // pre-cropped, cached
  state: "live" | "resolved";
}

export interface HudSnapshot {
  score: number;
  streak: number;
  multiplier: number;
  correct: number;
  presented: number;
  quotaTarget: number;
  quotaOutOf: number;
}

export interface SubLevelResult {
  passed: boolean;
  level: number;
  sub: number; // 0..3
  correct: number;
  presented: number;
  quotaTarget: number;
  wrong: number; // clicks that hit no live chunk
  missed: number; // chunks that left unmatched
  accuracy: number; // correct / presented (0..1)
  maxStreak: number;
  stars: number; // 1..3 (0 if failed)
  score: number;
  elapsedMs: number;
}

export type EngineEvent =
  | { type: "correct"; tileIndex: number; points: number; streak: number; multiplier: number }
  | { type: "wrong"; tileIndex: number }
  | { type: "miss"; tileIndex: number }
  | { type: "streakUp"; streak: number; multiplier: number }
  | { type: "complete"; result: SubLevelResult };

export type FlashKind = "good" | "bad";
