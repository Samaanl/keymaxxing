/** Versioned localStorage wrapper. All reads are defensive (SSR-safe). */

const KEY = "pixrecall:v1";
const VERSION = 1;

export interface Settings {
  muted: boolean;
  musicVol: number;
  sfxVol: number;
  dev: boolean;
}

export interface SaveData {
  version: number;
  settings: Settings;
  pb: {
    speedrunMs: number | null;
    perLevelMs: Record<number, number | null>;
  };
  progress: {
    unlockedLevel: number; // 1..5
    stars: Record<string, number>; // "level-sub" -> 1..3
  };
  nickname: string;
}

function defaults(): SaveData {
  return {
    version: VERSION,
    settings: { muted: false, musicVol: 0.5, sfxVol: 0.8, dev: false },
    pb: { speedrunMs: null, perLevelMs: {} },
    progress: { unlockedLevel: 1, stars: {} },
    nickname: "",
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    // shallow-merge over defaults to tolerate older/partial saves
    const d = defaults();
    return {
      ...d,
      ...parsed,
      settings: { ...d.settings, ...(parsed.settings ?? {}) },
      pb: { ...d.pb, ...(parsed.pb ?? {}), perLevelMs: { ...(parsed.pb?.perLevelMs ?? {}) } },
      progress: {
        ...d.progress,
        ...(parsed.progress ?? {}),
        stars: { ...(parsed.progress?.stars ?? {}) },
      },
      version: VERSION,
    };
  } catch {
    return defaults();
  }
}

function write(data: SaveData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota / privacy mode — ignore */
  }
}

export function updateSave(mutator: (s: SaveData) => void): SaveData {
  const s = loadSave();
  mutator(s);
  write(s);
  return s;
}

export const starKey = (level: number, sub: number) => `${level}-${sub}`;

/** Record stars for a sub-level, keeping the best ever. */
export function recordStars(level: number, sub: number, stars: number): SaveData {
  return updateSave((s) => {
    const k = starKey(level, sub);
    s.progress.stars[k] = Math.max(s.progress.stars[k] ?? 0, stars);
  });
}

export function unlockLevel(level: number): SaveData {
  return updateSave((s) => {
    s.progress.unlockedLevel = Math.max(s.progress.unlockedLevel, level);
  });
}

export function recordSpeedrunPB(ms: number): { save: SaveData; isNew: boolean } {
  const cur = loadSave().pb.speedrunMs;
  const isNew = cur === null || ms < cur;
  const save = updateSave((s) => {
    if (s.pb.speedrunMs === null || ms < s.pb.speedrunMs) s.pb.speedrunMs = ms;
  });
  return { save, isNew };
}

export function recordLevelPB(level: number, ms: number): { save: SaveData; isNew: boolean } {
  const cur = loadSave().pb.perLevelMs[level] ?? null;
  const isNew = cur === null || ms < cur;
  const save = updateSave((s) => {
    const prev = s.pb.perLevelMs[level] ?? null;
    if (prev === null || ms < prev) s.pb.perLevelMs[level] = ms;
  });
  return { save, isNew };
}

export function saveSettings(settings: Settings): SaveData {
  return updateSave((s) => {
    s.settings = settings;
  });
}

export function saveNickname(name: string): SaveData {
  return updateSave((s) => {
    s.nickname = name.slice(0, 16);
  });
}

export function saveDev(dev: boolean): SaveData {
  return updateSave((s) => {
    s.settings.dev = dev;
  });
}

/** Highest sub-level reached for a level: completed sub-levels (those with a
 * star record) plus the next one. dev unlocks them all. */
export function unlockedSubLevel(save: SaveData, level: number, subCount: number): number {
  let highestCompleted = -1;
  for (let s = 0; s < subCount; s++) {
    if ((save.progress.stars[starKey(level, s)] ?? 0) > 0) highestCompleted = s;
  }
  return Math.min(subCount - 1, highestCompleted + 1);
}
