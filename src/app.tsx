import { useEffect, useRef, useState } from 'preact/hooks';
import * as E from './engine';
import { loadState, saveState, wipeState } from './platform';
import type { BoardMove } from './components/Board';
import { Setup } from './screens/Setup';
import { Characters } from './screens/Characters';
import { Trail } from './screens/Trail';
import { Turn } from './screens/Turn';
import { End } from './screens/End';

const rng: E.Rng = () => Math.random();

/** Tablet landscape: the screens with the board get their own layout (handoff §4). */
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
  const wide = v.w > v.h && v.w >= 700;
  // board width = min(width − 48, (height − 76 − 12) × 1.5)
  const boardW = Math.floor(Math.min(v.w - 48, (v.h - 76 - 12) * 1.5));
  return { wide, boardW };
}

export function App() {
  const [s, setS] = useState<E.GameState>(loadState);
  // in-memory only: what to animate on the next screen. Never persisted, so a refresh lands on the final state.
  const fx = useRef<{ rolled?: boolean; move?: BoardMove }>({});
  const { wide, boardW } = useViewport();

  useEffect(() => {
    if (s.phase === 'setup') wipeState();
    else saveState(s);
  }, [s]);

  const up = (fn: (x: E.GameState) => E.GameState) => setS((x) => fn(x));
  const take = <K extends 'rolled' | 'move'>(k: K) => {
    const v = fx.current[k];
    fx.current[k] = undefined;
    return v;
  };

  switch (s.phase) {
    case 'setup':
      return <Setup initial={s.setup} onStart={(setup) => up((x) => E.startCharacters(x, setup))} />;

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
              up((x) => E.roll(x, rng));
            },
            chooseNext: (id) => up((x) => E.chooseNext(x, id)),
            askEnd: () => up(E.askEnd),
            cancelEnd: () => up(E.cancelEnd),
            confirmEnd: () => {
              fx.current.move = { fromPos: s.turnsDone, gather: true };
              up(E.confirmEnd);
            },
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
        />
      );
  }
}
