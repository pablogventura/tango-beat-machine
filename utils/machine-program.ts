import { IMachine } from '../engine/machine-interfaces';

/** Set the same program index on every instrument that has programs. */
export function setMachineProgram(machine: IMachine, programIndex: number) {
  for (const instrument of machine.instruments) {
    if (instrument.programs.length > 0) {
      instrument.activeProgram = ((programIndex % instrument.programs.length) + instrument.programs.length) % instrument.programs.length;
    }
  }
}

/** Titles for the global program selector (from the first instrument that has programs). */
export function getMachineProgramTitles(machine: IMachine): string[] {
  const source = machine.instruments.find((instrument) => instrument.programs.length > 0);
  return source ? source.programs.map((program) => program.title) : [];
}

export function getMachineActiveProgram(machine: IMachine): number {
  const source = machine.instruments.find((instrument) => instrument.programs.length > 0);
  return source ? source.activeProgram : 0;
}
