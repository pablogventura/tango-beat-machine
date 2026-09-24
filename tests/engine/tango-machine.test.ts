import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DOMParser } from 'xmldom';
import { describe, expect, it } from 'vitest';
import { MachineXMLLoader } from '../../engine/machine-xml-loader.service';
import { loadMachine } from '../../services/load-machine';

describe('tango machine', () => {
  it('loads tango.xml with soundfont instruments', async () => {
    const machine = await loadMachine('tango.xml');
    expect(machine.flavor).toBe('Tango');
    expect(machine.bpm).toBe(120);
    const ids = machine.instruments.map((instrument: { id: string }) => instrument.id);
    expect(ids).toEqual(expect.arrayContaining(['bandoneon', 'piano', 'bass', 'violin']));
    const bandoneon = machine.instruments.find((instrument: { id: string }) => instrument.id === 'bandoneon');
    expect(bandoneon.soundSource).toBe('soundfont');
    expect(bandoneon.soundfontId).toBe('bandoneon');
    expect(bandoneon.programs.map((program: { title: string }) => program.title)).toEqual([
      'Cumparsita Dramática',
      'El Choclo Criollo',
      'Derecho Viejo Pista',
      'La Puñalada Veloz',
      'Quejas Cantabile',
      'El Flete Picado',
      '9 de Julio Marcato',
      'Gran Muñeca Elegante',
    ]);
    for (const instrument of machine.instruments.filter((item: { id: string }) =>
      ['bandoneon', 'piano', 'bass', 'violin'].includes(item.id),
    )) {
      expect(instrument.programs).toHaveLength(8);
      expect(instrument.soundSource).toBe('soundfont');
    }
  });

  it('parses soundSource defaults for salsa instruments', () => {
    const xmlText = readFileSync(resolve(process.cwd(), 'tests/fixtures/machines/minimal.xml'), 'utf-8');
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    const machine = new MachineXMLLoader().loadMachine(xml);
    expect(machine.instruments[0].soundSource).toBe('sample');
  });
});
