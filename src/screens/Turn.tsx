import { useEffect, useState } from 'preact/hooks';
import { cardText, T } from '../content';
import { conditionsOf, openCard, playerById, type GameState, type Player } from '../engine';
import { reducedMotion } from '../platform';
import { CharacterRow, TurnHeading } from '../components/bits';
import { Card } from '../components/Card';
import { Candle } from '../components/Candle';
import { Dice } from '../components/Dice';

export interface TurnActions {
  pick: (id: string) => void;
  other: () => void;
  finish: () => void;
}

type Stage = 'rolling' | 'pick' | 'picked' | 'reveal' | 'card' | 'refuel';

/** S4: two breaths with the candle (about 20s), or "לדלג". "לדלג" ends the turn at once, like "סיימתי" (handoff §9/11). */
function Refuel({ roller, finish }: { roller: Player; finish: () => void }) {
  const [rest, setRest] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setRest(true), 20000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <main class="screen slow">
      <div class="col tall s4">
        <div class="chip-row">
          <TurnHeading player={roller} chip />
        </div>
        <p class="refuel-line">{T.refuel.line}</p>
        <div class="candle-area">
          <Candle resting={rest} />
        </div>
        <div class="bottom">
          {rest ? (
            <button key="done" type="button" class="btn btn--primary btn--block fade-in" onClick={finish}>
              {T.refuel.done}
            </button>
          ) : (
            <button key="skip" type="button" class="btn btn--secondary btn--block" onClick={finish}>
              {T.refuel.skip}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

/** S3: the die and the card. `rolled` = the die was just thrown in this session (otherwise this is a restore after refresh). */
export function Turn({ s, rolled: rolledProp, a }: { s: GameState; rolled: boolean; a: TurnActions }) {
  const [rolled] = useState(rolledProp);
  const t = s.turn!;
  const roller = playerById(s, s.current) as Player;
  const [stage, setStage] = useState<Stage>(() => (rolled ? 'rolling' : t.step === 'card' ? 'card' : t.step));

  const afterRoll = () => {
    if (t.face === 6) window.setTimeout(() => setStage('refuel'), 600 - 250);
    else if (t.face === 4 || t.face === 5) setStage('pick');
    else setStage('reveal');
  };

  if (stage === 'refuel') return <Refuel roller={roller} finish={a.finish} />;

  const others = s.players.filter((p) => p.id !== s.current);
  const card = openCard(s);
  const target = playerById(s, t.target);
  // "?": the chosen player answers, so their role picks the parent version; otherwise the roller answers
  const answerer = t.face === 5 && target ? target : roller;
  const text = card ? cardText(card, conditionsOf(s), answerer.role, target?.name ?? '') : '';

  const onPick = (p: Player) => {
    a.pick(p.id);
    if (reducedMotion()) setStage('reveal');
    else {
      setStage('picked');
      window.setTimeout(() => setStage('reveal'), 200);
    }
  };

  let slot;
  if (stage === 'rolling') slot = <div class="card-slot" />;
  else if (stage === 'pick' || stage === 'picked')
    slot = (
      <div class={stage === 'picked' ? 'fade-out' : 'fade-in'}>
        <CharacterRow id="q-pick" question={t.face === 4 ? T.turn.toWhom : T.turn.whoAnswers} players={others} onPick={onPick} />
      </div>
    );
  else slot = card ? <Card key={stage === 'reveal' ? 'r' : 's'} face={t.face} text={text} target={target} reveal={stage === 'reveal'} onOther={a.other} /> : null;

  const showDone = stage === 'reveal' || stage === 'card';
  const showPass = showDone || stage === 'pick';

  return (
    <main class="screen">
      <div class="col tall s3">
        <div class="chip-row">
          <TurnHeading player={roller} chip />
        </div>
        <div class="dice-area">
          <Dice face={t.face} rolling={rolled} onDone={afterRoll} />
        </div>
        <div class="card-area">{slot}</div>
        <div class={`bottom${stage === 'reveal' ? ' after-flip' : ''}`}>
          {showDone ? (
            <button type="button" class="btn btn--primary btn--block" onClick={a.finish}>
              {T.turn.done}
            </button>
          ) : (
            showPass && <span class="btn btn--block is-placeholder" aria-hidden="true" />
          )}
          {showPass && (
            <button type="button" class="btn btn--text btn--block" onClick={a.finish}>
              {T.turn.pass}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
