import { FormControl, Grid, IconButton, InputLabel, Select, Slider, Typography } from '@material-ui/core';
import PauseIcon from '@material-ui/icons/Pause';
import PlayIcon from '@material-ui/icons/PlayArrow';
import classnames from 'classnames';
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { IMachine } from '../engine/machine-interfaces';
import { useBeatEngine } from '../hooks/use-beat-engine';
import { useWindowListener } from '../hooks/use-window-listener';
import {
  getMachineActiveProgram,
  getMachineProgramTitles,
  setMachineProgram,
} from '../utils/machine-program';
import { BeatIndicator } from './beat-indicator';
import styles from './beat-machine-ui.module.css';
import { InstrumentTile } from './instrument-tile';

const BEAT_COUNT = 8;

export interface IBeatMachineUIProps {
  machine: IMachine;
}

export const BeatMachineUI = observer(({ machine: initialMachine }: IBeatMachineUIProps) => {
  const engine = useBeatEngine();
  const [machine] = useState(() => observable(initialMachine));

  useEffect(() => {
    if (engine && machine) {
      engine.machine = machine;
    }
  }, [engine, machine]);

  const beatIndex = engine?.playing ? Math.round(0.5 + (engine.beat % BEAT_COUNT)) : 0;
  const programTitles = getMachineProgramTitles(machine);
  const activeProgram = getMachineActiveProgram(machine);

  useWindowListener(
    'keydown',
    (event: KeyboardEvent) => {
      switch (event.key) {
        case '+':
        case '=':
          machine.bpm = Math.min(250, machine.bpm + 5);
          break;

        case '-':
          machine.bpm = Math.max(80, machine.bpm - 5);
          break;

        case 'k':
          machine.keyNote = (machine.keyNote + 7) % 12;
          break;

        case 'K':
          machine.keyNote = (machine.keyNote + 5) % 12;
          break;
      }
      if (event.key >= '0' && event.key <= '9') {
        const index = (parseInt(event.key, 10) + 10 - 1) % 10;
        if (event.altKey) {
          if (programTitles.length > 0) {
            setMachineProgram(machine, index % programTitles.length);
          }
        } else {
          const instrument = machine.instruments[index];
          if (instrument) {
            instrument.enabled = !instrument.enabled;
          }
        }
      }
    },
    [machine, programTitles.length],
  );

  const playClick = () => {
    if (engine?.playing) {
      engine?.stop();
    } else {
      engine?.play();
    }
  };

  return (
    <div>
      <div className={styles.card}>
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <IconButton onClick={playClick} aria-label={engine?.playing ? 'Pause' : 'Play'} style={{ color: '#000' }}>
              {engine?.playing ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Grid>
          <Grid item xs={3}>
            <Slider
              min={80}
              max={250}
              valueLabelDisplay="auto"
              value={machine.bpm}
              aria-labelledby="bpm-slider"
              onChange={(e, newValue) => (machine.bpm = newValue as number)}
            />
          </Grid>
          <Grid item>
            <Typography id="bpm-slider" gutterBottom>
              {machine.bpm} BPM
            </Typography>
          </Grid>
          <Grid item xs={1} />
          <Grid item>
            {programTitles.length > 0 && (
              <FormControl>
                <InputLabel htmlFor="machine-program">Program</InputLabel>
                <Select
                  native
                  value={activeProgram}
                  onChange={(e) => setMachineProgram(machine, parseInt(e.target.value as string, 10))}
                  inputProps={{ id: 'machine-program' }}
                >
                  {programTitles.map((title, index) => (
                    <option key={title} value={index}>
                      {title}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
          <Grid item xs={1} />
          <Grid item>
            <FormControl>
              <InputLabel htmlFor="machine-key-note">Key</InputLabel>
              <Select
                native
                value={machine.keyNote}
                onChange={(e) => (machine.keyNote = parseInt(e.target.value as string, 10))}
                inputProps={{
                  id: 'machine-key-note',
                }}
              >
                <option value="0">C</option>
                <option value="1">C#</option>
                <option value="2">D</option>
                <option value="3">D#</option>
                <option value="4">E</option>
                <option value="5">F</option>
                <option value="6">F#</option>
                <option value="7">G</option>
                <option value="8">G#</option>
                <option value="9">A</option>
                <option value="10">A#</option>
                <option value="11">B</option>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <div className={styles.controlsIndicator}>
          <BeatIndicator currentBeat={beatIndex} max={BEAT_COUNT} />
        </div>
      </div>

      <div className={classnames(styles.card, styles.instrumentList)}>
        {machine?.instruments.map((instrument) => (
          <div key={instrument.id} className={styles.instrumentTile}>
            <InstrumentTile instrument={instrument} />
          </div>
        ))}
      </div>
    </div>
  );
});
