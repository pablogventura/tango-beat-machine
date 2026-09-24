import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioBackend } from '../../engine/audio-backend';
import { BeatEngine } from '../../engine/beat-engine';
import { resolveInstrumentNotes } from '../../engine/resolve-instrument-notes';
import { SoundFontBackend } from '../../engine/soundfont-backend';
import { createInstrument } from '../helpers/create-instrument';
import { createMachine } from '../../engine/machine';

describe('resolveInstrumentNotes', () => {
  it('builds sample names for keyed instruments', () => {
    const piano = createInstrument({
      id: 'piano',
      keyedInstrument: true,
      pitchOffset: 60,
      soundSource: 'soundfont',
      programs: [{ title: 'Simple', length: 4, notes: [{ index: 0, pitch: 0 }] }],
    });

    expect(resolveInstrumentNotes(piano, 0, 0)).toEqual([{ sampleName: 'piano-60', velocity: undefined }]);
    expect(resolveInstrumentNotes(piano, 0, 2)).toEqual([{ sampleName: 'piano-62', velocity: undefined }]);
  });

  it('returns no notes when disabled', () => {
    const instrument = createInstrument({ enabled: false });
    expect(resolveInstrumentNotes(instrument, 0, 0)).toEqual([]);
  });

  it('adds piano tonic octave when marked', () => {
    const piano = createInstrument({
      id: 'piano',
      keyedInstrument: true,
      pitchOffset: 60,
      soundSource: 'soundfont',
      programs: [{ title: 'Tonic', length: 4, notes: [{ index: 0, pitch: 0, pianoTonic: true }] }],
    });
    expect(resolveInstrumentNotes(piano, 0, 0)).toEqual([
      { sampleName: 'piano-60', velocity: undefined },
      { sampleName: 'piano-72', velocity: undefined },
    ]);
  });
});

describe('BeatEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })),
    );
  });

  it('uses quarter-note beatTime from bpm', () => {
    const engine = new BeatEngine(new AudioBackend());
    const machine = createMachine();
    machine.bpm = 120;
    engine.machine = machine;
    expect(engine.beatTime).toBe(0.5);
  });

  it('exposes instrument notes through the engine', () => {
    const engine = new BeatEngine(new AudioBackend());
    const machine = createMachine();
    machine.keyNote = 1;
    machine.instruments = [
      createInstrument({
        id: 'piano',
        keyedInstrument: true,
        pitchOffset: 60,
        soundSource: 'soundfont',
        programs: [{ title: 'Simple', length: 4, notes: [{ index: 0, pitch: 0 }] }],
      }),
    ];
    engine.machine = machine;
    expect(engine.instrumentNotes(machine.instruments[0], 0)).toEqual([
      { sampleName: 'piano-61', velocity: undefined },
    ]);
  });

  it('play and stop toggle playing state with soundfonts', async () => {
    vi.useFakeTimers();
    const mixer = new AudioBackend();
    const soundfonts = new SoundFontBackend();
    const playSf = vi.spyOn(soundfonts, 'play').mockImplementation(() => undefined);
    vi.spyOn(soundfonts, 'ensureLoaded').mockResolvedValue(undefined);
    Object.defineProperty(soundfonts, 'ready', { get: () => true });

    const engine = new BeatEngine(mixer, soundfonts);
    await mixer.whenReady;
    mixer.ready = true;
    const machine = createMachine();
    machine.instruments = [
      createInstrument({
        id: 'bandoneon',
        keyedInstrument: true,
        pitchOffset: 48,
        soundSource: 'soundfont',
        programs: [{ title: 'Simple', length: 4, notes: [{ index: 0, pitch: 0 }] }],
      }),
    ];
    engine.machine = machine;

    engine.play();
    expect(engine.playing).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(playSf).toHaveBeenCalled();

    engine.stop();
    expect(engine.playing).toBe(false);
    vi.useRealTimers();
  });
});
