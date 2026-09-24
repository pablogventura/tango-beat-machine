# The Salsa Beat Machine

Combine and arrange musical instruments to create different Salsa, Merengue, and Tango grooves. Great for musicians and dancers who want to practice timing and train their ears.

Check out the [online version](https://www.salsabeatmachine.org/)

Get the [Android App](https://play.google.com/store/apps/details?id=com.salsarhythm&hl=en)

Built with [Next.js](https://nextjs.org/).

## Local development

- WAV samples (Salsa / Merengue): `public/assets/audio/samples/`
- SoundFonts (Tango): `public/assets/audio/soundfonts/` (see [CREDITS.md](CREDITS.md))
- FluidSynth runtime helper: `public/vendor/libfluidsynth-2.4.6.js`

```shell
npm install
npm run dev
```

Then go to http://localhost:3009/ and start hacking!

```shell
npm test
```
