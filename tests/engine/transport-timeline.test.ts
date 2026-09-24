import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioBackend } from '../../engine/audio-backend';
import { BeatEngine } from '../../engine/beat-engine';
import { createMachine } from '../../engine/machine';
import { createInstrument } from '../helpers/create-instrument';

describe('AudioBackend timeline', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('advances getCurrentTime after ensureTimeline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })),
    );
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
      vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })),
    );
    vi.useFakeTimers();
    const mixer = new AudioBackend();
    const engine = new BeatEngine(mixer);
    await mixer.whenReady;
    mixer.ready = true;
    mixer.ensureTimeline();

    const context = mixer.context as any;
    const playSpy = vi.spyOn(mixer, 'play').mockImplementation(() => undefined);

    const machine = createMachine();
    machine.flavor = 'Salsa';
    machine.instruments = [createInstrument()];
    engine.machine = machine;

    engine.play();
    await Promise.resolve();
    await vi.runOnlyPendingTimersAsync();
    expect(playSpy.mock.calls.length).toBeGreaterThan(0);

    playSpy.mockClear();
    context.currentTime = 40;
    await vi.advanceTimersByTimeAsync(1000);

    expect(playSpy.mock.calls.length).toBeGreaterThan(0);
    engine.stop();
  });
});
