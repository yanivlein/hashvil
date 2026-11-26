import { useEffect, useState } from 'preact/hooks';
import { T, type Face } from '../content';
import type { Player } from '../engine';
import { asset, fullscreenSupported, hebrewVoice, isFullscreen, onFullscreenChange, onVoicesChanged, speak, stopSpeaking, toggleFullscreen } from '../platform';
import { FaceIcon, FullscreenIcon, MusicIcon, SpeakerIcon } from './icons';

export const charSrc = (animal: string) => asset(`characters/${animal}.png`);

export function Portrait({ player, lit, size, onCard }: { player: Player; lit?: boolean; size?: number; onCard?: boolean }) {
  return (
    <span class={`portrait${lit ? ' is-lit' : ''}${onCard ? ' on-card' : ''}`} style={size ? { '--d': `${size}px` } : undefined}>
      <img src={charSrc(player.animal)} alt="" draggable={false} />
    </span>
  );
}

/** The player whose turn it is: lit portrait + name. `chip` = the small version on S3/S4; `stack` = portrait above the name (side column). */
export function TurnHeading({ player, chip, stack }: { player: Player; chip?: boolean; stack?: boolean }) {
  return (
    <div class={`turn${chip ? ' turn--chip' : ''}${stack ? ' turn--stack' : ''}`}>
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
  side,
}: {
  question: string;
  players: Player[];
  isDim?: (p: Player) => boolean;
  onPick: (p: Player) => void;
  id: string;
  /** the side column of the wide layout (288 wide): up to 3 in one row; 4 as 2 + 2; 5 and 6 as rows of 3 (handoff §4) */
  side?: boolean;
}) {
  const n = players.length;
  const fig = side ? (n === 2 ? 104 : n === 4 ? 96 : 84) : n >= 6 ? 82 : n === 5 ? 96 : 104;
  const perRow = side && n > 3 ? (n === 4 ? 2 : 3) : 0;
  return (
    <section class="picker" role="group" aria-labelledby={id} style={{ '--fig': `${fig}px`, '--per-row': perRow || undefined }}>
      <h2 class="q" id={id}>
        {question}
      </h2>
      <div class={`crow${n >= 6 && !side ? ' crow--six' : ''}${perRow ? ' crow--wrap' : ''}`}>
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

/** Full screen: supported (else nothing is shown, e.g. iPhone) and the current state, kept in sync with Esc. */
export function useFullscreen() {
  const [supported] = useState(fullscreenSupported);
  const [on, setOn] = useState(isFullscreen);
  useEffect(() => onFullscreenChange(() => setOn(isFullscreen())), []);
  return { supported, on, toggle: toggleFullscreen };
}

/** S0: the tiny pill above the credit line. The words are the name; the icon is hidden from screen readers. */
export function FullscreenPill() {
  const fs = useFullscreen();
  if (!fs.supported) return null;
  return (
    <button type="button" class="tiny tiny--pill tiny--fs" onClick={fs.toggle}>
      <span>
        <FullscreenIcon exit={fs.on} />
        {fs.on ? T.app.fullscreenExit : T.app.fullscreen}
      </span>
    </button>
  );
}

/**
 * The tiny row of S2 and S5 (C-top-row), right to left: "סיום" (S2 only), mute, full screen (in the corner).
 * The aria-label says what a press will do; the state shows only in the icon (no colour, no aria-pressed).
 */
export function TinyRow({ sound, onSound, onEnd, endOpen }: { sound: boolean; onSound: (on: boolean) => void; onEnd?: () => void; endOpen?: boolean }) {
  const fs = useFullscreen();
  return (
    <div class="tiny-row">
      {onEnd && (
        <button type="button" class="tiny tiny--pill" onClick={onEnd} disabled={endOpen} aria-expanded={endOpen}>
          <span>{T.trail.end}</span>
        </button>
      )}
      <button type="button" class="tiny tiny--icon" aria-label={sound ? T.app.mute : T.app.unmute} onClick={() => onSound(!sound)}>
        <span>
          <MusicIcon off={!sound} />
        </span>
      </button>
      {fs.supported && (
        <button type="button" class="tiny tiny--icon" aria-label={fs.on ? T.app.fullscreenExit : T.app.fullscreen} onClick={fs.toggle}>
          <span>
            <FullscreenIcon exit={fs.on} />
          </span>
        </button>
      )}
    </div>
  );
}
