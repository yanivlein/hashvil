import { useState } from 'preact/hooks';
import { roundLabel, T } from '../content';
import { canBeNext, playerById, totalTurns, type GameState, type Player } from '../engine';
import { Board, type BoardMove } from '../components/Board';
import { CharacterRow, TurnHeading } from '../components/bits';

export interface TrailActions {
  roll: () => void;
  chooseNext: (id: string) => void;
  askEnd: () => void;
  cancelEnd: () => void;
  confirmEnd: () => void;
}

/** "לסיים את הטיול?": a small paper panel in place of "להטיל" (spec 4/S2, 16.4). */
function ConfirmEnd({ a }: { a: TrailActions }) {
  return (
    <section class="picker confirm fade-in" role="group" aria-labelledby="q-end">
      <h2 class="q" id="q-end">
        {T.trail.confirmQ}
      </h2>
      <div class="confirm-btns">
        <button type="button" class="btn btn--secondary" onClick={a.confirmEnd}>
          {T.trail.confirmYes}
        </button>
        <button type="button" class="btn btn--primary" onClick={a.cancelEnd}>
          {T.trail.confirmNo}
        </button>
      </div>
    </section>
  );
}

/** S2: the trail. The player whose turn it is is lit; one big button "להטיל"; after a turn, "מי הבא?" over the same screen. */
export function Trail({ s, move: moveProp, wide, boardW, a }: { s: GameState; move?: BoardMove; wide: boolean; boardW: number; a: TrailActions }) {
  const [move] = useState(moveProp);
  const [settled, setSettled] = useState(!move);
  const current = playerById(s, s.current) as Player;
  const round = roundLabel(s.round, s.setup.rounds);
  const label = `${current.name} · ${round}`;

  let action = null;
  if (s.confirmingEnd) action = <ConfirmEnd a={a} />;
  else if (s.trailStep === 'next') {
    action = settled ? (
      <div class="fade-in">
        <CharacterRow id="q-next" question={T.trail.next} players={s.players} isDim={(p) => !canBeNext(s, p.id)} onPick={(p) => a.chooseNext(p.id)} />
      </div>
    ) : null;
  } else
    action = (
      <button type="button" class={`roll${wide ? ' roll--tablet' : ''} fade-in`} onClick={a.roll}>
        {T.trail.roll}
      </button>
    );

  const endBtn = (
    <button type="button" class="tiny tiny--pill" onClick={a.askEnd} disabled={s.confirmingEnd} aria-expanded={s.confirmingEnd}>
      <span>{T.trail.end}</span>
    </button>
  );

  const board = (
    <Board
      players={s.players}
      stonesCount={totalTurns(s)}
      pos={s.turnsDone}
      haloId={s.current}
      atFire={false}
      move={move}
      onSettled={() => setSettled(true)}
      label={label}
      width={wide ? boardW : undefined}
    >
      {wide && <div class={`overlay ${s.trailStep === 'roll' && !s.confirmingEnd ? 'at-roll' : 'at-panel'}${s.players.length >= 6 ? ' is-six' : ''}`}>{action}</div>}
    </Board>
  );

  if (wide) {
    return (
      <main class="screen wide s2">
        <div class="tbar">
          <TurnHeading player={current} chip />
          <div class="tbar-end">
            <span class="round">{round}</span>
            {endBtn}
          </div>
        </div>
        <div class="board-area">{board}</div>
      </main>
    );
  }

  return (
    <main class="screen phone s2">
      <div class="bar">
        <span class="round">{round}</span>
        {endBtn}
      </div>
      <div class="turn-wrap">
        <TurnHeading player={current} />
      </div>
      {board}
      <div class={`s2-bottom${s.trailStep === 'next' || s.confirmingEnd ? ' is-panel' : ''}`}>{action}</div>
    </main>
  );
}
