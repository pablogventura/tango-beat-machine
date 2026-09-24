import { describe, expect, it } from 'vitest';
import { createMachine } from '../../engine/machine';
import { createInstrument } from '../helpers/create-instrument';
import {
  getMachineActiveProgram,
  getMachineProgramTitles,
  setMachineProgram,
} from '../../utils/machine-program';

describe('machine program helpers', () => {
  it('lists titles and sets the same activeProgram on all instruments', () => {
    const machine = createMachine();
    const programs = [
      { title: 'A', length: 4, notes: [{ index: 0, pitch: 0 }] },
      { title: 'B', length: 4, notes: [{ index: 0, pitch: 0 }] },
    ];
    machine.instruments = [
      createInstrument({ id: 'bandoneon', programs }),
      createInstrument({ id: 'piano', programs: programs.map((program) => ({ ...program })) }),
    ];

    expect(getMachineProgramTitles(machine)).toEqual(['A', 'B']);
    expect(getMachineActiveProgram(machine)).toBe(0);

    setMachineProgram(machine, 1);
    expect(machine.instruments[0].activeProgram).toBe(1);
    expect(machine.instruments[1].activeProgram).toBe(1);
  });
});
