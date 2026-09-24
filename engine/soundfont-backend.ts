import { IInstrument } from './machine-interfaces';
import { assetUrl } from '../utils/base-path';

/** SF3 needs the libsndfile FluidSynth build. */
const LIBFLUIDSYNTH_URL = assetUrl('vendor/libfluidsynth-2.4.6-with-libsndfile.js');

const SOUNDFONT_URLS: Record<string, string> = {
  bandoneon: assetUrl('assets/audio/soundfonts/bandoneon_v2.sf2'),
  gm: assetUrl('assets/audio/soundfonts/MuseScore_General.sf3'),
};

/** MIDI CC numbers used for per-channel mix. */
const CC_CHANNEL_VOLUME = 7;
const CC_REVERB_SEND = 91;
const CC_CHORUS_SEND = 93;

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
  private configuredChannels = new Set<number>();
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
    synth.init(context.sampleRate, {
      initialGain: 0.45,
      reverbActive: true,
      reverbRoomSize: 0.55,
      reverbDamp: 0.35,
      reverbWidth: 0.75,
      reverbLevel: 0.75,
      chorusActive: true,
      chorusLevel: 1.4,
      chorusDepth: 6,
      chorusSpeed: 0.35,
      chorusNr: 3,
      polyphony: 128,
    });
    const node = synth.createAudioNode(context, 1024);
    node.connect(context.destination);

    // Prefer higher-quality interpolation when available.
    if (typeof (synth as any).setInterpolation === 'function') {
      try {
        // InterpolationValues.FourthOrder = 4
        (synth as any).setInterpolation(4);
      } catch {
        // Older builds may not expose InterpolationValues the same way.
      }
    }

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
    this.ensureChannelMix(channel, instrument);

    const delayMs = (when - transportNow) * 1000;
    const vel = velocityToMidi(velocity, instrument.volume);
    const instrumentTimers = this.timersByInstrument.get(instrument.id) ?? [];
    this.timersByInstrument.set(instrument.id, instrumentTimers);

    const onTimer = window.setTimeout(() => {
      synth.midiNoteOn(channel, midiNote, vel);
      const offTimer = window.setTimeout(() => {
        synth.midiNoteOff(channel, midiNote);
        this.removeTimer(instrument.id, offTimer);
      }, Math.max(40, durationSec * 1000));
      instrumentTimers.push(offTimer);
      this.removeTimer(instrument.id, onTimer);
    }, delayMs);
    instrumentTimers.push(onTimer);
  }

  private ensureChannelMix(channel: number, instrument: IInstrument) {
    if (!this.synth || this.configuredChannels.has(channel)) {
      return;
    }
    const volumeCc = Math.max(40, Math.min(127, Math.round(instrument.volume * 110)));
    const reverbCc = instrument.id === 'violin' ? 90 : instrument.id === 'bandoneon' ? 72 : 55;
    const chorusCc = instrument.id === 'violin' ? 40 : instrument.id === 'piano' ? 18 : 10;
    this.synth.midiControl(channel, CC_CHANNEL_VOLUME, volumeCc);
    this.synth.midiControl(channel, CC_REVERB_SEND, reverbCc);
    this.synth.midiControl(channel, CC_CHORUS_SEND, chorusCc);
    this.configuredChannels.add(channel);
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

/** Map normalized velocity (0-1) + instrument volume into MIDI 1-127 with a soft curve. */
export function velocityToMidi(velocity: number | undefined, volume: number): number {
  const normalized = Math.max(0, Math.min(1, velocity ?? 1));
  const shaped = Math.pow(normalized, 0.8);
  return Math.max(1, Math.min(127, Math.round(shaped * 127 * Math.max(0.35, Math.min(1, volume)))));
}

/**
 * Note length tuned per instrument so SF envelopes can breathe (avoid plucky GM cutoffs).
 * `beatTime` is one quarter-note at the current BPM.
 */
export function soundfontNoteDurationSec(instrumentId: string, beatTime: number): number {
  switch (instrumentId) {
    case 'violin':
      return Math.max(0.5, beatTime * 1.7);
    case 'bandoneon':
      return Math.max(0.4, beatTime * 1.25);
    case 'piano':
      return Math.max(0.45, beatTime * 1.35);
    case 'bass':
      return Math.max(0.28, beatTime * 0.95);
    default:
      return Math.max(0.35, beatTime * 1.1);
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
