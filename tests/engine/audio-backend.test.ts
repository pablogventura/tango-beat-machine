import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioBackend } from '../../engine/audio-backend';
import { InstrumentPlayer } from '../../engine/instrument-player';
import { createInstrument } from '../helpers/create-instrument';

const fixturesDir = resolve(process.cwd(), 'tests/fixtures/audio');

function fixtureResponse(fileName: string, contentType: string) {
  const body = readFileSync(resolve(fixturesDir, fileName));
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': contentType },
  });
}

describe('AudioBackend', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('preloads samples from the manifest and plays full buffers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('manifest.json')) {
          return fixtureResponse('manifest.json', 'application/json');
        }
        if (url.endsWith('hit.wav')) {
          return fixtureResponse('hit.wav', 'audio/wav');
        }
        if (url.endsWith('tone.wav')) {
          return fixtureResponse('tone.wav', 'audio/wav');
        }
        return new Response('missing', { status: 404 });
      }),
    );

    const backend = new AudioBackend('assets/audio/samples/manifest.json');
    await backend.init(new AudioContext());
    await backend.whenReady;

    expect(backend.ready).toBe(true);

    const player = new InstrumentPlayer(backend.context!, createInstrument());
    const createBufferSource = vi.spyOn(backend.context!, 'createBufferSource');

    backend.play('clave-0', player, 0.25);
    expect(createBufferSource).toHaveBeenCalled();
    const source = createBufferSource.mock.results[0].value;
    expect(source.buffer).toBeTruthy();
    expect(source.buffer.length).toBeGreaterThan(0);
  });

  it('skips unknown samples without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fixtureResponse('manifest.json', 'application/json')),
    );

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const backend = new AudioBackend('assets/audio/samples/manifest.json');
    await backend.init(new AudioContext());
    await backend.whenReady;

    const player = new InstrumentPlayer(backend.context!, createInstrument());
    expect(() => backend.play('does-not-exist', player, 0)).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
