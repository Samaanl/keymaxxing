import { BASS, LEAD, STEP_SECONDS, STEPS } from "./tunes";

/**
 * 100% procedural audio — no files. SFX are synthesized per-call; the chiptune
 * loop is a Web Audio look-ahead step sequencer. One shared AudioContext,
 * unlocked on the first user gesture (autoplay-policy compliant).
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private muted = false;
  private musicVol = 0.5;
  private sfxVol = 0.8;

  private musicPlaying = false;
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private noiseBuffer: AudioBuffer | null = null;
  private silentDone = false;

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(ctx.destination);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.master);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.master);

    // short white-noise buffer reused for hats / whoosh
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;

    this.ctx = ctx;
    return ctx;
  }

  /** Call from a user gesture (any tap/click/key). Idempotent + cheap once running. */
  async unlock(): Promise<void> {
    const ctx = this.ensure();
    try {
      if (ctx.state !== "running") await ctx.resume();
      // iOS/Safari needs an actual sound played inside the gesture to unlock.
      if (!this.silentDone && ctx.state === "running") {
        const src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        src.connect(ctx.destination);
        src.start(0);
        this.silentDone = true;
      }
    } catch {
      /* ignore */
    }
  }

  get isRunning(): boolean {
    return this.ctx?.state === "running";
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
  }

  setVolumes(musicVol: number, sfxVol: number): void {
    this.musicVol = musicVol;
    this.sfxVol = sfxVol;
    if (this.musicGain) this.musicGain.gain.value = musicVol;
    if (this.sfxGain) this.sfxGain.gain.value = sfxVol;
  }

  // ---- low-level voices -------------------------------------------------
  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    dest: GainNode,
    peak: number
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noise(start: number, dur: number, dest: GainNode, peak: number, freq = 4000, q = 1): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(freq, start);
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(start);
    src.stop(start + dur + 0.02);
    return undefined;
  }

  // ---- SFX --------------------------------------------------------------
  ding(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(880, t, 0.09, "square", this.sfxGain!, 0.25);
    this.tone(1320, t + 0.04, 0.1, "square", this.sfxGain!, 0.2);
  }

  buzz(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(150, t, 0.16, "sawtooth", this.sfxGain!, 0.25);
    this.tone(98, t, 0.16, "sawtooth", this.sfxGain!, 0.2);
  }

  whoosh(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1800, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.25);
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxGain!);
    src.start(t);
    src.stop(t + 0.3);
  }

  chime(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const seq = [523.25, 659.25, 783.99, 1046.5];
    seq.forEach((f, i) => this.tone(f, t + i * 0.08, 0.18, "square", this.sfxGain!, 0.2));
  }

  streak(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const seq = [660, 880, 1100];
    seq.forEach((f, i) => this.tone(f, t + i * 0.05, 0.08, "square", this.sfxGain!, 0.18));
  }

  // ---- music sequencer --------------------------------------------------
  startMusic(): void {
    if (!this.ctx) return;
    this.musicPlaying = true;
    this.startScheduler();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    this.stopScheduler();
  }

  private startScheduler(): void {
    if (this.schedulerTimer || !this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.schedulerTimer = setInterval(this.scheduler, 25);
  }

  private stopScheduler(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  get isMusicPlaying(): boolean {
    return this.musicPlaying;
  }

  private scheduler = (): void => {
    if (!this.ctx || !this.musicPlaying) return;
    const ahead = 0.12;
    while (this.nextNoteTime < this.ctx.currentTime + ahead) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += STEP_SECONDS;
      this.step = (this.step + 1) % STEPS;
    }
  };

  private scheduleStep(step: number, time: number): void {
    const lead = LEAD[step];
    if (lead) this.tone(lead, time, STEP_SECONDS * 0.95, "square", this.musicGain!, 0.16);
    const bass = BASS[step];
    if (bass) this.tone(bass, time, STEP_SECONDS * 1.7, "triangle", this.musicGain!, 0.22);
    if (step % 2 === 0) this.noise(time, 0.03, this.musicGain!, 0.04, 6000, 0.8);
  }

  // ---- visibility -------------------------------------------------------
  suspend(): void {
    this.stopScheduler(); // avoid burst-scheduling against a frozen clock
    if (this.ctx && this.ctx.state === "running") this.ctx.suspend().catch(() => {});
  }

  wake(): void {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    if (this.musicPlaying) this.startScheduler();
  }
}

let singleton: AudioEngine | null = null;
export function getAudio(): AudioEngine {
  if (!singleton) singleton = new AudioEngine();
  return singleton;
}
