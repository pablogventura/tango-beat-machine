import { IInstrument } from './machine-interfaces';

const LIBFLUIDSYNTH_URL = '/vendor/libfluidsynth-2.4.6.js';

const SOUNDFONT_URLS: Record<string, string> = {
  bandoneon: '/assets/audio/soundfonts/bandoneon_v2.sf2',
  gm: '/assets/audio/soundfonts/TimGM6mb.sf2',
};

type JsSynthModule = typeof import('js-synthesizer');

export interface SoundFontNoteRequest {
  instrument: IInstrument;
  midiNote: number;
  when: number;
  velocity?: number;
  durationSec?: number;
}

/**
 * FluidSynth-backed SoundFont player. Loaded lazily (e.g. when Tango is selected).
 * Note times use the same transport clock as AudioBackend (`getTransportTime`).
 */
export class SoundFontBackend {
  public ready = false;
  private synth: import('js-synthesizer').ISynthesizer | null = null;
  private audioNode: AudioNode | null = null;
  private context: AudioContext | null = null;
  private loadPromise: Promise<void> | null = null;
  private sfontIds = new Map<string, number>();
  private channelByInstrument = new Map<string, number>();
  private nextChannel = 0;
  private timersByInstrument = new Map<string, number[]>();
  private getTransportTime: () => number = () => 0;

  attachContext(context: AudioContext, getTransportTime?: () => number) {
    this.context = context;
    if (getTransportTime) {
      this.getTransportTime = getTransportTime;
    }
  }

  ensureLoaded(): Promise<void> {
    if (this.ready) {
      return Promise.resolve();
    }
    if (!this.loadPromise) {
      this.loadPromise = this.load().catch((error) => {
        this.loadPromise = null;
        this.ready = false;
        throw error;
      });
    }
    return this.loadPromise;
  }

  private async load() {
    const context = this.context;
    if (!context) {
      throw new Error('SoundFontBackend requires an AudioContext');
    }

    await loadScriptOnce(LIBFLUIDSYNTH_URL);
    const JSSynth = (await import('js-synthesizer')) as JsSynthModule;
    await JSSynth.waitForReady();

    const synth = new JSSynth.Synthesizer();
    synth.init(context.sampleRate);
    const node = synth.createAudioNode(context, 2048);
    node.connect(context.destination);

    this.synth = synth;
    this.audioNode = node;

    for (const [key, url] of Object.entries(SOUNDFONT_URLS)) {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to load soundfont ${key}: ${url}`);
        continue;
      }
      const buffer = await response.arrayBuffer();
      const id = await synth.loadSFont(buffer);
      this.sfontIds.set(key, id);
    }

    this.ready = true;
  }

  /** Cancel pending note timers and sounding notes for one instrument. */
  cancelInstrument(instrumentId: string) {
    const timers = this.timersByInstrument.get(instrumentId);
    if (timers) {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      this.timersByInstrument.delete(instrumentId);
    }
    const channel = this.channelByInstrument.get(instrumentId);
    if (channel != null && this.synth) {
      this.synth.midiAllNotesOff(channel);
      this.synth.midiAllSoundsOff(channel);
    }
  }

  reset() {
    for (const instrumentId of Array.from(this.timersByInstrument.keys())) {
      this.cancelInstrument(instrumentId);
    }
    this.timersByInstrument.clear();
    this.synth?.midiAllSoundsOff();
  }

  play(request: SoundFontNoteRequest) {
    const { instrument, midiNote, when, velocity, durationSec = 0.45 } = request;
    const synth = this.synth;
    if (!synth || !this.context || !this.ready) {
      console.warn('SoundFontBackend not ready');
      return;
    }

    // Skip notes that are already in the past (e.g. after a mid-playback program change).
    const transportNow = this.getTransportTime();
    if (when <= transportNow) {
      return;
    }

    const channel = this.getChannel(instrument);
    const sfontKey = instrument.soundfontId || 'gm';
    const sfontId = this.sfontIds.get(sfontKey) ?? this.sfontIds.get('gm');
    if (sfontId == null) {
      console.warn(`Unknown soundfont: ${sfontKey}`);
      return;
    }

    synth.midiProgramSelect(channel, sfontId, 0, instrument.midiProgram || 0);

    const delayMs = (when - transportNow) * 1000;
    const vel = Math.max(1, Math.min(127, Math.round((velocity ?? 1) * 100 * instrument.volume)));
    const instrumentTimers = this.timersByInstrument.get(instrument.id) ?? [];
    this.timersByInstrument.set(instrument.id, instrumentTimers);

    const onTimer = window.setTimeout(() => {
      synth.midiNoteOn(channel, midiNote, vel);
      const offTimer = window.setTimeout(() => {
        synth.midiNoteOff(channel, midiNote);
        this.removeTimer(instrument.id, offTimer);
      }, durationSec * 1000);
      instrumentTimers.push(offTimer);
      this.removeTimer(instrument.id, onTimer);
    }, delayMs);
    instrumentTimers.push(onTimer);
  }

  private removeTimer(instrumentId: string, timer: number) {
    const timers = this.timersByInstrument.get(instrumentId);
    if (!timers) {
      return;
    }
    const index = timers.indexOf(timer);
    if (index >= 0) {
      timers.splice(index, 1);
    }
  }

  private getChannel(instrument: IInstrument): number {
    const existing = this.channelByInstrument.get(instrument.id);
    if (existing != null) {
      return existing;
    }
    const channel = this.nextChannel % 16;
    this.nextChannel += 1;
    this.channelByInstrument.set(instrument.id, channel);
    return channel;
  }
}

function loadScriptOnce(src: string): Promise<void> {
  const existing = document.querySelector(`script[data-sf-src="${src}"]`) as HTMLScriptElement | null;
  if (existing) {
    if ((existing as any)._loaded) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.sfSrc = src;
    script.onload = () => {
      (script as any)._loaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}
