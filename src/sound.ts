/**
 * The sound engine (doc 15 §3). Sound around actions; no sound while people talk.
 * One AudioContext, opened by the press on "התחלה" (the gesture that unlocks audio on iPhone); after a refresh in the
 * middle of a game, by the next press anywhere. Short sounds are buffers; the melody and the campfire crackle are loops
 * with their own gain, for the fades. Mute = the master gain to 0 at once (the read-aloud is speechSynthesis, not here).
 * All files are CC0 (CREDITS.md), under public/audio/, precached by the service worker: no network after the first load.
 */

export type Fx = 'dice' | 'paper' | 'wood' | 'pop';
type LoopName = 'melody' | 'fire';

/** doc 15 §3.2: volumes */
export const VOLUME: Record<Fx | LoopName, number> = { dice: 0.5, paper: 0.4, wood: 0.4, pop: 0.4, fire: 0.25, melody: 0.2 };
const FILES: Record<Fx | LoopName, string> = {
  dice: 'dice.mp3',
  paper: 'paper.mp3',
  wood: 'wood.mp3',
  pop: 'pop.mp3',
  fire: 'fire.mp3',
  melody: 'melody.mp3',
};
export const soundUrl = (name: Fx | LoopName) => `${import.meta.env.BASE_URL}audio/${FILES[name]}`;

interface Loop {
  name: LoopName;
  want: boolean;
  fadeMs: number;
  gain?: GainNode;
  src?: AudioBufferSourceNode;
  startedAt: number; // ctx time at which offset 0 of the buffer would have played
  offset: number; // where to resume (the melody continues where it stopped)
  stopTimer?: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let loading: Promise<void> | null = null;
const buffers: Partial<Record<Fx | LoopName, AudioBuffer>> = {};
/** every source that is playing right now (short sounds and loops). The automated check of criterion 4 reads its size */
const playing = new Set<AudioBufferSourceNode>();
const loops: Record<LoopName, Loop> = {
  melody: { name: 'melody', want: false, fadeMs: 800, startedAt: 0, offset: 0 },
  fire: { name: 'fire', want: false, fadeMs: 1000, startedAt: 0, offset: 0 },
};

const AC = (): typeof AudioContext | undefined =>
  typeof window === 'undefined' ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

function load(): Promise<void> {
  if (loading || !ctx) return loading ?? Promise.resolve();
  const c = ctx;
  // the short sounds first: after a refresh, the first press both opens the audio and rolls the die
  const order: Array<Fx | LoopName> = ['dice', 'paper', 'wood', 'pop', 'melody', 'fire'];
  loading = Promise.all(
    order.map(async (name) => {
      try {
        const res = await fetch(soundUrl(name));
        const data = await res.arrayBuffer();
        buffers[name] = await new Promise<AudioBuffer>((ok, bad) => c.decodeAudioData(data, ok, bad));
        if (waiting && waiting.name === name) {
          const w = waiting;
          waiting = null;
          if (performance.now() - w.at < 400) play(name);
        }
        if (name === 'melody' || name === 'fire') applyLoop(loops[name]);
      } catch {
        /* a missing sound is silence, never an error on screen */
      }
    }),
  ).then(() => {
    applyLoop(loops.melody);
    applyLoop(loops.fire);
  });
  return loading;
}

/** Open (or wake) the audio. Must run inside a user gesture. Creates nothing until the game has started. */
export function unlock(): void {
  const Ctor = AC();
  if (!Ctor) return;
  try {
    if (!ctx) {
      ctx = new Ctor({ latencyHint: 'interactive' });
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      // iPhone: a silent one-sample buffer played inside the gesture finishes the unlock
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
    }
    if (ctx.state !== 'running') void ctx.resume().then(() => {
      applyLoop(loops.melody);
      applyLoop(loops.fire);
    });
    void load();
  } catch {
    /* no audio on this device: the game works the same */
  }
}

/** Past S0 (the game has started): any press may open the audio. On S0 nothing is created before "התחלה". */
let armed = false;
export const arm = (on: boolean) => {
  armed = on;
};

// after a refresh mid-game there was no "התחלה": the next press anywhere opens the audio
if (typeof window !== 'undefined') {
  const wake = () => {
    if (armed || ctx) unlock();
  };
  window.addEventListener('pointerdown', wake, { capture: true, passive: true });
  window.addEventListener('keydown', wake, { capture: true, passive: true });
}

const running = () => !!ctx && ctx.state === 'running' && !!master;

/** A short sound asked for while its file was still being decoded (the first press after a refresh). */
let waiting: { name: Fx; at: number } | null = null;

/**
 * One short sound. Skipped when muted. If the audio is opening right now (the same press), it waits up to 400ms for
 * its file, then gives up: a late sound is worse than none.
 */
export function play(name: Fx): void {
  if (muted || !ctx || !master) return;
  const buf = buffers[name];
  if (!buf || ctx.state !== 'running') {
    if (loading || ctx.state !== 'running') waiting = { name, at: performance.now() };
    if (buf && ctx.state !== 'running') void ctx.resume().then(() => {
      if (waiting?.name === name && performance.now() - waiting.at < 400) {
        waiting = null;
        play(name);
      }
    });
    return;
  }
  const c = ctx!;
  const g = c.createGain();
  g.gain.value = VOLUME[name];
  g.connect(master!);
  const s = c.createBufferSource();
  s.buffer = buf;
  s.connect(g);
  playing.add(s);
  s.onended = () => {
    playing.delete(s);
    g.disconnect();
  };
  s.start();
}

function ramp(g: GainNode, to: number, ms: number) {
  const t = ctx!.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  if (ms <= 0) g.gain.setValueAtTime(to, t);
  else g.gain.linearRampToValueAtTime(to, t + ms / 1000);
}

function applyLoop(l: Loop) {
  if (!running()) return;
  const buf = buffers[l.name];
  if (!buf) return;
  const c = ctx!;
  if (l.want) {
    window.clearTimeout(l.stopTimer);
    l.stopTimer = undefined;
    if (!l.src) {
      l.gain = c.createGain();
      l.gain.gain.value = 0;
      l.gain.connect(master!);
      const s = c.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.connect(l.gain);
      const off = l.offset % buf.duration;
      s.start(0, off);
      l.startedAt = c.currentTime - off;
      l.src = s;
      playing.add(s);
      s.onended = () => playing.delete(s);
    }
    ramp(l.gain!, VOLUME[l.name], l.fadeMs);
  } else if (l.src && l.stopTimer === undefined) {
    ramp(l.gain!, 0, l.fadeMs);
    const s = l.src;
    const g = l.gain!;
    const stop = () => {
      l.offset = (c.currentTime - l.startedAt) % buf.duration;
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
      playing.delete(s);
      g.disconnect();
      if (l.src === s) l.src = undefined;
      l.stopTimer = undefined;
    };
    if (l.fadeMs <= 0) stop();
    else l.stopTimer = window.setTimeout(stop, l.fadeMs + 30);
  }
}

function setLoop(name: LoopName, want: boolean, fadeMs: number) {
  const l = loops[name];
  if (l.want === want && !want && (!l.src || l.stopTimer !== undefined)) return; // already off or fading out
  l.want = want;
  l.fadeMs = fadeMs;
  applyLoop(l);
}

/** The melody: on in S1, S2 (with "מי הבא?"), S4 and S5; off from the moment the die stops until the card closes. */
export const music = (on: boolean, fadeMs = on ? 800 : 500) => setLoop('melody', on, fadeMs);
/** The campfire crackle: a quiet loop for as long as S5 is open. */
export const fire = (on: boolean, fadeMs = on ? 1000 : 400) => setLoop('fire', on, fadeMs);

/** Mute everything (sounds and music) at once. Not the read-aloud. */
export function setMuted(m: boolean): void {
  muted = m;
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(m ? 0 : 1, t);
}

/** For the automated checks only: what is playing right now. */
export const soundState = () => ({
  context: ctx?.state ?? 'none',
  playing: playing.size,
  muted,
  masterGain: master?.gain.value ?? null,
  melody: !!loops.melody.src,
  fire: !!loops.fire.src,
});
if (typeof window !== 'undefined') (window as unknown as { __hashvilSound?: () => unknown }).__hashvilSound = soundState;
/** For tests: resolves when the sound files have been decoded. */
export const loaded = (): Promise<void> => loading ?? Promise.resolve();
export const SOUND_FILES = FILES;
