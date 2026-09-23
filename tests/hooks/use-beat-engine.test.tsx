import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../engine/audio-backend', () => {
  class MockAudioBackend {
    ready = true;
    context = {
      resume: vi.fn(),
      currentTime: 0,
      createGain: () => ({ connect: vi.fn(), gain: { value: 1 } }),
      createBufferSource: () => ({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
        buffer: null,
      }),
      destination: {},
      decodeAudioData: async () => ({ length: 1 }),
    };
    init() {
      return Promise.resolve();
    }
    play() {
      return undefined;
    }
    reset() {
      return undefined;
    }
    getCurrentTime() {
      return 0;
    }
  }
  return { AudioBackend: MockAudioBackend };
});

import { useBeatEngine } from '../../hooks/use-beat-engine';
import { BeatEngine } from '../../engine/beat-engine';

function Probe({ onEngine }: { onEngine: (engine: BeatEngine | null) => void }) {
  const engine = useBeatEngine();
  useEffect(() => {
    onEngine(engine);
  }, [engine, onEngine]);
  return null;
}

describe('useBeatEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an engine on mount and stops it on unmount', async () => {
    let engine: BeatEngine | null = null;
    const { unmount } = render(<Probe onEngine={(value) => (engine = value)} />);

    await waitFor(() => expect(engine).not.toBeNull());
    const stop = vi.spyOn(engine!, 'stop');
    unmount();
    expect(stop).toHaveBeenCalled();
  });
});
