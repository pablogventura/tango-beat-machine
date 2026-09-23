import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioBackend } from '../../engine/audio-backend';
import { BeatEngine } from '../../engine/beat-engine';
import { resolveInstrumentNotes } from '../../engine/resolve-instrument-notes';
import { createInstrument } from '../helpers/create-instrument';
import { createMachine } from '../../engine/machine';

describe('resolveInstrumentNotes', () => {
  it('builds sample names for keyed instruments', () => {
    const piano = createInstrument({
      id: 'piano',
      keyedInstrument: true,
      pitchOffset: 60,
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

  it('uses merengue beat time half of salsa at same bpm', () => {
    const engine = new BeatEngine(new AudioBackend());
    const salsa = createMachine();
    salsa.bpm = 120;
    salsa.flavor = 'Salsa';
    engine.machine = salsa;
    const salsaBeat = engine.beatTime;

    const merengue = createMachine();
    merengue.bpm = 120;
    merengue.flavor = 'Merengue';
    engine.machine = merengue;
    expect(engine.beatTime).toBe(salsaBeat / 2);
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
        programs: [{ title: 'Simple', length: 4, notes: [{ index: 0, pitch: 0 }] }],
      }),
    ];
    engine.machine = machine;
    expect(engine.instrumentNotes(machine.instruments[0], 0)).toEqual([
      { sampleName: 'piano-61', velocity: undefined },
    ]);
  });

  it('play and stop toggle playing state with a ready mixer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })),
    );
    vi.useFakeTimers();
    const backend = new AudioBackend();
    const engine = new BeatEngine(backend);
    await backend.whenReady;
    backend.ready = true;
    const playSpy = vi.spyOn(backend, 'play').mockImplementation(() => undefined);
    const machine = createMachine();
    machine.instruments = [createInstrument()];
    engine.machine = machine;

    engine.play();
    expect(engine.playing).toBe(true);
    expect(playSpy).toHaveBeenCalled();

    engine.stop();
    expect(engine.playing).toBe(false);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
