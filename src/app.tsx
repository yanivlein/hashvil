import { useEffect, useRef, useState } from 'preact/hooks';
import * as E from './engine';
import { loadState, saveState, wipeState } from './platform';
import * as sound from './sound';
import type { BoardMove } from './components/Board';
import { Setup } from './screens/Setup';
import { Characters } from './screens/Characters';
import { Trail } from './screens/Trail';
import { Turn } from './screens/Turn';
import { End } from './screens/End';

const rng: E.Rng = () => Math.random();

/**
 * Wide layout (doc 15 §2.2, handoff §4): width 900 and up, height 600 and up, landscape. Only S2 and S5 use it:
 * the board on the right, as tall as fits (3:2), and a side column of 320 on the left.
 */
function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [v, setV] = useState(read);
  useEffect(() => {
    const on = () => setV(read());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  const wide = v.w > v.h && v.w >= 900 && v.h >= 600;
  // board-layout.json › board.wide: width = min(width − 320 − 16, (height − 32) × 1.5)
  const boardW = Math.floor(Math.min(v.w - 320 - 16, (v.h - 32) * 1.5));
  return { wide, boardW };
}

export function App() {
  const [s, setS] = useState<E.GameState>(loadState);
  // in-memory only: what to animate on the next screen. Never persisted, so a refresh lands on the final state.
  const fx = useRef<{ rolled?: boolean; move?: BoardMove }>({});
  // "להטיל" was pressed in this session (fx.rolled is consumed by the render; this one by the sound effect below)
  const rollPressed = useRef(false);
  const { wide, boardW } = useViewport();

  useEffect(() => {
    if (s.phase === 'setup') wipeState();
    else saveState(s);
  }, [s]);

  // doc 15 §3.2: mute silences sounds and music at once (not the read-aloud)
  useEffect(() => sound.setMuted(!s.sound), [s.sound]);
  // the melody: from "התחלה" on, in S1, S2, S4 and S5; not on S0. On the card screen it fades out when the die stops
  // (Turn) and comes back with an 800ms fade when the card closes, i.e. when S2 (or S5) opens again
  useEffect(() => {
    sound.arm(s.phase !== 'setup');
    if (s.phase === 'setup') {
      sound.music(false, 400);
      sound.fire(false);
    } else if (s.phase === 'turn') {
      // a restore after refresh with the card (or "למי?") open: silent; the refuel screen keeps the melody
      if (!rollPressed.current && s.turn?.face !== 6) sound.music(false, 0);
      rollPressed.current = false;
    } else sound.music(true, 800);
  }, [s.phase]);

  const up = (fn: (x: E.GameState) => E.GameState) => setS((x) => fn(x));
  const take = <K extends 'rolled' | 'move'>(k: K) => {
    const v = fx.current[k];
    fx.current[k] = undefined;
    return v;
  };

  switch (s.phase) {
    case 'setup':
      return (
        <Setup
          initial={s.setup}
          sound={s.sound}
          onStart={(setup, on) => {
            // the press on "התחלה" is the gesture that opens the audio (iPhone)
            sound.setMuted(!on);
            sound.unlock();
            up((x) => E.startCharacters(x, setup, on));
          }}
        />
      );

    case 'characters':
      return (
        <Characters
          players={s.players}
          onChange={(players) => up((x) => ({ ...x, players }))}
          onGo={(players) => up((x) => E.startTrail(x, players))}
        />
      );

    case 'trail':
      return (
        <Trail
          key={`t${s.turnsDone}`}
          s={s}
          move={take('move') as BoardMove | undefined}
          wide={wide}
          boardW={boardW}
          a={{
            roll: () => {
              fx.current.rolled = true;
              rollPressed.current = true;
              up((x) => E.roll(x, rng));
            },
            chooseNext: (id) => up((x) => E.chooseNext(x, id)),
            askEnd: () => up(E.askEnd),
            cancelEnd: () => up(E.cancelEnd),
            confirmEnd: () => {
              fx.current.move = { fromPos: s.turnsDone, gather: true };
              up(E.confirmEnd);
            },
            sound: (on) => up((x) => E.setSound(x, on)),
          }}
        />
      );

    case 'turn':
      return (
        <Turn
          key={`u${s.turnsDone}`}
          s={s}
          rolled={!!take('rolled')}
          a={{
            pick: (id) => up((x) => E.pickTarget(x, id, rng)),
            other: () => up((x) => E.otherCard(x, rng)),
            finish: () => {
              // "סיימתי", "בוחר/ת לא לענות" (and S4's buttons): exactly the same soft wood note
              sound.play('wood');
              fx.current.move = { fromPos: s.turnsDone, hopperId: s.current, gather: s.turnsDone + 1 >= E.totalTurns(s) };
              up(E.finishTurn);
            },
          }}
        />
      );

    case 'end':
      return (
        <End
          s={s}
          move={take('move') as BoardMove | undefined}
          wide={wide}
          boardW={boardW}
          onFinish={() => {
            wipeState();
            setS(E.initialState());
          }}
          onSound={(on) => up((x) => E.setSound(x, on))}
        />
      );
  }
}
