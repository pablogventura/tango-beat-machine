import '@testing-library/jest-dom/vitest';
import React from 'react';

(globalThis as any).React = React;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class MockAudioBuffer {
  constructor(public length = 1, public sampleRate = 44100, public numberOfChannels = 1) {}
}

class MockAudioNode {
  connect() {
    return this;
  }
  disconnect() {
    return this;
  }
}

class MockGainNode extends MockAudioNode {
  gain = { value: 1 };
}

class MockBufferSource extends MockAudioNode {
  buffer: MockAudioBuffer | null = null;
  private endedListeners: Array<() => void> = [];

  start() {
    return undefined;
  }

  stop() {
    for (const listener of this.endedListeners) {
      listener();
    }
  }

  addEventListener(type: string, listener: () => void) {
    if (type === 'ended') {
      this.endedListeners.push(listener);
    }
  }
}

class MockAudioContext {
  currentTime = 0;
  destination = new MockAudioNode();

  createGain() {
    return new MockGainNode();
  }

  createBufferSource() {
    return new MockBufferSource();
  }

  async decodeAudioData(buffer: ArrayBuffer) {
    return new MockAudioBuffer(Math.max(1, Math.floor(buffer.byteLength / 2)));
  }

  resume() {
    return Promise.resolve();
  }
}

(globalThis as any).AudioContext = MockAudioContext;
(window as any).AudioContext = MockAudioContext;
