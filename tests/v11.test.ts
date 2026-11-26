/** Version 1.1 (doc 15): game length, the new texts, the sound files and engine, the water on the board. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { lengthOf, ROUNDS_OF, T } from '../src/content';
import * as E from '../src/engine';
import stream from '../src/data/stream-path.json';

const root = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf-8');

describe('S0: game length (doc 15 §1, criterion 1)', () => {
  it('short / medium / long = 2 / 3 / 4 rounds', () => {
    expect(ROUNDS_OF).toEqual({ short: 2, medium: 3, long: 4 });
    for (const l of ['short', 'medium', 'long'] as const) expect(lengthOf(ROUNDS_OF[l])).toBe(l);
  });
  it('"בינוני" is the default and gives 3 rounds; sound is on by default', () => {
    expect(lengthOf(E.DEFAULT_SETUP.rounds)).toBe('medium');
    expect(E.DEFAULT_SETUP.rounds).toBe(3);
    expect(E.initialState().sound).toBe(true);
  });
  it('the game has rounds × players turns for each length', () => {
    for (const l of ['short', 'medium', 'long'] as const) {
      let s = E.startCharacters(E.initialState(), { ...E.DEFAULT_SETUP, rounds: ROUNDS_OF[l] });
      s = E.startTrail(s, E.ANIMALS.slice(0, 4).map((a) => ({ id: a, animal: a, name: a, role: 'child' as const })));
      expect(E.totalTurns(s)).toBe(ROUNDS_OF[l] * 4);
    }
  });
  it('the sound choice of S0 goes into the game, and the tiny speaker changes it', () => {
    const s = E.startCharacters(E.initialState(), E.DEFAULT_SETUP, false);
    expect(s.sound).toBe(false);
    expect(E.setSound(s, true).sound).toBe(true);
  });
});

describe('the new texts, word for word (doc 15 §5)', () => {
  it('S0', () => {
    expect(T.setup.lengthQ).toBe('אורך המשחק');
    expect(T.setup.length).toEqual({ short: 'קצר', medium: 'בינוני', long: 'ארוך' });
    expect(T.setup.lengthHint).toBe('סבב = תור אחד לכל בן משפחה. קצר: 2 סבבים, כ-10 דקות. בינוני: 3, כ-15. ארוך: 4, כ-20.');
    expect(T.setup.cardsHint).toBe('שתי השאלות קובעות אילו קלפים ייכנסו לחפיסה.');
    expect(T.setup.soundQ).toBe('צליל');
    expect(T.setup.sound).toEqual({ on: 'דלוק', off: 'כבוי' });
  });
  it('the screen-reader names of the tiny buttons', () => {
    expect([T.app.fullscreen, T.app.fullscreenExit, T.app.mute, T.app.unmute]).toEqual(['מסך מלא', 'יציאה ממסך מלא', 'השתקה', 'ביטול השתקה']);
  });
  it('"כמה סבבים?" is out of the interface', () => {
    expect(JSON.stringify(T)).not.toContain('כמה סבבים');
  });
  it('the credit line has real names and no square bracket (criterion 7)', () => {
    const line = T.app.credit.join(' · ');
    expect(line).toBe('איורים: יניב ליין · צלילים: Kenney, jakubp.jp, LloydEvans09, kyles (CC0) · מנגינה: Jadis0x, BonnyOrbit (CC0)');
    expect(line).not.toMatch(/[[\]]/);
    expect(line).not.toContain('שמות');
  });
});

describe('the sound files (doc 15 §3.3, criterion 7)', () => {
  const dir = new URL('public/audio/', root);
  const files = readdirSync(dir);
  const credits = read('CREDITS.md');

  it('every file the engine plays exists, is an MP3, and is in CREDITS.md', async () => {
    const { SOUND_FILES } = await import('../src/sound');
    for (const f of Object.values(SOUND_FILES)) {
      expect(files).toContain(f);
      expect(f).toMatch(/\.mp3$/);
      expect(credits).toContain(`\`${f}\``);
    }
    // and nothing in the folder that is not credited
    for (const f of files) expect(credits).toContain(`\`${f}\``);
  });
  it('CC0 only: every source in CREDITS.md is CC0, and every credited name is in the S0 line', () => {
    const rows = credits.split('\n').filter((l) => l.startsWith('| `'));
    expect(rows.length).toBe(files.length);
    for (const r of rows) expect(r).toContain('CC0 1.0');
    for (const name of ['Kenney', 'jakubp.jp', 'LloydEvans09', 'kyles', 'Jadis0x', 'BonnyOrbit']) {
      expect(credits).toContain(name);
      expect(T.app.credit.join(' ')).toContain(name);
    }
  });
  it('the budget: at most 1.5MB without the melody', () => {
    const total = files.filter((f) => f !== 'melody.mp3').reduce((n, f) => n + statSync(new URL(f, dir)).size, 0);
    expect(total).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  });
  it('the service worker precaches the sound files (offline, criterion 9)', () => {
    expect(read('vite.config.ts')).toMatch(/globPatterns:\s*\['\*\*\/\*\.\{[^}]*mp3[^}]*\}'\]/);
  });
});

describe('the water on the board (doc 15 §4, criterion 8)', () => {
  // distances in board widths (the board is 3:2), along the centre line of the stream
  const P = stream.points.map((p) => ({ x: p.x, y: p.y / 1.5 }));
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
  /** where along the stream a point lies (its projection on the nearest segment) */
  function along(x: number, y: number): number {
    let best = { d: Infinity, s: 0 };
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / L2));
      const d = Math.hypot(a.x + t * dx - x, a.y + t * dy - y);
      if (d < best.d) best = { d, s: cum[i - 1] + t * Math.sqrt(L2) };
    }
    return best.s;
  }
  const css = read('src/styles/ambient.css');
  const lines = [...css.matchAll(/@keyframes (water-w\d) \{([\s\S]*?)\n\}/g)];

  it('eight water lines, each along the stream', () => {
    expect(lines.length).toBe(8);
  });
  it('nothing is drawn between points 7 and 10 (the bridge) or before point 3', () => {
    const [p3, p7, p10] = [cum[2], cum[6], cum[9]];
    const eps = 0.002;
    for (const [, name, body] of lines) {
      const keys = [...body.matchAll(/([\d.]+)% \{ transform: translate\(([\d.]+)cqw, ([\d.]+)cqw\)/g)].map((m) => ({
        at: +m[1],
        s: along(+m[2] / 100, +m[3] / 100),
      }));
      expect(keys.length, name).toBeGreaterThan(6);
      for (const k of keys) {
        expect(k.s, `${name} ${k.at}%`).toBeGreaterThanOrEqual(p3 - eps);
        expect(k.s > p7 + eps && k.s < p10 - eps, `${name} ${k.at}% under the bridge`).toBe(false);
      }
      // within one run (no jump), the line never crosses the bridge
      for (let i = 1; i < keys.length; i++) {
        if (keys[i].at - keys[i - 1].at < 0.05) continue; // the switch to the second run, while transparent
        const lo = Math.min(keys[i].s, keys[i - 1].s), hi = Math.max(keys[i].s, keys[i - 1].s);
        expect(lo < p7 + eps && hi > p10 - eps, `${name} crosses the bridge`).toBe(false);
      }
    }
  });
  it('the small motion is off with prefers-reduced-motion', () => {
    const rm = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(rm).toMatch(/\.ambient, \.flame, \.sparks \{ display: none; \}/);
    expect(rm).toMatch(/\.piece\.bob, \.halo-pulse \{ animation: none; \}/);
  });
});

// ---------- the sound engine, against a stand-in AudioContext ----------

const live = new Set<FakeSource>();
class FakeParam {
  value = 1;
  cancelScheduledValues() {}
  setValueAtTime(v: number) { this.value = v; }
  linearRampToValueAtTime(v: number) { this.value = v; }
}
class FakeGain { gain = new FakeParam(); connect() {} disconnect() {} }
class FakeSource {
  buffer: { duration: number } | null = null;
  loop = false;
  onended: (() => void) | null = null;
  connect() {}
  start() {
    if (!this.buffer || this.buffer.duration === 0) return;
    live.add(this);
    if (!this.loop) setTimeout(() => { live.delete(this); this.onended?.(); }, this.buffer.duration * 1000);
  }
  stop() { live.delete(this); this.onended?.(); }
}
class FakeContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createGain() { return new FakeGain(); }
  createBufferSource() { return new FakeSource(); }
  createBuffer() { return { duration: 0 }; }
  decodeAudioData(_d: ArrayBuffer, ok: (b: { duration: number }) => void) { ok({ duration: 0.4 }); }
  resume() { return Promise.resolve(); }
}

describe('the sound engine (doc 15 §3)', () => {
  let S: typeof import('../src/sound');
  beforeAll(async () => {
    const w = globalThis as unknown as Record<string, unknown>;
    w.window = Object.assign(globalThis, { AudioContext: FakeContext, addEventListener: () => {} });
    w.fetch = async () => ({ arrayBuffer: async () => new ArrayBuffer(8) });
    S = await import('../src/sound');
    S.unlock();
    await S.loaded();
  });
  afterEach(() => vi.useRealTimers());

  it('the melody plays; mute silences sounds and music at once, and a muted short sound is not even started', () => {
    S.music(true, 0);
    expect(S.soundState().melody).toBe(true);
    S.setMuted(true);
    expect(S.soundState().masterGain).toBe(0);
    const before = live.size;
    S.play('dice');
    expect(live.size).toBe(before);
    S.setMuted(false);
    expect(S.soundState().masterGain).toBe(1);
  });
  it('from the stop of the die: the melody fades out (500) and stops; the rustle ends before the flip does; then nothing plays', () => {
    vi.useFakeTimers();
    S.music(true, 0);
    S.play('dice');
    S.music(false, 500); // the die stops
    vi.advanceTimersByTime(250);
    S.play('paper'); // the card rises (300) and turns (400)
    vi.advanceTimersByTime(700); // the flip is over
    expect(S.soundState().melody).toBe(false);
    expect(S.soundState().playing).toBe(0);
    expect(live.size).toBe(0);
    vi.advanceTimersByTime(4000);
    expect(live.size).toBe(0);
  });
  it('the card closes: the melody comes back; S5 adds the fire, "לסיים" stops both', () => {
    S.music(true, 800);
    expect(S.soundState().melody).toBe(true);
    S.fire(true);
    expect(S.soundState().fire).toBe(true);
    vi.useFakeTimers();
    S.music(false, 400);
    S.fire(false);
    vi.advanceTimersByTime(1000);
    expect(S.soundState().melody).toBe(false);
    expect(S.soundState().fire).toBe(false);
    expect(live.size).toBe(0);
  });
});
