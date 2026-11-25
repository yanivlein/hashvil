import { useState } from 'preact/hooks';
import { T, type Reservist } from '../content';
import type { Setup as SetupT } from '../engine';
import { asset } from '../platform';

function Seg<V extends string | number | boolean>({ id, label, options, value, onChange }: {
  id: string;
  label: string;
  options: Array<[V, string]>;
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div class="field">
      <span class="label" id={id}>
        {label}
      </span>
      <div class="seg" role="group" aria-labelledby={id}>
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** S0: three questions, filled by the therapist before the family comes in. Defaults: "אף אחד", "לא", 3 (handoff §9/1). */
export function Setup({ initial, onStart }: { initial: SetupT; onStart: (s: SetupT) => void }) {
  const [reservist, setReservist] = useState<Reservist>(initial.reservist);
  const [sirens, setSirens] = useState(initial.sirens);
  const [rounds, setRounds] = useState<2 | 3 | 4>(initial.rounds);
  const r = T.setup.reservist;
  return (
    <main class="screen">
      <div class="col s0">
        <header class="s0-head">
          <img class="app-icon" src={asset('icon-192.png')} alt="" />
          <h1>{T.app.name}</h1>
        </header>
        <div class="s0-fields">
          <Seg id="q-res" label={T.setup.reservistQ} value={reservist} onChange={setReservist}
            options={[['father', r.father], ['mother', r.mother], ['both', r.both], ['none', r.none]]} />
          <Seg id="q-sir" label={T.setup.sirensQ} value={sirens} onChange={setSirens}
            options={[[true, T.setup.sirens.yes], [false, T.setup.sirens.no]]} />
          <Seg id="q-rounds" label={T.setup.roundsQ} value={rounds} onChange={setRounds}
            options={[[2, '2'], [3, '3'], [4, '4']]} />
        </div>
        <div class="s0-go">
          <button type="button" class="btn btn--primary btn--block" onClick={() => onStart({ reservist, sirens, rounds })}>
            {T.setup.start}
          </button>
          <p class="note">{T.setup.note}</p>
        </div>
        <p class="credit">{T.app.credit}</p>
      </div>
    </main>
  );
}
