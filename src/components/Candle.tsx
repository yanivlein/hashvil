/**
 * S4: the candle of "כפתור 90 השניות" (motion/art/breath-candle.svg), 4/6 rhythm, two 10s cycles, then rest.
 * No ring, no count, no narrator. The screen switches `resting` on after 20s.
 */
export function Candle({ resting }: { resting: boolean }) {
  return (
    <div class={resting ? 'candle is-resting' : 'candle breathing'}>
      <div class={`plate${resting ? ' is-rest' : ''}`}>
        <span class="disc" />
        <span class="rm-disc" />
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="78" r="62" class="c-glow" />
          <rect x="76" y="131" width="48" height="64" rx="7" class="f-body-e" />
          <rect x="76" y="126" width="48" height="64" rx="7" class="f-body" />
          <path d="M100 126V116" class="c-wick" />
          <g class="c-flame">
            <path d="M100 30C124 60 130 86 119 107C113 118 87 118 81 107C70 86 76 60 100 30Z" class="f-flame" />
            <path d="M100 64C110 78 111 92 105 102C102 107 98 107 95 102C89 92 90 78 100 64Z" class="f-flame-in" />
          </g>
          <g transform="translate(150 52)">
            <path d="M0 0c8 -7 16 -7 24 0s16 7 24 0" class="c-air c-air1" />
          </g>
          <g transform="translate(150 80)">
            <path d="M0 0c8 -7 16 -7 24 0s16 7 24 0" class="c-air c-air2" />
          </g>
          <g transform="translate(150 108)">
            <path d="M0 0c8 -7 16 -7 24 0s16 7 24 0" class="c-air c-air3" />
          </g>
        </svg>
      </div>
    </div>
  );
}
