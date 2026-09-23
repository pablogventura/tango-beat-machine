import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { observable } from 'mobx';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMachine } from '../../engine/machine';
import { createInstrument } from '../helpers/create-instrument';

const play = vi.fn();
const stop = vi.fn();

vi.mock('../../hooks/use-beat-engine', () => ({
  useBeatEngine: () => ({
    playing: false,
    beat: 0,
    play,
    stop,
    get machine() {
      return null;
    },
    set machine(_value: unknown) {
      return undefined;
    },
  }),
}));

import { BeatMachineUI } from '../../components/beat-machine-ui';

function buildMachines() {
  const salsa = createMachine();
  salsa.flavor = 'Salsa';
  salsa.bpm = 180;
  salsa.instruments = [createInstrument({ id: 'clave', title: 'Clave' })];

  const merengue = createMachine();
  merengue.flavor = 'Merengue';
  merengue.bpm = 160;
  merengue.instruments = [createInstrument({ id: 'cowbell', title: 'Cowbell' })];

  return {
    salsa: observable(salsa),
    merengue: observable(merengue),
  };
}

describe('BeatMachineUI', () => {
  beforeEach(() => {
    play.mockClear();
    stop.mockClear();
  });

  it('starts playback when play is clicked', async () => {
    render(<BeatMachineUI machines={buildMachines()} />);
    fireEvent.click(screen.getByLabelText('Play'));
    expect(play).toHaveBeenCalled();
  });

  it('switches between salsa and merengue', async () => {
    render(<BeatMachineUI machines={buildMachines()} />);
    expect(screen.getByText('Clave')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Merengue'));
    await waitFor(() => expect(screen.getByText('Cowbell')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Salsa'));
    await waitFor(() => expect(screen.getByText('Clave')).toBeInTheDocument());
  });

  it('updates bpm from the slider label context', () => {
    const machines = buildMachines();
    render(<BeatMachineUI machines={machines} />);
    expect(screen.getByText('180 BPM')).toBeInTheDocument();
  });
});
