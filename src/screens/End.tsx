import { useState } from 'preact/hooks';
import { T } from '../content';
import { totalTurns, type GameState } from '../engine';
import { asset } from '../platform';
import { Board, type BoardMove } from '../components/Board';
import { charSrc } from '../components/bits';
import { ClosingCard } from '../components/Card';

/**
 * S5: everyone walks to the campfire and it lights. One closing card for everyone, taken in turns aloud,
 * then "לסיים" (wipes everything). No turn heading, no "סיימתי", no "מי הבא?" here (handoff §9/12).
 */
export function End({ s, move: moveProp, wide, boardW, onFinish }: { s: GameState; move?: BoardMove; wide: boolean; boardW: number; onFinish: () => void }) {
  const [move] = useState(moveProp);
  const [settled, setSettled] = useState(!move);
  const half = Math.ceil(s.players.length / 2);

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
    >
      {wide && <div class="overlay at-panel">{closing}</div>}
    </Board>
  );

  if (wide) {
    return (
      <main class="screen wide s5 slow">
        <div class="tbar" />
        <div class="board-area">{board}</div>
      </main>
    );
  }

  return (
    <main class="screen phone s5 slow">
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
