export interface SampleManifestEntry {
  sampleName: string;
  path: string;
  startFrame?: number;
  lengthFrames?: number;
  durationMs?: number;
}

export type SampleManifest = SampleManifestEntry[];

const SAMPLES_BASE = 'assets/audio/samples';

/**
 * Maps a bank sample name to a relative path under samples/.
 * Examples:
 *   bass-12 -> bass/12.wav
 *   spanish:instructor-0 -> instructor/spanish/0.wav
 *   guira0 -> guira0/sample.wav
 */
export function sampleNameToRelativePath(sampleName: string): string {
  if (sampleName.includes(':')) {
    const [lang, rest] = sampleName.split(':', 2);
    if (rest.includes('-') && /^\d+$/.test(rest.slice(rest.lastIndexOf('-') + 1))) {
      const pitchSep = rest.lastIndexOf('-');
      const instrument = rest.slice(0, pitchSep);
      const pitch = rest.slice(pitchSep + 1);
      return `${instrument}/${lang}/${pitch}.wav`;
    }
    return `${lang}/${rest}.wav`;
  }

  const pitchSep = sampleName.lastIndexOf('-');
  if (pitchSep >= 0 && /^\d+$/.test(sampleName.slice(pitchSep + 1))) {
    const instrument = sampleName.slice(0, pitchSep);
    const pitch = sampleName.slice(pitchSep + 1);
    return `${instrument}/${pitch}.wav`;
  }

  return `${sampleName}/sample.wav`;
}

export function sampleUrl(relativePath: string, base = SAMPLES_BASE): string {
  return `${base.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
}

export function buildSamplePathIndex(manifest: SampleManifest): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of manifest) {
    index.set(entry.sampleName, entry.path);
  }
  return index;
}

export function resolveSampleUrl(
  sampleName: string,
  pathIndex?: Map<string, string>,
  base = SAMPLES_BASE,
): string {
  const relative = pathIndex?.get(sampleName) ?? sampleNameToRelativePath(sampleName);
  return sampleUrl(relative, base);
}
