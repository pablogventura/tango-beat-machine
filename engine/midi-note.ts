/** Parse MIDI note number from sample names like "piano-60" or "bandoneon-48". */
export function midiNoteFromSampleName(sampleName: string): number | null {
  const pitchSep = sampleName.lastIndexOf('-');
  if (pitchSep < 0) {
    return null;
  }
  const pitchText = sampleName.slice(pitchSep + 1);
  if (!/^\d+$/.test(pitchText)) {
    return null;
  }
  return parseInt(pitchText, 10);
}
