import { IInstrument } from '../engine/machine-interfaces';

export function createInstrument(overrides: Partial<IInstrument> = {}): IInstrument {
  return {
    id: 'clave',
    title: 'Clave',
    enabled: true,
    activeProgram: 0,
    programs: [
      {
        title: 'Default',
        length: 4,
        notes: [{ index: 0, pitch: 0 }],
      },
    ],
    respectsClave: false,
    pitchOffset: 0,
    keyedInstrument: false,
    playBothHands: false,
    leftHandPitchOffset: 0,
    volume: 1,
    ...overrides,
  };
}
