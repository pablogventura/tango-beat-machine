import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMachine } from '../../hooks/use-machine';
import { IMachine } from '../../engine/machine-interfaces';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const xml = readFileSync(resolve(process.cwd(), 'tests/fixtures/machines/minimal.xml'), 'utf-8');

function Probe({ onMachine }: { onMachine: (machine: IMachine | null) => void }) {
  const machine = useMachine('/fixtures/minimal.xml');
  useEffect(() => {
    onMachine(machine);
  }, [machine, onMachine]);
  return null;
}

describe('useMachine', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads a machine from a fetched XML document', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(xml, { status: 200, headers: { 'Content-Type': 'text/xml' } })),
    );

    let machine: IMachine | null = null;
    render(<Probe onMachine={(value) => (machine = value)} />);
    await waitFor(() => expect(machine).not.toBeNull());
    expect(machine!.flavor).toBe('Salsa');
    expect(machine!.instruments.map((i) => i.id)).toEqual(['clave', 'piano']);
  });
});
