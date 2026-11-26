/**
 * The turn engine (spec section 5). Pure functions over a plain state object, so it can be tested and kept in sessionStorage.
 * The result (face, card, next stone) is decided at the moment of the press; animations only show it.
 */
import { cardById, deckCards, eligible, type Conditions, type Face, type Reservist, type Role } from './content';

export const ANIMALS = ['fox', 'owl', 'hedgehog', 'turtle', 'rabbit', 'bear'] as const;
export type Animal = (typeof ANIMALS)[number];

export interface Player {
  id: string; // = animal
  animal: Animal;
  name: string;
  role: Role;
}

export interface Setup {
  reservist: Reservist;
  sirens: boolean;
  rounds: 2 | 3 | 4;
}

export interface TurnState {
  face: Face;
  /** pick = "למי?" / "מי עונה?"; card = the card is open; refuel = S4 */
  step: 'pick' | 'card' | 'refuel';
  target?: string;
  cardId?: string;
}

export interface GameState {
  v: 1;
  phase: 'setup' | 'characters' | 'trail' | 'turn' | 'end';
  setup: Setup;
  players: Player[];
  /** current player: the one whose turn it is (and, during "מי הבא?", the one who just played) */
  current: string;
  round: number;
  playedThisRound: string[];
  /** turns completed = where the group stands: 0 = at the doorstep, k = on stone k */
  turnsDone: number;
  trailStep: 'roll' | 'next';
  confirmingEnd: boolean;
  turn?: TurnState;
  /** per deck: the remaining card ids, in draw order */
  decks: Record<string, string[]>;
  /** doc 15 §3.2: sounds and music on (the S0 switch and the tiny speaker). Kept with the game; default on */
  sound: boolean;
}

export type Rng = () => number;

export const DEFAULT_SETUP: Setup = { reservist: 'none', sirens: false, rounds: 3 };

export function initialState(): GameState {
  return {
    v: 1,
    phase: 'setup',
    setup: { ...DEFAULT_SETUP },
    players: [],
    current: '',
    round: 1,
    playedThisRound: [],
    turnsDone: 0,
    trailStep: 'roll',
    confirmingEnd: false,
    decks: {},
    sound: true,
  };
}

export const conditionsOf = (s: GameState): Conditions => ({ reservist: s.setup.reservist, sirens: s.setup.sirens });
export const totalTurns = (s: GameState) => s.setup.rounds * s.players.length;
export const playerById = (s: GameState, id: string | undefined) => s.players.find((p) => p.id === id);

function shuffle<T>(a: T[], rng: Rng): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** The eligible card ids of a deck, after the S0 filter. */
export function eligibleIds(face: Face, c: Conditions): string[] {
  return deckCards(face).filter((card) => eligible(card, c)).map((card) => card.id);
}

/** Draw the next card of a deck. A card does not come back until the deck is used up; then the deck is reshuffled. */
export function draw(s: GameState, face: Face, rng: Rng, avoid?: string): { state: GameState; cardId: string } {
  const key = String(face);
  let queue = s.decks[key] ?? [];
  if (queue.length === 0) {
    queue = shuffle(eligibleIds(face, conditionsOf(s)), rng);
    // do not open a fresh deck with the card that was just on the table
    if (avoid && queue.length > 1 && queue[0] === avoid) queue.push(queue.shift()!);
  }
  const [cardId, ...rest] = queue;
  return { state: { ...s, decks: { ...s.decks, [key]: rest } }, cardId };
}

// ---------- S0 / S1 ----------

export function startCharacters(s: GameState, setup: Setup, sound = s.sound): GameState {
  return { ...s, setup, sound, phase: 'characters' };
}

export const setSound = (s: GameState, sound: boolean): GameState => ({ ...s, sound });

/** S1 "יוצאים לדרך": the first player added starts (handoff §9/15). */
export function startTrail(s: GameState, players: Player[]): GameState {
  return {
    ...s,
    players,
    phase: 'trail',
    current: players[0].id,
    round: 1,
    playedThisRound: [],
    turnsDone: 0,
    trailStep: 'roll',
    confirmingEnd: false,
    turn: undefined,
    decks: {},
  };
}

// ---------- the turn ----------

export function rollFace(rng: Rng): Face {
  return (Math.floor(rng() * 6) + 1) as Face;
}

/** "להטיל": the face is decided now. Faces 1–3 draw the card at once; 4–5 wait for "למי?" / "מי עונה?"; 6 is refuel. */
export function roll(s: GameState, rng: Rng, face: Face = rollFace(rng)): GameState {
  if (s.phase !== 'trail' || s.trailStep !== 'roll') return s;
  const base: GameState = { ...s, phase: 'turn', confirmingEnd: false };
  if (face === 6) return { ...base, turn: { face, step: 'refuel' } };
  if (face === 4 || face === 5) return { ...base, turn: { face, step: 'pick' } };
  const d = draw(base, face, rng);
  return { ...d.state, turn: { face, step: 'card', cardId: d.cardId } };
}

/** Faces 4–5: anyone but the roller can be chosen. */
export function pickTarget(s: GameState, targetId: string, rng: Rng): GameState {
  const t = s.turn;
  if (!t || t.step !== 'pick' || targetId === s.current || !playerById(s, targetId)) return s;
  const d = draw(s, t.face, rng);
  return { ...d.state, turn: { ...t, step: 'card', target: targetId, cardId: d.cardId } };
}

/** "קלף אחר": the next card of the same deck. */
export function otherCard(s: GameState, rng: Rng): GameState {
  const t = s.turn;
  if (!t || t.step !== 'card') return s;
  const d = draw(s, t.face, rng, t.cardId);
  return { ...d.state, turn: { ...t, cardId: d.cardId } };
}

/** "סיימתי" and "בוחר/ת לא לענות" do exactly the same thing (spec 3.4, 13.3). Also "לדלג" and "סיימתי" in S4. */
export function finishTurn(s: GameState): GameState {
  if (s.phase !== 'turn') return s;
  const turnsDone = s.turnsDone + 1;
  let played = s.playedThisRound.includes(s.current) ? s.playedThisRound : [...s.playedThisRound, s.current];
  let round = s.round;
  if (turnsDone >= totalTurns(s)) {
    return { ...s, turnsDone, playedThisRound: played, phase: 'end', turn: undefined, confirmingEnd: false };
  }
  // after the last player in the round, the round advances and everyone can be chosen again
  if (played.length >= s.players.length) {
    round += 1;
    played = [];
  }
  return { ...s, turnsDone, round, playedThisRound: played, phase: 'trail', trailStep: 'next', turn: undefined, confirmingEnd: false };
}

/** "מי הבא?": who can be chosen. Whoever already played in this round is dimmed until everyone has played. */
export function canBeNext(s: GameState, id: string): boolean {
  return !!playerById(s, id) && !s.playedThisRound.includes(id);
}

export function chooseNext(s: GameState, id: string): GameState {
  if (s.phase !== 'trail' || s.trailStep !== 'next' || !canBeNext(s, id)) return s;
  return { ...s, current: id, trailStep: 'roll', confirmingEnd: false };
}

// ---------- "סיום" ----------

export const askEnd = (s: GameState): GameState => (s.phase === 'trail' ? { ...s, confirmingEnd: true } : s);
export const cancelEnd = (s: GameState): GameState => ({ ...s, confirmingEnd: false });
/** "לסיים" in the confirmation: everyone walks to the campfire and the closing round starts. */
export const confirmEnd = (s: GameState): GameState => (s.phase === 'trail' ? { ...s, phase: 'end', confirmingEnd: false, turn: undefined } : s);

/** The open card of the current turn, if any. */
export function openCard(s: GameState) {
  return s.turn?.cardId ? cardById(s.turn.cardId) : undefined;
}
