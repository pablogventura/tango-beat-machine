import { describe, expect, it } from 'vitest';
import { soundfontNoteDurationSec, velocityToMidi } from '../../engine/soundfont-backend';

describe('soundfont articulation helpers', () => {
  it('maps velocity into MIDI with instrument volume', () => {
    expect(velocityToMidi(1, 1)).toBe(127);
    expect(velocityToMidi(0, 1)).toBe(1);
    expect(velocityToMidi(0.5, 1)).toBeGreaterThan(50);
    expect(velocityToMidi(1, 0.5)).toBeLessThan(velocityToMidi(1, 1));
  });

  it('gives violin longer sustain than bass', () => {
    const beatTime = 0.5;
    expect(soundfontNoteDurationSec('violin', beatTime)).toBeGreaterThan(
      soundfontNoteDurationSec('bass', beatTime),
    );
    expect(soundfontNoteDurationSec('bandoneon', beatTime)).toBeGreaterThan(0.4);
  });
});
