import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioBackend } from '../../engine/audio-backend';
import { BeatEngine } from '../../engine/beat-engine';
import { createMachine } from '../../engine/machine';
import { SoundFontBackend } from '../../engine/soundfont-backend';
import { createInstrument } from '../helpers/create-instrument';

describe('BeatEngine soundfont routing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('routes soundfont instruments to SoundFontBackend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })),
    );
    vi.useFakeTimers();

    const mixer = new AudioBackend();
    const soundfonts = new SoundFontBackend();
    const playSf = vi.spyOn(soundfonts, 'play').mockImplementation(() => undefined);
    vi.spyOn(soundfonts, 'ensureLoaded').mockResolvedValue(undefined);
    Object.defineProperty(soundfonts, 'ready', { get: () => true });

    const engine = new BeatEngine(mixer, soundfonts);
    await mixer.whenReady;
    mixer.ready = true;

    const playWav = vi.spyOn(mixer, 'play').mockImplementation(() => undefined);

    const machine = createMachine();
    machine.flavor = 'Tango';
    machine.instruments = [
      createInstrument({
        id: 'bandoneon',
        keyedInstrument: true,
        pitchOffset: 48,
        soundSource: 'soundfont',
        soundfontId: 'bandoneon',
        programs: [{ title: 'Marcato', length: 4, notes: [{ index: 0, pitch: 0 }] }],
      }),
    ];
    engine.machine = machine;
    engine.play();
    expect(engine.playing).toBe(true);
    await Promise.resolve();
    await Promise.resolve();

    expect(playSf).toHaveBeenCalled();
    expect(playWav).not.toHaveBeenCalled();
    const firstCall = playSf.mock.calls[0][0];
    expect(firstCall.midiNote).toBe(48);

    engine.stop();
    vi.useRealTimers();
  });

  it('keeps tango beatTime on the salsa path', () => {
    const engine = new BeatEngine(new AudioBackend());
    const salsa = createMachine();
    salsa.bpm = 120;
    salsa.flavor = 'Salsa';
    engine.machine = salsa;
    const salsaBeat = engine.beatTime;

    const tango = createMachine();
    tango.bpm = 120;
    tango.flavor = 'Tango';
    engine.machine = tango;
    expect(engine.beatTime).toBe(salsaBeat);
  });
});
