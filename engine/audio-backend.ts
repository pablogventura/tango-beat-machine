/**
 * Owns the shared AudioContext and transport clock for SoundFont playback.
 * No longer loads or plays WAV samples.
 */
export class AudioBackend {
  public ready = false;
  private zeroTime: number | null = null;
  private _context?: AudioContext;

  init(context = typeof AudioContext !== 'undefined' ? new AudioContext() : undefined) {
    this._context = context;
    this.ready = true;
    return Promise.resolve();
  }

  get context() {
    return this._context;
  }

  get whenReady() {
    return Promise.resolve();
  }

  /** Start the shared transport clock if it is not running yet. */
  ensureTimeline() {
    if (this.zeroTime === null && this.context) {
      this.zeroTime = this.context.currentTime;
    }
  }

  reset() {
    this.zeroTime = null;
  }

  getCurrentTime(): number {
    if (this.zeroTime == null || !this.context) {
      return 0;
    }
    return this.context.currentTime - this.zeroTime;
  }
}
