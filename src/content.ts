import raw from './content/content.trail.he.json';

export type Reservist = 'father' | 'mother' | 'both' | 'none';
export type Face = 1 | 2 | 3 | 4 | 5 | 6;
export type Role = 'child' | 'parent';
/** S0 "אורך המשחק" (doc 15 §1): short = 2 rounds, medium = 3, long = 4. "סבב X מתוך Y" is unchanged. */
export type GameLength = 'short' | 'medium' | 'long';
export const ROUNDS_OF: Record<GameLength, 2 | 3 | 4> = { short: 2, medium: 3, long: 4 };
export const lengthOf = (rounds: number): GameLength => (rounds <= 2 ? 'short' : rounds >= 4 ? 'long' : 'medium');

export interface CardDef {
  id: string;
  when?: 'reserve' | 'sirens';
  text: string | { father: string; mother: string; both: string };
  parent?: string;
}

export const T = raw as unknown as {
  app: { name: string; credit: string[]; fullscreen: string; fullscreenExit: string; mute: string; unmute: string };
  setup: {
    reservistQ: string;
    reservist: Record<Reservist, string>;
    sirensQ: string;
    sirens: { yes: string; no: string };
    lengthQ: string;
    length: Record<GameLength, string>;
    lengthHint: string;
    cardsHint: string;
    soundQ: string;
    sound: { on: string; off: string };
    start: string;
    note: string;
  };
  characters: {
    title: string;
    namePlaceholder: string;
    child: string;
    parent: string;
    addMore: string;
    go: string;
    animals: Record<string, string>;
  };
  trail: { round: string; end: string; roll: string; next: string; confirmQ: string; confirmYes: string; confirmNo: string };
  turn: { toWhom: string; whoAnswers: string; done: string; pass: string; other: string; speak: string };
  refuel: { line: string; skip: string; done: string };
  end: { closing: string; finish: string };
  decks: Record<string, { name: string; cards: CardDef[] }>;
};

/** Replace every [key] with vars[key]. Any placeholder left over is removed, so no square bracket ever reaches the screen. */
export function fill(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\[([^\]]*)\]/g, (_, k: string) => (k in vars ? String(vars[k]) : '')).replace(/[[\]]/g, '');
}

/** Names come from the keyboard: brackets are stripped so they can never look like a placeholder. */
export function cleanName(name: string): string {
  return name.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trimStart().slice(0, 12);
}

export function deckCards(face: Face): CardDef[] {
  return T.decks[String(face)]?.cards ?? [];
}

export function cardById(id: string): CardDef | undefined {
  const face = id.split('-')[0];
  return T.decks[face]?.cards.find((c) => c.id === id);
}

export interface Conditions {
  reservist: Reservist;
  sirens: boolean;
}

/** Section 6/10.5: reserve cards only when a parent served; siren cards only when there were sirens. */
export function eligible(card: CardDef, c: Conditions): boolean {
  if (card.when === 'reserve') return c.reservist !== 'none';
  if (card.when === 'sirens') return c.sirens;
  return true;
}

/** The sentence on the card, fully resolved. answerer = who answers (decides the parent version); name = the chosen player for "!" cards. */
export function cardText(card: CardDef, c: Conditions, answererRole: Role, name = ''): string {
  let t: string;
  if (answererRole === 'parent' && card.parent) t = card.parent;
  else if (typeof card.text === 'string') t = card.text;
  else t = card.text[c.reservist === 'none' ? 'both' : c.reservist];
  return fill(t, { שם: name });
}

export const roundLabel = (round: number, rounds: number) => fill(T.trail.round, { סבב: round, סבבים: rounds });
