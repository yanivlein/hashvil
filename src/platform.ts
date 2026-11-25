import { initialState, type GameState } from './engine';

// ---------- sessionStorage only: survives an accidental refresh; "לסיים" wipes it ----------
const KEY = 'hashvil.game.v1';

export function loadState(): GameState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as GameState;
      if (s && s.v === 1 && s.setup) return s;
    }
  } catch {
    /* fall through */
  }
  return initialState();
}

export function saveState(s: GameState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quiet */
  }
}

export function wipeState(): void {
  try {
    sessionStorage.clear();
  } catch {
    /* quiet */
  }
}

// ---------- motion ----------
export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The one vibration in the site: 30ms when the die stops. */
export function buzz(): void {
  try {
    navigator.vibrate?.(30);
  } catch {
    /* quiet */
  }
}

// ---------- read aloud: Hebrew SpeechSynthesis, only on the speaker button ----------
export function hebrewVoice(): SpeechSynthesisVoice | null {
  try {
    if (!('speechSynthesis' in window)) return null;
    const voices = speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('he')) ??
      voices.find((v) => v.lang.toLowerCase().startsWith('iw')) ??
      null
    );
  } catch {
    return null;
  }
}

// warm the voice list at start-up: some browsers load voices only after the first getVoices() call
try {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.getVoices();
} catch {
  /* quiet */
}

export function onVoicesChanged(cb: () => void): () => void {
  try {
    if (!('speechSynthesis' in window)) return () => {};
    speechSynthesis.addEventListener('voiceschanged', cb);
    return () => speechSynthesis.removeEventListener('voiceschanged', cb);
  } catch {
    return () => {};
  }
}

export function speak(text: string, onEnd: () => void): void {
  try {
    const he = hebrewVoice();
    if (!he) return onEnd();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.95;
    u.voice = he;
    u.onend = onEnd;
    u.onerror = onEnd;
    speechSynthesis.speak(u);
  } catch {
    onEnd();
  }
}

export function stopSpeaking(): void {
  try {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  } catch {
    /* quiet */
  }
}

export const asset = (p: string) => `${import.meta.env.BASE_URL}assets/${p}`;
