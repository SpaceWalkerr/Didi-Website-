/**
 * A fine heartbeat trace that draws itself once across the hero: three beats
 * of falling amplitude that settle into a calm resting line, ending in a soft
 * clay pulse. A nod to a racing heart becoming calm.
 *
 * The draw is one SVG stroke-dashoffset animation that runs once (the only
 * non-transform animation on the page, by design). The end pulse loops on
 * transform + opacity and pauses when the hero is off-screen.
 */

const BASE = 74;

/** One P-QRS-T complex starting at x, scaled by amplitude a. */
const beat = (x, a) =>
  [
    `L${x} ${BASE}`,
    `C${x + 8} ${BASE} ${x + 10} ${BASE - 7 * a} ${x + 16} ${BASE - 7 * a}`,
    `C${x + 22} ${BASE - 7 * a} ${x + 24} ${BASE} ${x + 30} ${BASE}`,
    `L${x + 40} ${BASE}`,
    `L${x + 46} ${BASE + 9 * a}`,
    `L${x + 56} ${BASE - 60 * a}`,
    `L${x + 66} ${BASE + 22 * a}`,
    `L${x + 72} ${BASE}`,
    `L${x + 86} ${BASE}`,
    `C${x + 96} ${BASE} ${x + 100} ${BASE - 13 * a} ${x + 112} ${BASE - 13 * a}`,
    `C${x + 124} ${BASE - 13 * a} ${x + 128} ${BASE} ${x + 138} ${BASE}`,
  ].join(' ');

const PATH = [`M0 ${BASE}`, beat(150, 1), beat(400, 0.62), beat(640, 0.3), `L1200 ${BASE}`].join(' ');

export default function EcgLine({ className = '' }) {
  return (
    <div className={`pointer-events-none relative ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1200 110" preserveAspectRatio="none" className="h-[4.5rem] w-full overflow-visible sm:h-24">
        <defs>
          <linearGradient id="ecg-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="rgb(var(--c-brand-500))" stopOpacity="0" />
            <stop offset="0.08" stopColor="rgb(var(--c-brand-500))" stopOpacity="0.9" />
            <stop offset="0.7" stopColor="rgb(var(--c-brand-500))" stopOpacity="0.85" />
            <stop offset="1" stopColor="rgb(var(--c-clay-500))" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Soft under-glow, then the fine trace on top. */}
        <path
          d={PATH}
          pathLength="1"
          fill="none"
          stroke="rgb(var(--c-brand-300))"
          strokeOpacity="0.35"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="ecg-draw"
        />
        <path
          d={PATH}
          pathLength="1"
          fill="none"
          stroke="url(#ecg-fade)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="ecg-draw"
        />
      </svg>
      {/* Resting pulse at the end of the line. */}
      <span className="absolute right-0 top-[67%] -translate-y-1/2 translate-x-1/2">
        <span className="ecg-dot relative block h-2.5 w-2.5 rounded-full bg-clay-500">
          <span className="ecg-ring absolute inset-0 rounded-full bg-clay-500" />
        </span>
      </span>
    </div>
  );
}
