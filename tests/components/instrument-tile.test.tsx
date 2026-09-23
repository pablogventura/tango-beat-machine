import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BeatIndicator } from '../../components/beat-indicator';
import { InstrumentTile } from '../../components/instrument-tile';
import { createInstrument } from '../helpers/create-instrument';
import { observable } from 'mobx';

describe('BeatIndicator', () => {
  it('renders one marker per beat and marks the active one', () => {
    const { container } = render(<BeatIndicator currentBeat={2} max={4} />);
    const beats = container.querySelectorAll('span');
    expect(beats).toHaveLength(4);
  });
});

describe('InstrumentTile', () => {
  it('toggles instrument enabled state when the thumbnail is clicked', () => {
    const instrument = observable(
      createInstrument({
        id: 'clave',
        title: 'Clave',
        enabled: true,
        volume: 0.8,
      }),
    );

    const { container } = render(<InstrumentTile instrument={instrument} />);
    const thumbnail = container.querySelector('[class*="thumbnail"]') as HTMLElement;
    expect(thumbnail).toBeTruthy();

    fireEvent.click(thumbnail);
    expect(instrument.enabled).toBe(false);
    expect(instrument.volume).toBe(0);

    fireEvent.click(thumbnail);
    expect(instrument.enabled).toBe(true);
    expect(instrument.volume).toBe(0.8);
  });

  it('changes active program from the settings select', () => {
    const instrument = observable(
      createInstrument({
        programs: [
          { title: 'A', length: 4, notes: [] },
          { title: 'B', length: 4, notes: [] },
        ],
      }),
    );

    render(<InstrumentTile instrument={instrument} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2' } });
    expect(instrument.activeProgram).toBe(1);
  });
});
