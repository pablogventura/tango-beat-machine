import { InstrumentPlayer } from './instrument-player';
import {
  SampleManifest,
  buildSamplePathIndex,
  resolveSampleUrl,
  sampleUrl,
} from './sample-path';

const MANIFEST_URL = 'assets/audio/samples/manifest.json';

export class AudioBackend {
  public ready = false;
  private buffers = new Map<string, AudioBuffer>();
  private pathIndex = new Map<string, string>();
  private zeroTime: number | null = null;
  private _context?: AudioContext;
  private loadStarted = false;
  private loadPromise: Promise<void> | null = null;

  constructor(private readonly manifestUrl = MANIFEST_URL) {}

  init(context = typeof AudioContext !== 'undefined' ? new AudioContext() : undefined) {
    this._context = context;
    if (context && !this.loadStarted) {
      this.loadStarted = true;
      this.loadPromise = this.preloadSamples();
    }
    return this.loadPromise;
  }

  get context() {
    return this._context;
  }

  get whenReady() {
    return this.loadPromise ?? Promise.resolve();
  }

  private async preloadSamples() {
    const context = this._context;
    if (!context) {
      return;
    }

    try {
      const manifestRes = await fetch(this.manifestUrl);
      if (!manifestRes.ok) {
        throw new Error(`Failed to load sample manifest: ${manifestRes.status}`);
      }
      const manifest = (await manifestRes.json()) as SampleManifest;
      this.pathIndex = buildSamplePathIndex(manifest);

      await Promise.all(
        manifest.map(async (entry) => {
          const url = sampleUrl(entry.path);
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`Missing sample file for ${entry.sampleName}: ${url}`);
            return;
          }
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
          this.buffers.set(entry.sampleName, audioBuffer);
        }),
      );
    } catch (error) {
      console.error('Failed to preload audio samples', error);
    } finally {
      this.ready = true;
    }
  }

  play(sampleName: string, player: InstrumentPlayer, when: number, velocity?: number) {
    const context = this.context;
    if (!context) {
      return;
    }

    const buffer = this.buffers.get(sampleName);
    if (!buffer) {
      console.warn(`Unknown or unloaded sample: ${sampleName} (${resolveSampleUrl(sampleName, this.pathIndex)})`);
      return;
    }

    const bufferSource = context.createBufferSource();
    bufferSource.connect(player.createNoteDestination(velocity));
    bufferSource.buffer = buffer;
    if (this.zeroTime === null) {
      this.zeroTime = context.currentTime;
    }
    const startTime = this.zeroTime + when;
    bufferSource.start(Math.max(0, startTime));
    player.registerSample(bufferSource, startTime);
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
