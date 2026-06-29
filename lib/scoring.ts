/** Pure scoring / rating helpers. No DOM, no state. */

export const POINTS = {
  correctBase: 10,
  wrong: -5,
  miss: -3,
} as const;

/** Streak -> score multiplier (tiered). */
export function multiplierForStreak(streak: number): number {
  if (streak >= 12) return 3;
  if (streak >= 8) return 2.5;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

/** Points awarded for a correct hit at a given (already-incremented) streak. */
export function correctPoints(streak: number): number {
  return Math.round(POINTS.correctBase * multiplierForStreak(streak));
}

export interface StarInput {
  correct: number;
  presented: number;
  missed: number;
  wrong: number;
}

/** 1..3 stars for a passed sub-level. */
export function computeStars({ correct, presented, missed, wrong }: StarInput): number {
  const acc = presented > 0 ? correct / presented : 0;
  if (acc >= 0.9 && missed <= 1 && wrong <= 1) return 3;
  if (acc >= 0.7) return 2;
  return 1;
}

export type Grade = "S" | "A" | "B" | "C" | "F";

export interface GradeInput {
  correct: number;
  presented: number;
  missed: number;
  wrong: number;
}

/** Precision: correct out of every action taken (hits, misses, wrong clicks). */
export function precision(correct: number, missed: number, wrong: number): number {
  const denom = correct + missed + wrong;
  return denom > 0 ? correct / denom : 0;
}

/** Letter grade for a completed run (or level) — based on precision. */
export function gradeRun({ correct, missed, wrong }: GradeInput): Grade {
  const acc = precision(correct, missed, wrong);
  const mistakes = missed + wrong;
  if (acc >= 0.97 && mistakes <= 1) return "S";
  if (acc >= 0.9) return "A";
  if (acc >= 0.75) return "B";
  if (acc >= 0.5) return "C";
  return "F";
}

export const GRADE_COLOR: Record<Grade, string> = {
  S: "#f4c20d",
  A: "#3ec45a",
  B: "#2bb6e6",
  C: "#e9913b",
  F: "#e94b4b",
};

/** mm:ss.cs for the speedrun clock. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
