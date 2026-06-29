import type { TileRect } from "./engine/types";

/**
 * Compute the source-rectangle for every tile of an N x N grid over an image.
 * Uses the image's real (natural) dimensions — never assumes square.
 */
export function computeTileRects(natW: number, natH: number, grid: number): TileRect[] {
  const sw = natW / grid;
  const sh = natH / grid;
  const rects: TileRect[] = [];
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      rects.push({ sx: col * sw, sy: row * sh, sw, sh });
    }
  }
  return rects;
}

/** CSS background-position (%) for tile index in an N x N sprite sheet. */
export function tileBackgroundPosition(index: number, grid: number): { x: number; y: number } {
  if (grid <= 1) return { x: 0, y: 0 };
  const row = Math.floor(index / grid);
  const col = index % grid;
  return {
    x: (col / (grid - 1)) * 100,
    y: (row / (grid - 1)) * 100,
  };
}

/**
 * Crop one tile into a standalone, cached, pixelated sprite canvas for the belt.
 * Distortion-free: the sprite keeps the tile's source aspect ratio.
 */
export function cropChunkSprite(
  img: HTMLImageElement | HTMLCanvasElement,
  rect: TileRect,
  wPx: number,
  hPx: number,
  dpr: number
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(wPx * dpr));
  c.height = Math.max(1, Math.round(hPx * dpr));
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false; // crisp pixel zoom = on-brand
  ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, c.width, c.height);
  return c;
}
