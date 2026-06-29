import { computeTileRects, cropChunkSprite } from "../imageCropper";
import { POINTS, correctPoints, multiplierForStreak, computeStars } from "../scoring";
import type {
  Chunk,
  EngineEvent,
  FlashKind,
  HudSnapshot,
  SubLevelConfig,
  TileRect,
} from "./types";

export interface EngineConfig extends SubLevelConfig {
  image: HTMLImageElement;
  natW: number;
  natH: number;
  level: number;
  sub: number;
  dev?: boolean; // dev mode: emit guide hints
}

export interface EngineCallbacks {
  onEvent: (e: EngineEvent) => void;
  onHud: (s: HudSnapshot) => void;
  onFlash: (tileIndex: number, kind: FlashKind) => void;
  onGuide?: (tiles: number[]) => void; // tiles with a live chunk (dev guide)
}

const CHUNK_HEIGHT_FRACTION = 0.72;

export class GameEngine {
  private cfg: EngineConfig;
  private cb: EngineCallbacks;
  private dpr: number;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private beltW = 0;
  private beltH = 0;

  private tileRects: TileRect[];
  private tileAspect: number; // sw / sh
  private nTiles: number;

  private chunks: Chunk[] = [];
  private nextId = 1;
  private lastSpawnTile = -1;

  private elapsedMs = 0;
  private nextSpawnAt = 0;
  private presented = 0;

  // counters
  private score = 0;
  private streak = 0;
  private maxStreak = 0;
  private correct = 0;
  private wrong = 0;
  private missed = 0;

  private running = false;
  private completed = false;
  private raf = 0;
  private lastTs = 0;

  constructor(cfg: EngineConfig, cb: EngineCallbacks) {
    this.cfg = cfg;
    this.cb = cb;
    this.dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    this.nTiles = cfg.grid * cfg.grid;
    this.tileRects = computeTileRects(cfg.natW, cfg.natH, cfg.grid);
    this.tileAspect = cfg.natW / cfg.natH; // each square-grid tile shares the image aspect
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  setBeltSize(cssW: number, cssH: number): void {
    this.beltW = cssW;
    this.beltH = cssH;
    if (this.canvas) {
      this.canvas.width = Math.round(cssW * this.dpr);
      this.canvas.height = Math.round(cssH * this.dpr);
      this.canvas.style.width = `${cssW}px`;
      this.canvas.style.height = `${cssH}px`;
    }
    // Re-fit any live chunks (and re-crop for crisp scaling).
    for (const ch of this.chunks) {
      const { w, h } = this.chunkDims();
      ch.w = w;
      ch.h = h;
      ch.sprite = cropChunkSprite(this.cfg.image, this.tileRects[ch.tileIndex], w, h, this.dpr);
    }
    if (!this.running) this.draw();
  }

  private chunkDims(): { w: number; h: number } {
    let h = this.beltH * CHUNK_HEIGHT_FRACTION;
    let w = h * this.tileAspect;
    const maxW = this.beltW * 0.5;
    if (w > maxW) {
      w = maxW;
      h = w / this.tileAspect;
    }
    return { w, h };
  }

  start(): void {
    if (this.running || this.completed) return;
    this.running = true;
    this.lastTs = performance.now();
    this.nextSpawnAt = this.elapsedMs + 450; // brief lead-in
    this.emitHud();
    this.raf = requestAnimationFrame(this.loop);
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    if (this.completed) return;
    this.running = true;
    this.lastTs = performance.now();
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.chunks = [];
    this.canvas = null;
    this.ctx = null;
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    let dt = now - this.lastTs;
    this.lastTs = now;
    if (dt > 100) dt = 100; // clamp huge gaps (tab switch)
    if (this.running) {
      this.elapsedMs += dt;
      this.update(dt);
    }
    this.draw();
  };

  private update(dt: number): void {
    const { w } = this.chunkDims();
    const traverse = this.beltW + w;
    const speed = traverse / (this.cfg.chunkSeconds * 1000); // px per ms

    // move + expire
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const ch = this.chunks[i];
      if (ch.state === "live") {
        ch.x -= speed * dt;
        if (ch.x + ch.w < 0) {
          this.chunks.splice(i, 1);
          this.onMiss(ch.tileIndex);
        }
      }
    }

    // spawn
    if (
      this.presented < this.cfg.quotaOutOf &&
      this.chunks.length < this.cfg.beltCapacity &&
      this.elapsedMs >= this.nextSpawnAt
    ) {
      this.spawn();
      const interval = (this.cfg.chunkSeconds * 1000) / this.cfg.beltCapacity;
      this.nextSpawnAt = this.elapsedMs + interval * (0.85 + Math.random() * 0.3);
    }

    // completion
    if (!this.completed && this.presented >= this.cfg.quotaOutOf && this.chunks.length === 0) {
      this.complete();
    }
  }

  private spawn(): void {
    let tile = Math.floor(Math.random() * this.nTiles);
    if (this.nTiles > 1 && tile === this.lastSpawnTile) {
      tile = (tile + 1 + Math.floor(Math.random() * (this.nTiles - 1))) % this.nTiles;
    }
    this.lastSpawnTile = tile;
    const { w, h } = this.chunkDims();
    const sprite = cropChunkSprite(this.cfg.image, this.tileRects[tile], w, h, this.dpr);
    this.chunks.push({
      id: this.nextId++,
      tileIndex: tile,
      x: this.beltW,
      w,
      h,
      sprite,
      state: "live",
    });
    this.presented++;
    this.emitGuide();
  }

  private emitGuide(): void {
    if (!this.cfg.dev || !this.cb.onGuide) return;
    const tiles = Array.from(new Set(this.chunks.filter((c) => c.state === "live").map((c) => c.tileIndex)));
    this.cb.onGuide(tiles);
  }

  /** Dev: instantly clear the sub-level as a perfect pass (for testing). */
  forceWin(): void {
    if (this.completed) return;
    this.correct = this.cfg.quotaOutOf;
    this.presented = this.cfg.quotaOutOf;
    this.missed = 0;
    this.wrong = 0;
    this.maxStreak = Math.max(this.maxStreak, this.correct);
    this.chunks = [];
    this.emitGuide();
    this.complete();
  }

  handleTileClick(tileIndex: number): void {
    if (!this.running || this.completed) return;
    // oldest live chunk matching this tile
    const idx = this.chunks.findIndex((c) => c.state === "live" && c.tileIndex === tileIndex);
    if (idx >= 0) {
      const ch = this.chunks[idx];
      this.chunks.splice(idx, 1);
      this.correct++;
      this.streak++;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      const pts = correctPoints(this.streak);
      this.score += pts;
      const mult = multiplierForStreak(this.streak);
      this.cb.onFlash(tileIndex, "good");
      this.cb.onEvent({ type: "correct", tileIndex, points: pts, streak: this.streak, multiplier: mult });
      if (this.streak === 3 || this.streak === 5 || this.streak === 8 || this.streak === 12) {
        this.cb.onEvent({ type: "streakUp", streak: this.streak, multiplier: mult });
      }
      this.emitGuide();
      this.emitHud();
      if (!this.completed && this.presented >= this.cfg.quotaOutOf && this.chunks.length === 0) {
        this.complete();
      }
    } else {
      this.wrong++;
      this.score = Math.max(0, this.score + POINTS.wrong);
      this.streak = 0;
      this.cb.onFlash(tileIndex, "bad");
      this.cb.onEvent({ type: "wrong", tileIndex });
      this.emitHud();
    }
  }

  private onMiss(tileIndex: number): void {
    this.missed++;
    this.score = Math.max(0, this.score + POINTS.miss);
    this.streak = 0;
    this.cb.onEvent({ type: "miss", tileIndex });
    this.emitGuide();
    this.emitHud();
  }

  private complete(): void {
    this.completed = true;
    this.running = false;
    const presented = this.presented;
    const denom = this.correct + this.missed + this.wrong;
    const accuracy = denom > 0 ? this.correct / denom : 0;
    const passed = this.correct >= this.cfg.quotaTarget;
    const stars = passed
      ? computeStars({ correct: this.correct, presented, missed: this.missed, wrong: this.wrong })
      : 0;
    this.cb.onEvent({
      type: "complete",
      result: {
        passed,
        level: this.cfg.level,
        sub: this.cfg.sub,
        correct: this.correct,
        presented,
        quotaTarget: this.cfg.quotaTarget,
        wrong: this.wrong,
        missed: this.missed,
        accuracy,
        maxStreak: this.maxStreak,
        stars,
        score: this.score,
        elapsedMs: this.elapsedMs,
      },
    });
  }

  private emitHud(): void {
    this.cb.onHud({
      score: this.score,
      streak: this.streak,
      multiplier: multiplierForStreak(this.streak),
      correct: this.correct,
      presented: this.presented,
      quotaTarget: this.cfg.quotaTarget,
      quotaOutOf: this.cfg.quotaOutOf,
    });
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx || this.beltW === 0 || this.beltH === 0) return;
    const W = this.beltW;
    const H = this.beltH;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // belt body
    ctx.fillStyle = "#2a2a31";
    ctx.fillRect(0, 0, W, H);

    // scrolling tread ridges
    const spacing = 28;
    const shift = (this.elapsedMs * 0.06) % spacing;
    ctx.fillStyle = "#33333c";
    for (let x = -shift - spacing; x < W + spacing; x += spacing) {
      ctx.fillRect(x, 6, spacing * 0.55, H - 12);
    }

    // rails + bolts
    ctx.fillStyle = "#15151b";
    ctx.fillRect(0, 0, W, 5);
    ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = "#4a4a55";
    const boltGap = 52;
    const boltShift = (this.elapsedMs * 0.06) % boltGap;
    for (let x = -boltShift; x < W; x += boltGap) {
      ctx.beginPath();
      ctx.arc(x + 8, 9, 2, 0, Math.PI * 2);
      ctx.arc(x + 8, H - 9, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // chunks
    for (const ch of this.chunks) {
      this.drawChunk(ctx, ch);
    }
  }

  private drawChunk(ctx: CanvasRenderingContext2D, ch: Chunk): void {
    const y = (this.beltH - ch.h) / 2;
    const pad = 4;
    // bevel frame
    ctx.fillStyle = "#fffdf5";
    ctx.fillRect(ch.x - pad, y - pad, ch.w + pad * 2, ch.h + pad * 2);
    ctx.fillStyle = "#8b8675";
    ctx.fillRect(ch.x, y + ch.h, ch.w + pad, pad);
    ctx.fillRect(ch.x + ch.w, y, pad, ch.h + pad);
    // sprite
    ctx.drawImage(ch.sprite, ch.x, y, ch.w, ch.h);
    // outline
    ctx.strokeStyle = "#181820";
    ctx.lineWidth = 2;
    ctx.strokeRect(ch.x - pad, y - pad, ch.w + pad * 2, ch.h + pad * 2);
  }
}
