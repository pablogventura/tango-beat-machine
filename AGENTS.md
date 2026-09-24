# AGENTS.md

Guide for coding agents. Do not duplicate the README.

## Stack

- Next.js (Pages Router) + React 18 + TypeScript
- MobX 5 (`mobx-react-lite`, decorators / `experimentalDecorators`)
- Material UI v4
- Web Audio: WAV samples for Salsa/Merengue; SoundFonts (FluidSynth / `js-synthesizer`) for Tango
- Deploy: Firebase Hosting static export (`out/`)
- Tests: Vitest + Testing Library (jsdom)

## Commands

| Action | Command |
|--------|---------|
| Install | `npm install` |
| Dev | `npm run dev` (http://localhost:3009/) |
| Build | `npm run build` |
| Start | `npm start` (after build) |
| Export | `npm run export` (static `out/`; used by Firebase predeploy) |
| Test | `npm test` (`vitest run`); watch: `npm run test:watch` |
| Lint | not detected |
| Typecheck | not detected (no dedicated script; `tsc` via Next build) |
| Migrate | not detected |

### Audio assets

- WAV: `public/assets/audio/samples/` + `manifest.json` via [`engine/audio-backend.ts`](engine/audio-backend.ts)
- SF2/SF3: `public/assets/audio/soundfonts/` via [`engine/soundfont-backend.ts`](engine/soundfont-backend.ts) (lazy on Tango)
- Vendor: `public/vendor/libfluidsynth-2.4.6-with-libsndfile.js` (SF3 support)
- Credits: [`CREDITS.md`](CREDITS.md)

## Layout

```
components/   UI (TSX + CSS modules)
engine/       BeatEngine, AudioBackend, SoundFontBackend, XML loader
hooks/        useBeatEngine, useMachine, useWindowListener
pages/        Next.js routes (_app, index, 404, android-videos)
public/       samples, soundfonts, machines XML, icons, instruments
services/     load-machine helper
styles/       globals.css
tests/        Vitest unit/component tests + fixtures
utils/        environment helpers
```

Machines: `public/assets/machines/{salsa,merengue,tango}.xml`.

## Conventions

- Language: English (code, comments, UI strings in existing files)
- Indent: 2 spaces; Prettier: single quotes, trailing commas, printWidth 120
- CSS: co-located `*.module.css` next to components/pages
- State: MobX observables; UI components wrapped with `observer` where reactive
- Babel: legacy decorators + class properties (see `.babelrc`)
- XML machine files: EditorConfig uses tabs / indent 4
- Instruments may set `soundSource` to `sample` or `soundfont`

## Tests

- `tests/**/*.{test,spec}.{ts,tsx}` with jsdom setup in `tests/setup.ts`
- Prefer fixtures under `tests/fixtures/` for isolated unit tests
- Do not rely on Protractor (`protractor.conf.js` is leftover)

## Do not

- Reintroduce sprite bank files (`main.webm` / `main.mp3` / `main.json`)
- Upgrade React / MUI / MobX / Next major versions without an explicit request
- Add App Router or rewrite to hooks-only MobX casually; keep Pages Router + current patterns
- Change Firebase `public: out` / export flow unless asked
