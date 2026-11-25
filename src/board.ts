/** Board geometry (spec section 7, design/trail/board-layout.json). Fractions of the board image unless stated. */
import points from './data/trail-points.json';
import layout from './data/board-layout.json';

export interface Pt {
  x: number;
  y: number;
}

export const ALL_STONES: Pt[] = points.stones;
export const START: Pt = points.start;
export const END: Pt = points.end;
export const GATHER: Pt[] = layout.gather.feet.map(([x, y]) => ({ x, y }));

/** N stones evenly spread along the 24 measured points, by index, interpolating between neighbours. First = point 0, last = point 23. */
export function pickStones(n: number, all: Pt[] = ALL_STONES): Pt[] {
  if (n <= 0) return [];
  if (n === 1) return [all[all.length - 1]];
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i * (all.length - 1)) / (n - 1);
    const a = Math.floor(t);
    const b = Math.min(a + 1, all.length - 1);
    const f = t - a;
    out.push({ x: all[a].x + (all[b].x - all[a].x) * f, y: all[a].y + (all[b].y - all[a].y) * f });
  }
  return out;
}

/** Where the group stands: 0 = doorstep, k = stone k (1-based). */
export function groupAt(pos: number, stones: Pt[]): Pt {
  if (pos <= 0 || stones.length === 0) return START;
  return stones[Math.min(pos, stones.length) - 1];
}

export const pieceHeight = (boardH: number) => Math.max(0.09 * boardH, 34);

/**
 * Feet of player i (join order) in a group of `count` on the stone `at`, in board pixels.
 * One row centred on the stone, the first player on the right, step = half a piece height. The row stays inside 3%–97% of the width.
 */
export function feetOnStone(at: Pt, i: number, count: number, W: number, H: number): Pt {
  const ph = pieceHeight(H);
  const step = 0.5 * ph;
  const half = ((count - 1) / 2) * step;
  let cx = at.x * W;
  cx = Math.max(0.03 * W + half, Math.min(0.97 * W - half, cx));
  return { x: cx + half - i * step, y: (at.y + 0.012) * H };
}

/** Feet of player i at the campfire (six fixed places), scaled for larger pieces. */
export function feetAtFire(i: number, W: number, H: number): Pt {
  const ph = pieceHeight(H);
  const k = ph / (0.09 * H);
  const g = GATHER[i % GATHER.length];
  let x = END.x + (g.x - END.x) * k;
  const y = END.y + (g.y - END.y) * k;
  x = Math.min(x, 1 - (0.32 * ph) / W);
  return { x: x * W, y: y * H };
}
