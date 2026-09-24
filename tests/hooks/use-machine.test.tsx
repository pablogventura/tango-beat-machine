import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMachine } from '../../hooks/use-machine';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const xml = readFileSync(resolve(process.cwd(), 'tests/fixtures/machines/minimal.xml'), 'utf-8');

function Probe() {
  const machine = useMachine('/fixtures/minimal.xml');
  if (!machine) {
    return <div>loading</div>;
  }
  return (
    <div>
      <span>{machine.flavor}</span>
      <span>{machine.instruments.map((instrument) => instrument.id).join(',')}</span>
    </div>
  );
}

describe('useMachine', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads a machine from a fetched XML document', async () => {
    const fetchMock = vi.fn(async () => new Response(xml, { status: 200, headers: { 'Content-Type': 'text/xml' } }));
    vi.stubGlobal('fetch', fetchMock);

    render(<Probe />);
    await waitFor(() => expect(screen.getByText('Tango')).toBeInTheDocument());
    expect(screen.getByText('bandoneon,piano')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});
