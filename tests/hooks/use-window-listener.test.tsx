import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWindowListener } from '../../hooks/use-window-listener';

function Harness({ onKey }: { onKey: (key: string) => void }) {
  useWindowListener('keydown', (event) => onKey(event.key), []);
  return null;
}

describe('useWindowListener', () => {
  it('registers and cleans up a window listener', () => {
    const onKey = vi.fn();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<Harness onKey={onKey} />);
    expect(add).toHaveBeenCalledWith('keydown', expect.any(Function));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(onKey).toHaveBeenCalledWith('a');

    unmount();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
