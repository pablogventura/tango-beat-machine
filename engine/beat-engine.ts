import { computed, Lambda, observable, observe } from 'mobx';
import { AudioBackend } from './audio-backend';
import { InstrumentPlayer } from './instrument-player';
import { createMachine } from './machine';
import { IInstrument, IMachine } from './machine-interfaces';
import { midiNoteFromSampleName } from './midi-note';
import { IInstrumentSample, resolveInstrumentNotes } from './resolve-instrument-notes';
import { SoundFontBackend, soundfontNoteDurationSec } from './soundfont-backend';

export type { IInstrumentSample } from './resolve-instrument-notes';

export class BeatEngine {
  private nextSampleIndex = 0;
  private animationFrameRequest: number | null = null;
  private audioTimeDelta = 0;
  private machineDisposers: Lambda[] = [];
  private readonly instrumentPlayers = new Map<IInstrument, InstrumentPlayer>();

  @observable
  private interval: number | null = null;

  @observable
  private _playing = false;

  @observable
  private _machine: IMachine = createMachine();

  @observable
  beat = 0;

  constructor(private mixer: AudioBackend, private soundfonts: SoundFontBackend = new SoundFontBackend()) {
    this.mixer.init();
    if (this.mixer.context) {
      this.soundfonts.attachContext(this.mixer.context, () => this.mixer.getCurrentTime());
    }
  }

  get machine() {
    return this._machine;
  }

  set machine(value: IMachine) {
    if (value !== this._machine) {
      this._machine = value;
      this.machineDisposers.forEach((disposer) => disposer());
      this.machineDisposers = [];
      for (const player of Array.from(this.instrumentPlayers.values())) {
        player.dispose();
      }
      this.instrumentPlayers.clear();

      if (!this.machine) {
        return;
      }

      void this.soundfonts.ensureLoaded();

      if (this.playing) {
        this.stop();
        this.play();
      }

      this.machineDisposers.push(
        observe(this.machine, 'bpm', ({ oldValue, newValue }) => {
          if (this.playing) {
            if (this.interval) {
              clearTimeout(this.interval);
            }
            const currentAudioTime = this.mixer.getCurrentTime();
            if (oldValue != null) {
              this.audioTimeDelta = (currentAudioTime + this.audioTimeDelta) * (oldValue / newValue) - currentAudioTime;
            }
            this.nextSampleIndex = Math.ceil(this.getBeatIndex() * 2);
            this.stopAllInstruments();
            this.scheduleBuffers();
          }
        }),

        observe(this.machine, 'keyNote', () => {
          if (this.playing) {
            for (const instrument of this.machine.instruments) {
              if (!instrument.keyedInstrument) {
                continue;
              }
              const player = this.instrumentPlayers.get(instrument);
              if (player) {
                this.rescheduleInstrument(instrument, player);
              }
            }
          }
        }),
      );
    }
  }

  public play() {
    this._playing = true;
    void this.startPlayback();
  }

  private async startPlayback() {
    if (!this._playing) {
      return;
    }

    await this.mixer.context?.resume();
    if (!this._playing) {
      return;
    }

    if (this.mixer.context) {
      this.soundfonts.attachContext(this.mixer.context, () => this.mixer.getCurrentTime());
    }
    this.mixer.ensureTimeline();

    try {
      await this.soundfonts.ensureLoaded();
    } catch (error) {
      console.error('Failed to load soundfonts', error);
    }

    if (!this._playing) {
      return;
    }

    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    if (this.animationFrameRequest) {
      cancelAnimationFrame(this.animationFrameRequest);
      this.animationFrameRequest = null;
    }

    this.scheduleBuffers();
    this.beatTick();
  }

  private getInstrumentPlayer(context: AudioContext, instrument: IInstrument) {
    const instrumentPlayer = this.instrumentPlayers.get(instrument);
    if (instrumentPlayer) {
      return instrumentPlayer;
    } else {
      const newPlayer = new InstrumentPlayer(context, instrument);
      this.machineDisposers.push(
        observe(instrument, 'activeProgram', () => this.rescheduleInstrument(instrument, newPlayer)),
      );
      this.instrumentPlayers.set(instrument, newPlayer);
      return newPlayer;
    }
  }

  private playNote(instrument: IInstrument, note: IInstrumentSample, when: number) {
    const midiNote = midiNoteFromSampleName(note.sampleName);
    if (midiNote == null) {
      console.warn(`Cannot parse MIDI note from ${note.sampleName}`);
      return;
    }
    this.soundfonts.play({
      instrument,
      midiNote,
      when,
      velocity: note.velocity,
      durationSec: soundfontNoteDurationSec(instrument.id, this.beatTime),
    });
  }

  private scheduleBuffers() {
    const context = this.mixer.context;
    this.mixer.ensureTimeline();
    if (context && this.mixer.ready) {
      const sampleTime = this.beatTime / 2;
      const currentBeat = this.getBeatIndex();
      while (this.nextSampleIndex - currentBeat * 2 < 64) {
        const sampleIndex = this.nextSampleIndex;
        this.machine.instruments.forEach((instrument) => {
          this.getInstrumentPlayer(context, instrument);
          this.instrumentNotes(instrument, sampleIndex).forEach((note) => {
            this.playNote(instrument, note, sampleIndex * sampleTime - this.audioTimeDelta);
          });
        });
        this.nextSampleIndex++;
      }
    } else {
      console.log('Mixer not ready yet');
    }
    this.interval = window.setTimeout(() => this.scheduleBuffers(), 1000);
  }

  rescheduleInstrument(instrument: IInstrument, player: InstrumentPlayer) {
    player.reset();
    this.soundfonts.cancelInstrument(instrument.id);

    const sampleTime = this.beatTime / 2;
    const transportNow = this.mixer.getCurrentTime();
    const startIndex = Math.ceil(this.getBeatIndex() * 2);

    for (let sampleIndex = startIndex; sampleIndex < this.nextSampleIndex; sampleIndex++) {
      const when = sampleIndex * sampleTime - this.audioTimeDelta;
      if (when <= transportNow) {
        continue;
      }
      this.instrumentNotes(instrument, sampleIndex).forEach((note) => {
        this.playNote(instrument, note, when);
      });
    }
  }

  /** Exposed for tests and tooling. */
  instrumentNotes(instrument: IInstrument, sampleIndex: number): IInstrumentSample[] {
    return resolveInstrumentNotes(instrument, sampleIndex, this.machine.keyNote);
  }

  private stopAllInstruments(hard = false) {
    for (const instrument of Array.from(this.instrumentPlayers.values())) {
      instrument.reset(hard);
    }
    this.soundfonts.reset();
  }

  public stop() {
    this._playing = false;
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    if (this.animationFrameRequest) {
      cancelAnimationFrame(this.animationFrameRequest);
      this.animationFrameRequest = null;
    }
    this.stopAllInstruments(true);
    this.mixer.reset();
    this.audioTimeDelta = 0;
    this.nextSampleIndex = 0;
  }

  @computed
  get playing() {
    return this._playing;
  }

  get beatTime() {
    return 60 / this.machine.bpm;
  }

  public getBeatIndex() {
    return (this.mixer.getCurrentTime() + this.audioTimeDelta) / this.beatTime;
  }

  private beatTick() {
    this.beat = this.getBeatIndex();
    this.animationFrameRequest = requestAnimationFrame(() => this.beatTick());
  }
}
