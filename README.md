# Tango Beat Machine

Interactive tango rhythm machine with bandoneon, piano, bass, and violin (SoundFonts in the browser).

Live site: [https://pablogventura.github.io/tango-beat-machine/](https://pablogventura.github.io/tango-beat-machine/)

Built with [Next.js](https://nextjs.org/) (static export).

## Local development

- SoundFonts: `public/assets/audio/soundfonts/` (see [CREDITS.md](CREDITS.md))
- FluidSynth helper: `public/vendor/libfluidsynth-2.4.6-with-libsndfile.js`
- Machine: `public/assets/machines/tango.xml`

```shell
npm install
npm run dev
```

Open [http://localhost:3009/](http://localhost:3009/).

```shell
npm test
npm run build
```

For a GitHub Pages-shaped build locally:

```shell
GITHUB_PAGES=true npm run build
```

## Deploy

Push to `master` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml) and publishes `out/` to GitHub Pages. Enable **Settings -> Pages -> Source: GitHub Actions** on the repo.
