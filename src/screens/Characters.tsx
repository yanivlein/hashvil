import { useRef, useState } from 'preact/hooks';
import { cleanName, T, type Role } from '../content';
import { ANIMALS, type Animal, type Player } from '../engine';
import { charSrc } from '../components/bits';
import { PlusIcon } from '../components/icons';

/**
 * S1 (handoff §9/5): tap an animal → the form opens (name, ילד/ה · הורה). "להוסיף עוד" saves and clears the selection
 * (shown when there is a name and there will still be fewer than six). "יוצאים לדרך" from two players, and also saves the open form.
 * Tapping a taken animal edits it. No deleting; an empty name is not saved.
 */
export function Characters({ players, onChange, onGo }: {
  players: Player[];
  onChange: (p: Player[]) => void;
  onGo: (p: Player[]) => void;
}) {
  const [sel, setSel] = useState<Animal | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('child');
  const input = useRef<HTMLInputElement>(null);

  const existing = sel ? players.find((p) => p.animal === sel) : undefined;
  const trimmed = name.trim();

  /** the players list with the open form saved into it */
  const merged = (): Player[] => {
    if (!sel || !trimmed) return players;
    const p: Player = { id: sel, animal: sel, name: trimmed, role };
    return existing ? players.map((x) => (x.animal === sel ? p : x)) : [...players, p];
  };

  const pick = (a: Animal) => {
    const list = merged();
    if (list !== players) onChange(list);
    const ex = list.find((p) => p.animal === a);
    setSel(a);
    setName(ex?.name ?? '');
    setRole(ex?.role ?? 'child');
    // focus inside the tap itself, so the phone keyboard opens (iOS ignores a later focus)
    input.current?.focus();
  };

  const addMore = () => {
    onChange(merged());
    input.current?.blur();
    setSel(null);
    setName('');
    setRole('child');
  };

  const after = merged();
  const showAdd = !!sel && !!trimmed && after.length < 6;
  const showGo = after.length >= 2;

  return (
    <main class="screen">
      <div class="col s1">
        <h1 class="title">{T.characters.title}</h1>
        <div class="strip">
          {ANIMALS.map((a) => {
            const p = players.find((x) => x.animal === a);
            const label = a === sel ? name.trim() : p?.name ?? '';
            return (
              <button
                key={a}
                type="button"
                class={`animal${a === sel ? ' is-lit' : ''}`}
                aria-pressed={a === sel}
                aria-label={label || T.characters.animals[a]}
                onClick={() => pick(a)}
              >
                <span class="fig">
                  <img src={charSrc(a)} alt="" draggable={false} />
                </span>
                <span class="name">{label}</span>
              </button>
            );
          })}
        </div>

        {/* the form stays mounted (invisible until an animal is chosen) so the tap can focus the name field */}
        <div class={`s1-form${sel ? ' fade-in' : ' is-hidden'}`} aria-hidden={sel ? undefined : 'true'}>
            <input
              ref={input}
              class="input"
              type="text"
              inputMode="text"
              autoComplete="off"
              enterKeyHint="done"
              maxLength={12}
              placeholder={T.characters.namePlaceholder}
              aria-label={T.characters.namePlaceholder}
              value={name}
              tabIndex={sel ? 0 : -1}
              onInput={(e) => setName(cleanName((e.target as HTMLInputElement).value))}
            />
            <div class="seg" role="group" style={sel ? undefined : { visibility: 'hidden' }}>
              <button type="button" aria-pressed={role === 'child'} onClick={() => setRole('child')}>
                {T.characters.child}
              </button>
              <button type="button" aria-pressed={role === 'parent'} onClick={() => setRole('parent')}>
                {T.characters.parent}
              </button>
            </div>
            {showAdd && (
              <button type="button" class="btn btn--dashed btn--block" onClick={addMore}>
                <PlusIcon />
                {T.characters.addMore}
              </button>
            )}
        </div>

        <div class="grow" />
        {showGo && (
          <button type="button" class="btn btn--primary btn--block s1-go fade-in" onClick={() => onGo(merged())}>
            {T.characters.go}
          </button>
        )}
      </div>
    </main>
  );
}
