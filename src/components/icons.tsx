import type { Face } from '../content';

/** The six face icons, from design/trail/icons/face-*.svg (grid 48, stroke 2.5, currentColor, no fill). */
const FACE_PATHS: Record<Face, preact.JSX.Element> = {
  1: <path d="M24 40.5C10.5 31 5.5 24 5.5 17.2C5.5 11.8 9.8 7.5 15 7.5C18.8 7.5 22.1 9.6 24 13C25.9 9.6 29.2 7.5 33 7.5C38.2 7.5 42.5 11.8 42.5 17.2C42.5 24 37.5 31 24 40.5Z" />,
  2: (
    <>
      <circle cx="24" cy="9.5" r="5.5" />
      <path d="M40.5 43.5V33.5A11.5 11.5 0 0 0 29 22H19A11.5 11.5 0 0 0 7.5 33.5V38.2L23.6 31.7A5 5 0 1 1 26.2 38L12.6 43.5" />
      <path d="M24.6 30.1L22.4 26.6" />
    </>
  ),
  3: (
    <>
      <circle cx="24" cy="17" r="12.5" />
      <path d="M24 43.5V19" />
      <path d="M24 28l5-5" />
      <path d="M24 23.5l-4.5-4.5" />
      <path d="M14 43.5h20" />
    </>
  ),
  4: (
    <>
      <path d="M19.6 9.6A4.4 4.4 0 0 1 28.4 9.6L26.9 27.6A2.9 2.9 0 0 1 21.1 27.6Z" />
      <circle cx="24" cy="38.9" r="3" />
    </>
  ),
  5: (
    <>
      <path d="M13.3 15.8A10.7 10.7 0 1 1 32.2 22.68C30.74 24.42 26.9 24.48 26.9 26.6V28.6A2.9 2.9 0 0 1 21.1 28.6V26.6C21.1 23.1225.36 21.81 27.76 18.95A4.9 4.9 0 1 0 19.1 15.8A2.9 2.9 0 0 1 13.3 15.8Z" />
      <circle cx="24" cy="38.9" r="3" />
    </>
  ),
  6: (
    <>
      <path d="M24 5.5C30 12 33 16.8 33 21.8a9 9 0 0 1-18 0C15 18.3 16.8 15.6 19.5 13c.6 2.6 1.7 4 3.2 4.8C22 13.2 22.5 9.2 24 5.5Z" />
      <path d="M10.5 42.5L37.5 35.5" />
      <path d="M10.5 35.5L37.5 42.5" />
    </>
  ),
};

export function FaceIcon({ face }: { face: Face }) {
  return (
    <svg viewBox="0 0 48 48" class="i48" aria-hidden="true">
      {FACE_PATHS[face]}
    </svg>
  );
}

export function SpeakerIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" class="ic" aria-hidden="true">
      <path d="M4 9.5h3l4.5-3.5v12L7 14.5H4z" />
      <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" class="ic" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/** design/trail/icons/ui-fullscreen-enter.svg / ui-fullscreen-exit.svg (grid 24, stroke 2.2) */
export function FullscreenIcon({ exit }: { exit?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" class="ic" aria-hidden="true">
      {exit ? (
        <>
          <path d="M9.5 4v3.5a2 2 0 0 1-2 2H4" />
          <path d="M20 9.5h-3.5a2 2 0 0 1-2-2V4" />
          <path d="M14.5 20v-3.5a2 2 0 0 1 2-2H20" />
          <path d="M4 14.5h3.5a2 2 0 0 1 2 2V20" />
        </>
      ) : (
        <>
          <path d="M4 9.5V6a2 2 0 0 1 2-2h3.5" />
          <path d="M14.5 4H18a2 2 0 0 1 2 2v3.5" />
          <path d="M20 14.5V18a2 2 0 0 1-2 2h-3.5" />
          <path d="M9.5 20H6a2 2 0 0 1-2-2v-3.5" />
        </>
      )}
    </svg>
  );
}

/**
 * The tiny mute button (Yaniv's decision on handoff question 8): a music note, so it is not confused with the
 * read-aloud speaker on the card. Same family as the ui icons (grid 24, stroke 2.2, no fill). Muted = a line across it,
 * with a paper-coloured gap under the line so the strike reads at 20px.
 */
export function MusicIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" class="ic" aria-hidden="true">
      <circle cx="7" cy="17.5" r="2.5" />
      <circle cx="17" cy="15.5" r="2.5" />
      <path d="M9.5 17.5V6.5L19.5 4.5V15.5" />
      {off && (
        <>
          <path class="ic-gap" d="M4 4L20 20" />
          <path d="M4 4L20 20" />
        </>
      )}
    </svg>
  );
}
