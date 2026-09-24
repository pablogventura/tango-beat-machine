import { IMachine } from './machine-interfaces';

export function createMachine(): IMachine {
  return { bpm: 120, keyNote: 0, instruments: [], flavor: 'Tango' };
}
