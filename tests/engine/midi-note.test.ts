import { describe, expect, it } from 'vitest';
import { midiNoteFromSampleName } from '../../engine/midi-note';

describe('midiNoteFromSampleName', () => {
  it('parses pitched sample names', () => {
    expect(midiNoteFromSampleName('piano-60')).toBe(60);
    expect(midiNoteFromSampleName('bandoneon-48')).toBe(48);
  });

  it('returns null for unpitched names', () => {
    expect(midiNoteFromSampleName('guira0')).toBeNull();
    expect(midiNoteFromSampleName('spanish:instructor-0')).toBe(0);
  });
});
