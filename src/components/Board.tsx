import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { END, feetAtFire, feetOnStone, groupAt, pickStones, pieceHeight, type Pt } from '../board';
import type { Player } from '../engine';
import { asset, reducedMotion } from '../platform';
import { charSrc } from './bits';

/** In-memory only (never persisted): what the board should animate when it mounts. A refresh shows the final state. */
export interface BoardMove {
  fromPos: number;
  /** the player who just finished: hops first (0.5s), then the others follow (0.6s) */
  hopperId?: string;
  /** then everyone walks to the campfire (0.6s) and the fire lights (1s) */
  gather?: boolean;
}

/**
 * The board: board.webp + stones + pieces + halo (+ the lit campfire in S5).
 * Stage of the timeline: 0 = everyone at fromPos, 1 = hopper at pos, 2 = everyone at pos, 3 = at the fire, 4 = fire lit.
 */
export function Board({
  players,
  stonesCount,
  pos,
  haloId,
  atFire,
  move: moveProp,
  onSettled,
  label,
  width,
  children,
}: {
  players: Player[];
  stonesCount: number;
  pos: number;
  haloId?: string;
  atFire: boolean;
  move?: BoardMove;
  onSettled?: () => void;
  label: string;
  /** fixed width in px (tablet); otherwise the board fills its container width */
  width?: number;
  children?: ComponentChildren;
}) {
  const box = useRef<HTMLDivElement>(null);
  // frozen at mount: later renders must not lose the animation plan
  const [move] = useState(moveProp);
  const [W, setW] = useState(width ?? 0);
  const anim = !!move && !reducedMotion();
  const finalStage = atFire ? 4 : 2;
  const [stage, setStage] = useState(() => (anim ? (move!.hopperId ? 0 : 2) : finalStage));
  const settled = useRef(onSettled);
  settled.current = onSettled;

  useLayoutEffect(() => {
    if (width) return setW(width);
    const el = box.current!;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  // the timeline: hop 500 → follow 600 → (walk to fire 600 → fire 1000)
  useEffect(() => {
    if (!move) return;
    if (!anim) {
      // reduced motion: no travel, things just appear in the new place (the fire still fades in)
      const t = window.setTimeout(() => settled.current?.(), atFire ? 1000 : 200);
      return () => window.clearTimeout(t);
    }
    const steps: Array<[number, () => void]> = [];
    let t = 0;
    if (move.hopperId) {
      steps.push([30, () => setStage(1)]);
      t = 30 + 500;
      steps.push([t, () => setStage(2)]);
      t += 600;
    }
    if (move.gather || atFire) {
      steps.push([t + 30, () => setStage(3)]);
      t += 30 + 600;
      steps.push([t, () => setStage(4)]);
      t += 1000;
    }
    steps.push([t, () => settled.current?.()]);
    const ids = steps.map(([ms, fn]) => window.setTimeout(fn, ms));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, []);

  const H = W / 1.5;
  const stones = pickStones(stonesCount);
  const ph = pieceHeight(H || 1);
  const n = players.length;
  const from = move ? move.fromPos : pos;

  const feetOf = (i: number, id: string): Pt => {
    if (stage >= 3) return feetAtFire(i, W, H);
    const p = stage >= 2 || (stage === 1 && id === move?.hopperId) ? pos : from;
    return feetOnStone(groupAt(p, stones), i, n, W, H);
  };

  const hopping = stage === 1;
  const haloIdx = players.findIndex((p) => p.id === haloId);
  const haloFeet = haloIdx >= 0 && stage < 3 ? feetOf(haloIdx, haloId!) : null;
  const dur = (id: string) => {
    if (!anim) return '0ms';
    if (stage === 1) return id === move?.hopperId ? 'var(--hop-ms)' : '0ms';
    if (stage === 2) return id === move?.hopperId ? '0ms' : 'var(--follow-ms)';
    if (stage === 3) return 'var(--follow-ms)';
    return '0ms';
  };

  return (
    <div
      class="board-window"
      ref={box}
      role="img"
      aria-label={label}
      style={{
        width: width ? `${width}px` : '100%',
        height: W ? `${H}px` : undefined,
        aspectRatio: W ? undefined : '3 / 2',
        '--piece': `${ph}px`,
        '--stone-w': `${Math.min(2, Math.max(1, W * 0.0018))}px`,
        '--glow-w': `${Math.min(3, Math.max(1.5, W * 0.0027))}px`,
      }}
    >
      {W > 0 && (
        <div class="board" style={{ width: `${W}px`, height: `${H}px` }}>
          <img class="bg" src={asset('board.webp')} alt="" draggable={false} />
          {stones.map((s, i) => (
            <span key={i} class="stone" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }} />
          ))}
          {haloFeet && (
            <span
              key={haloId}
              class="glow"
              style={{
                transform: `translate(${haloFeet.x}px, ${haloFeet.y - 0.5 * ph - 0.004 * H}px) translate(-50%, -50%)`,
                transitionDuration: anim && hopping ? 'var(--hop-ms)' : '0ms',
              }}
            />
          )}
          {players.map((p, i) => {
            const f = feetOf(i, p.id);
            const isHopper = hopping && p.id === move?.hopperId;
            return (
              <span
                key={p.id}
                class="piece-at"
                aria-hidden="true"
                style={{
                  transform: `translate(${f.x}px, ${f.y}px)`,
                  transitionDuration: dur(p.id),
                  zIndex: isHopper ? 1000 : p.id === haloId ? 900 : Math.round(f.y),
                }}
              >
                <span class={`arc${isHopper ? ' is-hopping' : ''}`}>
                  <img class="piece" src={charSrc(p.animal)} alt="" draggable={false} />
                </span>
              </span>
            );
          })}
          {atFire && (
            <img
              class={`fire${stage >= 4 ? ' is-lit' : ''}`}
              src={asset('campfire-lit.png')}
              alt=""
              draggable={false}
              style={{ left: `${END.x * 100}%`, top: `${END.y * 100}%` }}
            />
          )}
          {children}
        </div>
      )}
    </div>
  );
}
