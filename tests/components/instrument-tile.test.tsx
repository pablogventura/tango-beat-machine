import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InstrumentTile } from '../../components/instrument-tile';
import { createInstrument } from '../helpers/create-instrument';

describe('InstrumentTile', () => {
  it('toggles enabled state when the thumbnail is clicked', () => {
    const instrument = createInstrument({ id: 'bandoneon', title: 'Bandoneon', enabled: true });
    render(<InstrumentTile instrument={instrument} />);
    fireEvent.click(screen.getByTitle('Bandoneon').querySelector('div')!);
    expect(instrument.enabled).toBe(false);
  });

  it('shows a volume slider from the volume button', () => {
    const instrument = createInstrument({ id: 'piano', title: 'Piano', volume: 0.5 });
    render(<InstrumentTile instrument={instrument} />);
    fireEvent.click(screen.getByLabelText(/volume/i));
    expect(screen.getByLabelText('Instrument volume')).toBeInTheDocument();
  });
});
