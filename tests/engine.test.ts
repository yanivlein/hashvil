import { describe, expect, it } from 'vitest';
import { cardById, cardText, cleanName, deckCards, fill, roundLabel, T, type Face, type Reservist, type Role } from '../src/content';
import * as E from '../src/engine';
import { ALL_STONES, feetOnStone, groupAt, pickStones, START } from '../src/board';

/** deterministic rng */
function seeded(seed = 1): E.Rng {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

const NAMES = ['נועה', 'יואב', 'אמא', 'אבא', 'דנה', 'עומר'];
function players(n: number): E.Player[] {
  return E.ANIMALS.slice(0, n).map((a, i) => ({ id: a, animal: a, name: NAMES[i], role: (i < 2 ? 'child' : 'parent') as Role }));
}
function game(n = 4, setup: Partial<E.Setup> = {}): E.GameState {
  const s = E.startCharacters(E.initialState(), { ...E.DEFAULT_SETUP, ...setup });
  return E.startTrail(s, players(n));
}

const RESERVISTS: Reservist[] = ['father', 'mother', 'both', 'none'];

describe('deck filtering by S0 (criterion 2)', () => {
  it('no reserve card when "אף אחד"; no siren card when "לא"', () => {
    for (const face of [1, 2, 3, 4, 5] as Face[]) {
      const ids = E.eligibleIds(face, { reservist: 'none', sirens: false });
      for (const id of ids) {
        const c = cardById(id)!;
        expect(c.when).toBeUndefined();
      }
    }
  });
  it('reserve cards in when a parent served, siren cards in when there were sirens', () => {
    const all = (r: Reservist, sirens: boolean) => ([1, 2, 3, 4, 5] as Face[]).flatMap((f) => E.eligibleIds(f, { reservist: r, sirens }));
    expect(all('father', true)).toHaveLength(50);
    expect(all('none', false)).toHaveLength(50 - 3 - 2);
    expect(all('none', true)).toContain('1-3');
    expect(all('none', true)).not.toContain('1-1');
    expect(all('mother', false)).toContain('5-3');
    expect(all('mother', false)).not.toContain('2-3');
  });
  it('a whole game never draws a filtered card', () => {
    const rng = seeded(7);
    let s = game(6, { reservist: 'none', sirens: false, rounds: 4 });
    const seen: string[] = [];
    for (let i = 0; i < 400; i++) {
      for (const f of [1, 2, 3, 4, 5] as Face[]) {
        const d = E.draw(s, f, rng);
        s = d.state;
        seen.push(d.cardId);
      }
    }
    for (const id of seen) expect(cardById(id)!.when).toBeUndefined();
  });
});

describe('the deck', () => {
  it('a card does not come back until the deck is used up, then it is reshuffled', () => {
    const rng = seeded(3);
    let s = game(4, { reservist: 'father', sirens: true });
    const ids = E.eligibleIds(1, E.conditionsOf(s));
    const first: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const d = E.draw(s, 1, rng);
      s = d.state;
      first.push(d.cardId);
    }
    expect(new Set(first).size).toBe(ids.length);
    const d = E.draw(s, 1, rng);
    expect(ids).toContain(d.cardId);
  });
  it('"קלף אחר" gives another card of the same deck', () => {
    const rng = seeded(5);
    let s = E.roll(game(), rng, 2);
    const before = s.turn!.cardId!;
    s = E.otherCard(s, rng);
    expect(s.turn!.cardId).not.toBe(before);
    expect(s.turn!.cardId!.startsWith('2-')).toBe(true);
  });
});

describe('the turn and the "not twice in a round" rule (criterion 4)', () => {
  it('whoever played in this round cannot be chosen in "מי הבא?" until everyone has played', () => {
    const rng = seeded(11);
    let s = game(4);
    expect(s.current).toBe('fox'); // the first player added starts
    s = E.finishTurn(E.roll(s, rng, 1));
    expect(s.trailStep).toBe('next');
    expect(E.canBeNext(s, 'fox')).toBe(false);
    expect(E.chooseNext(s, 'fox')).toBe(s); // refused
    s = E.chooseNext(s, 'owl');
    s = E.finishTurn(E.roll(s, rng, 3));
    expect(E.canBeNext(s, 'owl')).toBe(false);
    expect(E.canBeNext(s, 'fox')).toBe(false);
    s = E.chooseNext(s, 'hedgehog');
    s = E.finishTurn(E.roll(s, rng, 6));
    s = E.chooseNext(s, 'turtle');
    expect(s.round).toBe(1);
    s = E.finishTurn(E.roll(s, rng, 2));
    // after the last in the round, the round advances and everyone is available again
    expect(s.round).toBe(2);
    for (const p of s.players) expect(E.canBeNext(s, p.id)).toBe(true);
  });
  it('"בוחר/ת לא לענות" in "למי?" ends the turn like "סיימתי"', () => {
    const rng = seeded(2);
    const s = E.roll(game(), rng, 4);
    expect(s.turn!.step).toBe('pick');
    const a = E.finishTurn(s);
    expect(a.turnsDone).toBe(1);
    expect(a.phase).toBe('trail');
  });
  it('"!" and "?" cannot pick the roller', () => {
    const rng = seeded(2);
    const s = E.roll(game(), rng, 5);
    expect(E.pickTarget(s, 'fox', rng)).toBe(s);
    expect(E.pickTarget(s, 'owl', rng).turn!.target).toBe('owl');
  });
  it('"סיום" alone does not end the game; "להמשיך" returns to the same state (criterion 9)', () => {
    const rng = seeded(4);
    let s = E.chooseNext(E.finishTurn(E.roll(game(), rng, 1)), 'owl');
    const asked = E.askEnd(s);
    expect(asked.phase).toBe('trail');
    expect(E.cancelEnd(asked)).toEqual(s);
    expect(E.confirmEnd(asked).phase).toBe('end');
    // also from "מי הבא?"
    s = E.finishTurn(E.roll(s, rng, 1));
    expect(E.cancelEnd(E.askEnd(s))).toEqual(s);
  });
});

describe('stones (criterion 5)', () => {
  it('stones = rounds × players, for every combination, evenly from the 24 points', () => {
    for (const rounds of [2, 3, 4] as const)
      for (let n = 2; n <= 6; n++) {
        const s = game(n, { rounds });
        const stones = pickStones(E.totalTurns(s));
        expect(stones).toHaveLength(rounds * n);
        expect(stones[0]).toEqual(ALL_STONES[0]);
        expect(stones[stones.length - 1]).toEqual(ALL_STONES[23]);
      }
  });
  it('matches the design mockup for 12 stones', () => {
    const st = pickStones(12);
    expect(st[1].x).toBeCloseTo(0.2658, 3);
    expect(st[5].x).toBeCloseTo(0.42, 3);
  });
  it('the group reaches the last stone exactly on the last turn, then the game ends', () => {
    const rng = seeded(9);
    for (const rounds of [2, 3, 4] as const)
      for (let n = 2; n <= 6; n++) {
        let s = game(n, { rounds });
        const N = E.totalTurns(s);
        expect(groupAt(s.turnsDone, pickStones(N))).toEqual(START);
        let turns = 0;
        while (s.phase !== 'end') {
          s = E.roll(s, rng);
          if (s.turn!.step === 'pick') s = E.pickTarget(s, s.players.find((p) => p.id !== s.current)!.id, rng);
          s = E.finishTurn(s);
          turns++;
          if (s.phase === 'trail') {
            expect(s.turnsDone).toBeLessThan(N);
            s = E.chooseNext(s, s.players.find((p) => E.canBeNext(s, p.id))!.id);
          }
        }
        expect(turns).toBe(N);
        expect(s.turnsDone).toBe(N);
        expect(groupAt(s.turnsDone, pickStones(N))).toEqual(ALL_STONES[23]);
      }
  });
  it('the group row stays inside the board and the first player is on the right', () => {
    const W = 390, H = 260;
    const a = feetOnStone(ALL_STONES[0], 0, 6, W, H);
    const b = feetOnStone(ALL_STONES[0], 5, 6, W, H);
    expect(a.x).toBeGreaterThan(b.x);
    expect(b.x).toBeGreaterThanOrEqual(0.03 * W - 1e-9);
  });
});

describe('no square bracket ever reaches the screen (criterion 8)', () => {
  const uiStrings = (o: unknown): string[] =>
    typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.entries(o).filter(([k]) => k !== 'decks' && k !== '_about').flatMap(([, v]) => uiStrings(v)) : [];

  it('every card, in every setting, for child and parent, with any name', () => {
    for (const face of [1, 2, 3, 4, 5] as Face[])
      for (const card of deckCards(face))
        for (const reservist of RESERVISTS)
          for (const role of ['child', 'parent'] as Role[])
            for (const name of NAMES) {
              const t = cardText(card, { reservist, sirens: true }, role, name);
              expect(t).not.toMatch(/[[\]]/);
              expect(t.length).toBeGreaterThan(5);
              if (face === 4) expect(t.startsWith(name)).toBe(true);
            }
  });
  it('every interface string, after filling', () => {
    for (const s of uiStrings(T)) expect(fill(s, { סבב: 2, סבבים: 3 })).not.toMatch(/[[\]]/);
    expect(roundLabel(2, 3)).toBe('סבב 2 מתוך 3');
  });
  it('names typed with brackets are cleaned', () => {
    expect(cleanName('[שם]')).toBe('שם');
    expect(cleanName('אבגדהוזחטיכלמנ')).toHaveLength(12);
  });
});

describe('the parent who served, in the right wording (criterion 10)', () => {
  const c = (r: Reservist) => ({ reservist: r, sirens: false });
  it('heart 1 and 2 follow S0, with no slash in the verb', () => {
    const one = cardById('1-1')!;
    const two = cardById('1-2')!;
    expect(cardText(one, c('father'), 'child')).toBe('כשאבא יצא למילואים, הרגשתי...');
    expect(cardText(one, c('mother'), 'child')).toBe('כשאמא יצאה למילואים, הרגשתי...');
    expect(cardText(one, c('both'), 'child')).toBe('כשההורים היו במילואים, הרגשתי...');
    expect(cardText(two, c('father'), 'child')).toBe('ביום שאבא חזר הביתה, הרגשתי...');
    expect(cardText(two, c('mother'), 'child')).toBe('ביום שאמא חזרה הביתה, הרגשתי...');
    expect(cardText(two, c('both'), 'child')).toBe('ביום שההורים חזרו הביתה, הרגשתי...');
    for (const r of ['father', 'mother', 'both'] as Reservist[]) {
      expect(cardText(one, c(r), 'child')).not.toContain('/');
      expect(cardText(two, c(r), 'child')).not.toContain('/');
    }
  });
  it('a parent gets the parent version', () => {
    expect(cardText(cardById('1-1')!, c('father'), 'parent')).toBe('כשהמילואים התחילו, הרגשתי...');
    expect(cardText(cardById('1-4')!, c('none'), 'parent')).toBe('בלילה, כשאני לא נרדם/ת, מה שעובר לי בראש הוא...');
  });
  it('the deck has 10 cards in each of the five card faces', () => {
    for (const f of [1, 2, 3, 4, 5] as Face[]) expect(deckCards(f)).toHaveLength(10);
  });
});
