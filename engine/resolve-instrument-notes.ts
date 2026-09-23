import { IInstrument } from './machine-interfaces';

export interface IInstrumentSample {
  sampleName: string;
  velocity?: number;
}

export function resolveInstrumentNotes(
  instrument: IInstrument,
  sampleIndex: number,
  keyNote: number,
): IInstrumentSample[] {
  const result: IInstrumentSample[] = [];
  if (!instrument.enabled) {
    return result;
  }

  const program = instrument.programs[instrument.activeProgram];
  if (!program) {
    return result;
  }

  const step = sampleIndex % program.length;
  for (const note of program.notes) {
    if (note.index !== step) {
      continue;
    }

    let pitch = note.pitch;
    if (instrument.keyedInstrument) {
      pitch += keyNote;
    }

    if (note.hand !== 'left') {
      result.push({
        sampleName: instrument.id + '-' + (pitch + instrument.pitchOffset),
        velocity: note.velocity,
      });
      if (note.pianoTonic) {
        result.push({
          sampleName: instrument.id + '-' + (pitch + instrument.pitchOffset + 12),
          velocity: note.velocity,
        });
      }
    }

    if (instrument.playBothHands && note.hand !== 'right') {
      result.push({
        sampleName: instrument.id + '-' + (pitch + instrument.leftHandPitchOffset),
        velocity: note.velocity,
      });
    }
  }

  return result;
}
