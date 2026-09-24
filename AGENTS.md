# AGENTS.md

Guide for coding agents. Do not duplicate the README.

## Stack

- Next.js (Pages Router) + React 18 + TypeScript
- MobX 5 (`mobx-react-lite`, decorators / `experimentalDecorators`)
- Material UI v4
- Web Audio via SoundFonts (FluidSynth / `js-synthesizer`)
- Deploy: GitHub Pages static export (`out/`)
- Tests: Vitest + Testing Library (jsdom)

## Commands

| Action | Command |
|--------|---------|
| Install | `npm install` |
| Dev | `npm run dev` (http://localhost:3009/) |
| Build | `npm run build` (static `out/`) |
| Pages build | `GITHUB_PAGES=true npm run build` (`basePath` `/tango-beat-machine`) |
| Test | `npm test` (`vitest run`); watch: `npm run test:watch` |
| Lint | not detected |
| Typecheck | not detected (no dedicated script; `tsc` via Next build) |

### Audio assets

- SF2/SF3: `public/assets/audio/soundfonts/` via [`engine/soundfont-backend.ts`](engine/soundfont-backend.ts)
- Vendor: `public/vendor/libfluidsynth-2.4.6-with-libsndfile.js`
- Credits: [`CREDITS.md`](CREDITS.md)

## Layout

```
components/ UI (TSX + CSS modules)
engine/ BeatEngine, AudioBackend (clock), SoundFontBackend, XML loader
hooks/ useBeatEngine, useMachine, useWindowListener
pages/ Next.js routes (_app, index, 404)
public/ soundfonts, tango.xml, icons, instruments
services/ load-machine helper
styles/ globals.css
tests/ Vitest unit/component tests + fixtures
utils/ base-path, machine-program, environment
```

Machine: `public/assets/machines/tango.xml`.

## Conventions

- Language: English (code, comments, UI strings in existing files)
- Indent: 2 spaces; Prettier: single quotes, trailing commas, printWidth 120
- CSS: co-located `*.module.css` next to components/pages
- State: MobX observables; UI components wrapped with `observer` where reactive
- Babel: legacy decorators + class properties (see `.babelrc`)
- XML machine files: EditorConfig uses tabs / indent 4
- Global program select syncs `activeProgram` across all instruments
- Asset URLs must use [`utils/base-path.ts`](utils/base-path.ts) so GitHub Pages `basePath` works

## Tests

- `tests/**/*.{test,spec}.{ts,tsx}` with jsdom setup in `tests/setup.ts`
- Prefer fixtures under `tests/fixtures/` for isolated unit tests

## Do not

- Reintroduce Salsa/Merengue machines, WAV sample banks, or store badges
- Upgrade React / MUI / MobX / Next major versions without an explicit request
- Add App Router casually; keep Pages Router + current patterns
- Hard-code absolute `/assets/...` paths that ignore `basePath`
