import { afterEach, describe, expect, it, vi } from 'vitest';
import { SoundFontBackend } from '../../engine/soundfont-backend';
import { createInstrument } from '../helpers/create-instrument';

describe('SoundFontBackend cancelInstrument', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears pending timers for one instrument without firing them', () => {
    vi.useFakeTimers();
    const backend = new SoundFontBackend();
    const instrument = createInstrument({ id: 'bandoneon', soundSource: 'soundfont', soundfontId: 'bandoneon' });

    // Force "ready" internals enough to exercise timer bookkeeping via play().
    (backend as any).ready = true;
    (backend as any).context = { currentTime: 0 };
    const noteOn = vi.fn();
    const noteOff = vi.fn();
    const allNotesOff = vi.fn();
    const allSoundsOff = vi.fn();
    const programSelect = vi.fn();
    (backend as any).synth = {
      midiNoteOn: noteOn,
      midiNoteOff: noteOff,
      midiAllNotesOff: allNotesOff,
      midiAllSoundsOff: allSoundsOff,
      midiProgramSelect: programSelect,
    };
    (backend as any).sfontIds = new Map([['bandoneon', 1], ['gm', 2]]);
    (backend as any).getTransportTime = () => 0;

    backend.play({ instrument, midiNote: 60, when: 1, durationSec: 0.2 });
    expect((backend as any).timersByInstrument.get('bandoneon')?.length).toBe(1);

    backend.cancelInstrument('bandoneon');
    expect((backend as any).timersByInstrument.get('bandoneon')).toBeUndefined();
    expect(allNotesOff).toHaveBeenCalled();
    expect(allSoundsOff).toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(noteOn).not.toHaveBeenCalled();
  });

  it('ignores notes scheduled in the past', () => {
    vi.useFakeTimers();
    const backend = new SoundFontBackend();
    const instrument = createInstrument({ id: 'piano', soundSource: 'soundfont', soundfontId: 'gm' });
    (backend as any).ready = true;
    (backend as any).context = { currentTime: 0 };
    const noteOn = vi.fn();
    (backend as any).synth = {
      midiNoteOn: noteOn,
      midiNoteOff: vi.fn(),
      midiAllNotesOff: vi.fn(),
      midiAllSoundsOff: vi.fn(),
      midiProgramSelect: vi.fn(),
    };
    (backend as any).sfontIds = new Map([['gm', 2]]);
    (backend as any).getTransportTime = () => 5;

    backend.play({ instrument, midiNote: 60, when: 4, durationSec: 0.2 });
    vi.advanceTimersByTime(1000);
    expect(noteOn).not.toHaveBeenCalled();
  });
});
