import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { observable } from 'mobx';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BeatMachineUI } from '../../components/beat-machine-ui';
import { createMachine } from '../../engine/machine';
import { createInstrument } from '../helpers/create-instrument';

vi.mock('../../hooks/use-beat-engine', () => ({
  useBeatEngine: () => ({
    playing: false,
    beat: 0,
    play: vi.fn(),
    stop: vi.fn(),
    set machine(_value: unknown) {
      return undefined;
    },
  }),
}));

function buildMachine() {
  const machine = createMachine();
  machine.flavor = 'Tango';
  machine.bpm = 120;
  const programs = [
    { title: 'Cumparsita Dramática', length: 4, notes: [{ index: 0, pitch: 0 }] },
    { title: 'El Choclo Criollo', length: 4, notes: [{ index: 0, pitch: 0 }] },
  ];
  machine.instruments = [
    createInstrument({
      id: 'bandoneon',
      title: 'Bandoneon',
      soundSource: 'soundfont',
      programs,
    }),
    createInstrument({
      id: 'piano',
      title: 'Piano',
      soundSource: 'soundfont',
      programs: programs.map((program) => ({ ...program })),
    }),
  ];
  return observable(machine);
}

describe('BeatMachineUI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders tango instruments and syncs the global program select', async () => {
    const machine = buildMachine();
    render(<BeatMachineUI machine={machine} />);
    expect(screen.getByText('Bandoneon')).toBeInTheDocument();
    expect(screen.getByText('Piano')).toBeInTheDocument();

    const select = screen.getByLabelText('Program') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '1' } });
    await waitFor(() => {
      expect(machine.instruments[0].activeProgram).toBe(1);
      expect(machine.instruments[1].activeProgram).toBe(1);
    });
  });
});
