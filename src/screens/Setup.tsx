import { useState } from 'preact/hooks';
import { Fragment, type ComponentChildren } from 'preact';
import { lengthOf, ROUNDS_OF, T, type GameLength, type Reservist } from '../content';
import type { Setup as SetupT } from '../engine';
import { asset } from '../platform';
import { FullscreenPill } from '../components/bits';

function Seg<V extends string | number | boolean>({ id, label, options, value, onChange, hint, describedBy, inline }: {
  id: string;
  label: string;
  options: Array<[V, string]>;
  value: V;
  onChange: (v: V) => void;
  /** the explanation line under this control (aria-describedby) */
  hint?: ComponentChildren;
  /** or: the id of a shared explanation line elsewhere */
  describedBy?: string;
  /** label and control on one line (the "צליל" switch) */
  inline?: boolean;
}) {
  const hintId = hint ? `${id}-hint` : describedBy;
  return (
    <div class={`field${inline ? ' field--inline' : ''}`}>
      <span class="label" id={id}>
        {label}
      </span>
      <div class="seg" role="group" aria-labelledby={id} aria-describedby={hintId}>
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
      {hint && (
        <p class="hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Keep a number with its unit ("2 סבבים", "10 דקות") and "כ-15." in one piece (handoff §3, S0): a no-break space after
 * each number, and each "כ-…." wrapped so it never breaks after the hyphen.
 */
function noBreaks(text: string): ComponentChildren {
  const t = text.replace(/(\d) /g, '$1 ');
  return t.split(/(כ-\d+(?: \S+?)?\.)/).map((part, i) => (i % 2 ? <span class="nw" key={i}>{part}</span> : part));
}

/**
 * The credit line (handoff §9/30): a part breaks only after a comma between names, never inside a name, after the
 * colon or before "(CC0)"; the "·" between parts stays at the end of the line. Long lists of names may take 3 lines (§10/9).
 */
const glue = (part: string) => part.replace(/(?<!,) /g, ' ');

/** S0, version 1.1 (doc 15 §1): game length first, then the two card questions, the sound switch, "התחלה". */
export function Setup({ initial, sound: initialSound, onStart }: { initial: SetupT; sound: boolean; onStart: (s: SetupT, sound: boolean) => void }) {
  const [length, setLength] = useState<GameLength>(lengthOf(initial.rounds));
  const [reservist, setReservist] = useState<Reservist>(initial.reservist);
  const [sirens, setSirens] = useState(initial.sirens);
  const [sound, setSound] = useState(initialSound);
  const r = T.setup.reservist;
  const L = T.setup.length;
  return (
    <main class="screen scrolls">
      <div class="col s0">
        <header class="s0-head">
          <img class="app-icon" src={asset('icon-192.png')} alt="" />
          <h1>{T.app.name}</h1>
        </header>
        <div class="s0-fields">
          <Seg id="q-len" label={T.setup.lengthQ} value={length} onChange={setLength}
            options={[['short', L.short], ['medium', L.medium], ['long', L.long]]} hint={noBreaks(T.setup.lengthHint)} />
          <div class="s0-pair">
            <Seg id="q-res" label={T.setup.reservistQ} value={reservist} onChange={setReservist} describedBy="q-cards"
              options={[['father', r.father], ['mother', r.mother], ['both', r.both], ['none', r.none]]} />
            <Seg id="q-sir" label={T.setup.sirensQ} value={sirens} onChange={setSirens} describedBy="q-cards"
              options={[[true, T.setup.sirens.yes], [false, T.setup.sirens.no]]} />
            <p class="hint" id="q-cards">
              {T.setup.cardsHint}
            </p>
          </div>
          <Seg id="q-sound" label={T.setup.soundQ} value={sound} onChange={setSound} inline
            options={[[true, T.setup.sound.on], [false, T.setup.sound.off]]} />
        </div>
        <button type="button" class="btn btn--primary btn--block s0-go" onClick={() => onStart({ reservist, sirens, rounds: ROUNDS_OF[length] }, sound)}>
          {T.setup.start}
        </button>
        <p class="note s0-note">{T.setup.note}</p>
        <div class="s0-foot">
          <FullscreenPill />
          <p class="credit">
            {T.app.credit.map((part, i) => (
              <Fragment key={i}>
                {i > 0 && ' · '}
                {glue(part)}
              </Fragment>
            ))}
          </p>
        </div>
      </div>
    </main>
  );
}
