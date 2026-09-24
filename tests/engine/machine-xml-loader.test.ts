import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DOMParser } from 'xmldom';
import { describe, expect, it } from 'vitest';
import { MachineXMLLoader } from '../../engine/machine-xml-loader.service';
import { loadMachine } from '../../services/load-machine';

const fixturesDir = resolve(process.cwd(), 'tests/fixtures/machines');

describe('MachineXMLLoader', () => {
  it('loads instruments, programs, flavor and bpm from XML', () => {
    const xmlText = readFileSync(resolve(fixturesDir, 'minimal.xml'), 'utf-8');
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    const machine = new MachineXMLLoader().loadMachine(xml);

    expect(machine.flavor).toBe('Tango');
    expect(machine.bpm).toBe(120);
    expect(machine.keyNote).toBe(0);
    expect(machine.instruments).toHaveLength(2);
    expect(machine.instruments[0]).toMatchObject({
      id: 'bandoneon',
      title: 'Bandoneon',
      enabled: true,
      soundSource: 'soundfont',
      soundfontId: 'bandoneon',
    });
    expect(machine.instruments[0].programs[0].notes).toEqual([
      { index: 0, pitch: 0, velocity: undefined },
      { index: 2, pitch: 0, velocity: undefined },
    ]);
    expect(machine.instruments[1]).toMatchObject({
      id: 'piano',
      keyedInstrument: true,
      pitchOffset: 60,
    });
  });
});

describe('loadMachine', () => {
  it('reads a machine XML from a custom directory', async () => {
    const machine = await loadMachine('minimal.xml', fixturesDir);
    expect(machine.flavor).toBe('Tango');
    expect(machine.instruments.map((instrument: { id: string }) => instrument.id)).toEqual(['bandoneon', 'piano']);
  });

  it('loads the tango machine from public assets', async () => {
    const machine = await loadMachine('tango.xml');
    expect(machine.flavor).toBe('Tango');
    expect(machine.instruments.map((instrument: { id: string }) => instrument.id)).toEqual([
      'bandoneon',
      'piano',
      'bass',
      'violin',
    ]);
  });
});
