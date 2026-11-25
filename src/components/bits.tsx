import { useEffect, useState } from 'preact/hooks';
import { T, type Face } from '../content';
import type { Player } from '../engine';
import { asset, hebrewVoice, onVoicesChanged, speak, stopSpeaking } from '../platform';
import { FaceIcon, SpeakerIcon } from './icons';

export const charSrc = (animal: string) => asset(`characters/${animal}.png`);

export function Portrait({ player, lit, size, onCard }: { player: Player; lit?: boolean; size?: number; onCard?: boolean }) {
  return (
    <span class={`portrait${lit ? ' is-lit' : ''}${onCard ? ' on-card' : ''}`} style={size ? { '--d': `${size}px` } : undefined}>
      <img src={charSrc(player.animal)} alt="" draggable={false} />
    </span>
  );
}

/** The player whose turn it is: lit portrait + name. `chip` = the small version on S3/S4 and on the tablet bar. */
export function TurnHeading({ player, chip }: { player: Player; chip?: boolean }) {
  return (
    <div class={`turn${chip ? ' turn--chip' : ''}`}>
      <Portrait player={player} lit />
      <span class="name">{player.name}</span>
    </div>
  );
}

export function DeckBadge({ face }: { face: Face }) {
  return (
    <span class="deck-badge" data-deck={face} role="img" aria-label={T.decks[String(face)].name}>
      <FaceIcon face={face} />
    </span>
  );
}

/** "שורת הדמויות": one component for "למי?", "מי עונה?" and "מי הבא?". */
export function CharacterRow({
  question,
  players,
  isDim,
  onPick,
  id,
}: {
  question: string;
  players: Player[];
  isDim?: (p: Player) => boolean;
  onPick: (p: Player) => void;
  id: string;
}) {
  const n = players.length;
  const fig = n >= 6 ? 82 : n === 5 ? 96 : 104;
  return (
    <section class="picker" role="group" aria-labelledby={id} style={{ '--fig': `${fig}px` }}>
      <h2 class="q" id={id}>
        {question}
      </h2>
      <div class={`crow${n >= 6 ? ' crow--six' : ''}`}>
        {players.map((p) => {
          const dim = isDim?.(p) ?? false;
          return (
            <button
              key={p.id}
              type="button"
              class={`who${dim ? ' is-dim' : ''}`}
              aria-disabled={dim ? 'true' : undefined}
              onClick={() => !dim && onPick(p)}
            >
              <span class="fig">
                <img src={charSrc(p.animal)} alt="" draggable={false} />
              </span>
              <span class="name">{p.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** The speaker: reads the sentence on press only. Hidden when the device has no Hebrew voice. */
export function Speaker({ text }: { text: string }) {
  const [has, setHas] = useState(() => !!hebrewVoice());
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => setHas(!!hebrewVoice());
    check(); // the list may have arrived between the first render and this effect
    return onVoicesChanged(check);
  }, []);
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    // a new sentence ("קלף אחר") stops the old reading
    stopSpeaking();
    setOn(false);
  }, [text]);
  if (!has) return null;
  return (
    <button
      type="button"
      class={`speak${on ? ' is-on' : ''}`}
      aria-label={T.turn.speak}
      aria-pressed={on}
      onClick={() => {
        if (on) {
          stopSpeaking();
          setOn(false);
        } else {
          setOn(true);
          speak(text, () => setOn(false));
        }
      }}
    >
      <SpeakerIcon />
    </button>
  );
}
