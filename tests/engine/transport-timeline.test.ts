import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioBackend } from '../../engine/audio-backend';
import { BeatEngine } from '../../engine/beat-engine';
import { createMachine } from '../../engine/machine';
import { SoundFontBackend } from '../../engine/soundfont-backend';
import { createInstrument } from '../helpers/create-instrument';

describe('AudioBackend timeline', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('advances getCurrentTime after ensureTimeline', async () => {
    const backend = new AudioBackend();
    const context = new AudioContext();
    await backend.init(context);
    expect(backend.getCurrentTime()).toBe(0);
    backend.ensureTimeline();
    (context as any).currentTime = 1.5;
    expect(backend.getCurrentTime()).toBe(1.5);
  });
});

describe('BeatEngine transport look-ahead', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps scheduling past the first look-ahead window when transport advances', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new ArrayBuffer(8), { status: 200 })),
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
    mixer.ensureTimeline();

    const context = mixer.context as any;

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
    await Promise.resolve();
    await vi.runOnlyPendingTimersAsync();
    expect(playSf.mock.calls.length).toBeGreaterThan(0);

    playSf.mockClear();
    context.currentTime = 20;
    await vi.advanceTimersByTimeAsync(1100);
    expect(playSf.mock.calls.length).toBeGreaterThan(0);

    engine.stop();
  });
});
