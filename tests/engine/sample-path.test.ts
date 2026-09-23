import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import {
  buildSamplePathIndex,
  resolveSampleUrl,
  sampleNameToRelativePath,
  sampleUrl,
} from '../../engine/sample-path';

describe('sampleNameToRelativePath', () => {
  it('maps pitched instrument samples', () => {
    expect(sampleNameToRelativePath('bass-12')).toBe('bass/12.wav');
    expect(sampleNameToRelativePath('piano-60')).toBe('piano/60.wav');
  });

  it('maps language-scoped instructor samples', () => {
    expect(sampleNameToRelativePath('spanish:instructor-0')).toBe('instructor/spanish/0.wav');
    expect(sampleNameToRelativePath('french:instructor-5')).toBe('instructor/french/5.wav');
  });

  it('maps unpitched samples', () => {
    expect(sampleNameToRelativePath('guira0')).toBe('guira0/sample.wav');
    expect(sampleNameToRelativePath('guira1')).toBe('guira1/sample.wav');
  });
});

describe('sample url helpers', () => {
  it('builds urls and indexes from manifest', () => {
    expect(sampleUrl('bass/12.wav')).toBe('assets/audio/samples/bass/12.wav');
    const index = buildSamplePathIndex([
      { sampleName: 'clave-0', path: 'custom/clave.wav' },
      { sampleName: 'bass-36', path: 'bass/36.wav' },
    ]);
    expect(resolveSampleUrl('clave-0', index)).toBe('assets/audio/samples/custom/clave.wav');
    expect(resolveSampleUrl('missing-1', index)).toBe('assets/audio/samples/missing/1.wav');
  });

  it('matches committed sample manifest names', () => {
    const manifestPath = resolve(process.cwd(), 'public/assets/audio/samples/manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Array<{ sampleName: string; path: string }>;
    expect(manifest.length).toBeGreaterThan(200);
    for (const entry of manifest) {
      expect(sampleNameToRelativePath(entry.sampleName)).toBe(entry.path);
    }
  });
});
