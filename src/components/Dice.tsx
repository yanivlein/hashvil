import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { T, type Face } from '../content';
import { buzz, reducedMotion } from '../platform';
import * as sound from '../sound';
import { FaceIcon } from './icons';

/** motion-spec §1: the rotation that brings each face to the front. Angles accumulate between rolls, so the die always turns forward. */
const FACE_ROT: Record<Face, [number, number]> = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
let rx = 0;
let ry = 0;
const next = (current: number, target: number, turns: number) => Math.ceil(current / 360) * 360 + turns * 360 + target;

/**
 * The die. `rolling` = this face was just rolled in this session: the roll sound and 1.2s of turning with ease-out,
 * then (the stop) vibrate once and onStop, wait 250ms, onDone.
 * Otherwise (a restore after refresh) it stands on the face at once.
 */
export function Dice({ face, rolling, onStop, onDone, size = 112 }: { face: Face; rolling: boolean; onStop?: () => void; onDone?: () => void; size?: number }) {
  const cube = useRef<HTMLDivElement>(null);
  const [stopped, setStopped] = useState(!rolling);
  const done = useRef(onDone);
  done.current = onDone;
  const stop = useRef(onStop);
  stop.current = onStop;

  useLayoutEffect(() => {
    const el = cube.current!;
    if (!rolling) {
      const [x, y] = FACE_ROT[face];
      rx = next(rx, x, 0);
      ry = next(ry, y, 0);
      el.style.transition = 'none';
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      return;
    }
    const finish = () => {
      buzz();
      stop.current?.();
      setStopped(true);
      window.setTimeout(() => done.current?.(), 250);
    };
    if (reducedMotion()) {
      rx = next(rx, FACE_ROT[face][0], 0);
      ry = next(ry, FACE_ROT[face][1], 0);
      el.style.transition = 'none';
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      const t = window.setTimeout(finish, 200);
      return () => window.clearTimeout(t);
    }
    // the roll sound runs with the turning (1.2s); with reduced motion there is no roll, and no roll sound
    sound.play('dice');
    // start from where the last roll ended
    el.style.transition = 'none';
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    void el.offsetWidth;
    rx = next(rx, FACE_ROT[face][0], 2);
    ry = next(ry, FACE_ROT[face][1], 3);
    el.style.transition = '';
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    let fired = false;
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform' || fired) return;
      fired = true;
      finish();
    };
    el.addEventListener('transitionend', onEnd);
    // safety net if transitionend never comes (background tab)
    const t = window.setTimeout(() => !fired && ((fired = true), finish()), 1500);
    return () => {
      el.removeEventListener('transitionend', onEnd);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div class={`dice${rolling && reducedMotion() ? ' fade-in' : ''}`} style={{ '--size': `${size}px` }} aria-live="polite">
      <div role={stopped ? 'img' : undefined} aria-label={stopped ? T.decks[String(face)].name : undefined} aria-hidden={stopped ? undefined : 'true'} class="dice-inner">
        <span class="dice-ground" />
        <div class="tilt">
          <div class="cube" ref={cube}>
            <span class="core" />
            <span class="core x" />
            <span class="core y" />
            {([1, 2, 3, 4, 5, 6] as Face[]).map((f) => (
              <div key={f} class={`face f${f}`}>
                <FaceIcon face={f} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
