import { BRAND } from "./brand";
import { GRADE_COLOR, type Grade } from "./scoring";

export interface ScoreCardOpts {
  image: HTMLImageElement;
  title: string; // level title or "SPEEDRUN"
  subtitle: string; // e.g. "Level 3 cleared" / "Full run — all 5 levels"
  grade: Grade;
  stars: number; // 0..3 (0 = hide row)
  timeText: string;
  accuracy: number; // 0..1
  score: number;
  pixelFamily: string;
  termFamily: string;
}

export function shareUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return BRAND.url;
}

/** Wordle-style copy/paste summary. */
export function buildEmojiResults(opts: {
  subtitle: string;
  timeText: string;
  accuracy: number;
  grade: Grade;
  stars: number;
}): string {
  const filled = Math.round(opts.accuracy * 10);
  const bar = "🟩".repeat(filled) + "🟥".repeat(10 - filled);
  const stars = opts.stars > 0 ? "\n" + "⭐".repeat(opts.stars) : "";
  return (
    `${BRAND.name} — ${opts.subtitle}\n` +
    `⏱ ${opts.timeText}  🎯 ${Math.round(opts.accuracy * 100)}%  🏆 ${opts.grade}\n` +
    `${bar}${stars}\n` +
    `Can you beat it? ${shareUrl()}`
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw the branded score card and return a PNG blob. */
export async function renderScoreCard(opts: ScoreCardOpts): Promise<Blob> {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* ignore */
  }
  const W = 1200;
  const H = 630;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const pixel = opts.pixelFamily || "monospace";
  const term = opts.termFamily || "monospace";

  // background
  ctx.fillStyle = "#cfccbe";
  ctx.fillRect(0, 0, W, H);
  // scanlines
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // outer frame (bevel)
  ctx.fillStyle = "#fffdf5";
  ctx.fillRect(16, 16, W - 32, H - 32);
  ctx.fillStyle = "#8b8675";
  ctx.fillRect(24, 24, W - 40, H - 40);
  ctx.fillStyle = "#e7e4d7";
  ctx.fillRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = "#181820";
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, W - 32, H - 32);

  // header bar
  ctx.fillStyle = "#2bb6e6";
  ctx.fillRect(40, 44, W - 80, 86);
  ctx.strokeStyle = "#181820";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 44, W - 80, 86);
  ctx.fillStyle = "#181820";
  ctx.font = `40px ${pixel}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(BRAND.name.toUpperCase(), 64, 90);
  ctx.font = `20px ${term}`;
  ctx.textAlign = "right";
  ctx.fillText(BRAND.tagline.toUpperCase(), W - 64, 90);

  // cat thumbnail (left)
  const box = 360;
  const bx = 56;
  const by = 168;
  ctx.fillStyle = "#fffdf5";
  ctx.fillRect(bx - 6, by - 6, box + 12, box + 12);
  ctx.save();
  roundRect(ctx, bx, by, box, box, 6);
  ctx.clip();
  // cover-fit
  const img = opts.image;
  const ar = img.naturalWidth / img.naturalHeight;
  let dw = box;
  let dh = box;
  if (ar > 1) dw = box * ar;
  else dh = box / ar;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, bx + (box - dw) / 2, by + (box - dh) / 2, dw, dh);
  ctx.restore();
  ctx.strokeStyle = "#181820";
  ctx.lineWidth = 4;
  ctx.strokeRect(bx, by, box, box);

  // right column
  const rx = 470;
  ctx.textAlign = "left";
  ctx.fillStyle = "#181820";
  ctx.font = `22px ${pixel}`;
  ctx.fillText(opts.title.toUpperCase().slice(0, 18), rx, 196);
  ctx.font = `22px ${term}`;
  ctx.fillStyle = "#56524a";
  ctx.fillText(opts.subtitle.toUpperCase(), rx, 230);

  // big grade
  ctx.font = `150px ${pixel}`;
  ctx.fillStyle = GRADE_COLOR[opts.grade];
  ctx.fillText(opts.grade, rx, 350);
  // grade label
  ctx.font = `20px ${term}`;
  ctx.fillStyle = "#181820";
  ctx.fillText("GRADE", rx + 150, 320);
  // stars
  if (opts.stars > 0) {
    ctx.font = `34px ${term}`;
    ctx.fillStyle = "#f4c20d";
    ctx.fillText("★".repeat(opts.stars) + "☆".repeat(3 - opts.stars), rx + 150, 360);
  }

  // stats
  ctx.font = `30px ${term}`;
  const statY = 440;
  const stat = (label: string, val: string, x: number) => {
    ctx.fillStyle = "#56524a";
    ctx.fillText(label, x, statY);
    ctx.fillStyle = "#181820";
    ctx.font = `40px ${term}`;
    ctx.fillText(val, x, statY + 38);
    ctx.font = `30px ${term}`;
  };
  stat("TIME", opts.timeText, rx);
  stat("ACCURACY", `${Math.round(opts.accuracy * 100)}%`, rx + 250);
  stat("SCORE", String(opts.score), rx + 520);

  // footer
  ctx.fillStyle = "#1d86b8";
  ctx.font = `20px ${term}`;
  ctx.fillText(`CAN YOU BEAT IT?  ${shareUrl().replace(/^https?:\/\//, "")}`, rx, H - 70);

  return await new Promise<Blob>((resolve) =>
    c.toBlob((b) => resolve(b as Blob), "image/png")
  );
}

export async function nativeShare(blob: Blob, text: string): Promise<boolean> {
  const url = shareUrl();
  try {
    const file = new File([blob], "pixrecall.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: BRAND.name } as ShareData);
      return true;
    }
    if (navigator.share) {
      await navigator.share({ text, url, title: BRAND.name });
      return true;
    }
  } catch {
    /* user cancelled or unsupported */
  }
  return false;
}

export function downloadBlob(blob: Blob, filename = "pixrecall.png"): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function tweetIntent(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
