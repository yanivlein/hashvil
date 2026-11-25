import { useEffect, useRef, useState } from 'preact/hooks';
import { T, type Face } from '../content';
import type { Player } from '../engine';
import { reducedMotion } from '../platform';
import { DeckBadge, Portrait, Speaker } from './bits';
import { FaceIcon } from './icons';

const isLong = (t: string) => t.length > 48;

/** The sentence. "קלף אחר" swaps it with a 100ms fade out and 100ms fade in, without another flip. */
function Sentence({ text, forceLong }: { text: string; forceLong?: boolean }) {
  const [shown, setShown] = useState(text);
  const [out, setOut] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reducedMotion()) {
      setShown(text);
      return;
    }
    setOut(true);
    const t = window.setTimeout(() => {
      setShown(text);
      setOut(false);
    }, 100);
    return () => window.clearTimeout(t);
  }, [text]);
  return (
    <p class={`text${forceLong || isLong(shown) ? ' is-long' : ''}${out ? ' is-out' : ''}`} aria-live="polite">
      {shown}
    </p>
  );
}

/**
 * The card in its three kinds: regular; "!" (portrait of the chosen player, the name is already in the sentence);
 * "?" (portrait and name of who answers). `reveal` = rise 300ms, then flip 400ms (motion-spec §2).
 */
export function Card({
  face,
  text,
  target,
  reveal,
  onOther,
}: {
  face: Face;
  text: string;
  target?: Player;
  reveal: boolean;
  onOther: () => void;
}) {
  const anim = reveal && !reducedMotion();
  return (
    <div class={`card-stage${reveal && !anim ? ' fade-in' : ''}`}>
      <div class={`riser${anim ? ' is-rising' : ''}`}>
        <div class={`flip${anim ? ' is-flipping' : ''}`}>
          {anim && (
            <div class="card-back" data-deck={face} aria-hidden="true">
              <FaceIcon face={face} />
            </div>
          )}
          <article class="card card-front" data-deck={face}>
            <div class="top">
              <DeckBadge face={face} />
              {target && face === 4 && (
                <span class="to">
                  <Portrait player={target} onCard />
                </span>
              )}
              {target && face === 5 && (
                <span class="to">
                  <Portrait player={target} onCard />
                  <span class="name">{target.name}</span>
                </span>
              )}
              <button type="button" class="tiny tiny--link other" onClick={onOther}>
                <span>{T.turn.other}</span>
              </button>
            </div>
            <Sentence text={text} />
            <div class="foot">
              <Speaker text={text} />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

/** S5: the one closing card for everyone. No deck badge, no "קלף אחר". */
export function ClosingCard() {
  return (
    <article class="card card--closing">
      <Sentence text={T.end.closing} forceLong />
      <div class="foot">
        <Speaker text={T.end.closing} />
      </div>
    </article>
  );
}
