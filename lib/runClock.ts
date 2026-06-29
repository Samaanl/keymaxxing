/**
 * Accumulating stopwatch for the speedrun timer.
 * Only counts time while explicitly running (paused during menus / hidden tab),
 * so it measures actual gameplay time and stays fair.
 */
export class RunClock {
  private accumulated = 0; // ms banked from finished running spans
  private startedAt: number | null = null; // perf.now() when current span began

  start(): void {
    if (this.startedAt === null) this.startedAt = performance.now();
  }

  pause(): void {
    if (this.startedAt !== null) {
      this.accumulated += performance.now() - this.startedAt;
      this.startedAt = null;
    }
  }

  reset(): void {
    this.accumulated = 0;
    this.startedAt = null;
  }

  get ms(): number {
    return this.accumulated + (this.startedAt !== null ? performance.now() - this.startedAt : 0);
  }

  get running(): boolean {
    return this.startedAt !== null;
  }
}
