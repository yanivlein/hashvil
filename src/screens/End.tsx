import { useEffect, useState } from 'preact/hooks';
import { T } from '../content';
import { totalTurns, type GameState } from '../engine';
import { asset } from '../platform';
import * as sound from '../sound';
import { Board, type BoardMove } from '../components/Board';
import { charSrc, TinyRow } from '../components/bits';
import { ClosingCard } from '../components/Card';

/**
 * S5: everyone walks to the campfire and it lights. One closing card for everyone, taken in turns aloud,
 * then "לסיים" (wipes everything). No turn heading, no "סיימתי", no "מי הבא?" here (handoff §9/12).
 * 1.1: the tiny row (mute, full screen); the quiet crackle of the fire loops from the moment it lights until "לסיים".
 */
export function End({ s, move: moveProp, wide, boardW, onFinish, onSound }: {
  s: GameState;
  move?: BoardMove;
  wide: boolean;
  boardW: number;
  onFinish: () => void;
  onSound: (on: boolean) => void;
}) {
  const [move] = useState(moveProp);
  const [settled, setSettled] = useState(!move);
  const half = Math.ceil(s.players.length / 2);

  useEffect(() => {
    if (settled) sound.fire(true);
  }, [settled]);
  useEffect(() => () => sound.fire(false), []);

  const tiny = <TinyRow sound={s.sound} onSound={onSound} />;

  const closing = (
    <div class={`closing${settled ? ' fade-in-slow' : ' is-hidden'}`}>
      <ClosingCard />
      <button type="button" class="btn btn--primary btn--block" onClick={onFinish} disabled={!settled}>
        {T.end.finish}
      </button>
    </div>
  );

  const board = (
    <Board
      players={s.players}
      stonesCount={totalTurns(s)}
      pos={s.turnsDone}
      haloId={move?.hopperId}
      atFire
      move={move}
      onSettled={() => setSettled(true)}
      label={T.end.closing}
      width={wide ? boardW : undefined}
    />
  );

  if (wide) {
    return (
      <main class="screen wide s5 slow">
        <aside class="side">
          <div class="side-top">{tiny}</div>
          <div class="side-mid">{closing}</div>
          <div class="side-bottom" />
        </aside>
        <div class="board-area">{board}</div>
      </main>
    );
  }

  return (
    <main class="screen phone s5 slow">
      <div class="bar">
        <span />
        {tiny}
      </div>
      <div class={`arrived${settled ? ' fade-in-slow' : ' is-hidden'}`} aria-hidden="true">
        {s.players.slice(0, half).map((p) => (
          <img key={p.id} class="who" src={charSrc(p.animal)} alt="" />
        ))}
        <img class="campfire" src={asset('campfire-lit.png')} alt="" />
        {s.players.slice(half).map((p) => (
          <img key={p.id} class="who" src={charSrc(p.animal)} alt="" />
        ))}
      </div>
      {board}
      <div class="s5-bottom">{closing}</div>
    </main>
  );
}
