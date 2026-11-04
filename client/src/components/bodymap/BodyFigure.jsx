import { useCallback, useRef, useState } from 'react';
import { DETAILS, SILHOUETTE, VIEWBOX, regionsForView } from './regions.js';

const CENTER = { x: VIEWBOX.width / 2, y: VIEWBOX.height / 2 };

/**
 * The tappable figure.
 *
 * Each region is a <g role="button"> (SVG cannot contain a real <button>), so
 * the role, tabIndex and Enter/Space handling are supplied by hand. Every
 * region is clipped twice — by the silhouette and by its own band — which is
 * also what the browser uses for hit-testing, so taps land exactly where the
 * body is drawn.
 *
 * Feedback uses opacity and transform only: a glow layer fades in on hover and
 * focus, a ripple spreads from the tap point, and choosing a region zooms the
 * whole figure toward it (one CSS transform on a group).
 */
export default function BodyFigure({ view, selectedId, onSelect, onHover, labelFor, figureLabel, zoom, reduced }) {
  const regions = regionsForView(view).filter((r) => r.onFigure !== false);
  const ordered = [...regions.filter((r) => r.layer !== 'top'), ...regions.filter((r) => r.layer === 'top')];
  const svgRef = useRef(null);
  const [ripples, setRipples] = useState([]);

  const ripple = useCallback(
    (event) => {
      if (reduced || !svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      // Into the zoomed group's coordinates, so the ripple sits under the finger.
      const group = svgRef.current.querySelector('.bm-figure');
      const ctm = group?.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      const id = Math.random().toString(36).slice(2);
      setRipples((list) => [...list.slice(-2), { id, x: p.x, y: p.y }]);
      setTimeout(() => setRipples((list) => list.filter((r) => r.id !== id)), 800);
    },
    [reduced],
  );

  const handleKey = (event, id) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onSelect(id);
    }
  };

  const transform = zoom
    ? `translate(${(CENTER.x - zoom.x * zoom.s).toFixed(1)}px, ${(CENTER.y - zoom.y * zoom.s).toFixed(1)}px) scale(${zoom.s})`
    : 'translate(0px, 0px) scale(1)';

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="bm-svg h-full w-full select-none overflow-hidden"
      role="group"
      aria-label={figureLabel}
    >
      <defs>
        <clipPath id={`bm-sil-${view}`}>
          <path d={SILHOUETTE} />
        </clipPath>
        {ordered.map((r) => (
          <clipPath key={r.id} id={`bm-r-${view}-${r.id}`}>
            <path d={r.d} />
          </clipPath>
        ))}
        <linearGradient id="bm-base" x1="0.2" x2="0.8" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--c-brand-100))" />
          <stop offset="0.55" stopColor="rgb(var(--c-brand-200))" />
          <stop offset="1" stopColor="rgb(var(--c-brand-100))" />
        </linearGradient>
        <radialGradient id="bm-glow" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="rgb(var(--c-brand-300))" />
          <stop offset="1" stopColor="rgb(var(--c-brand-400))" />
        </radialGradient>
        <linearGradient id="bm-selected" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#26988c" />
          <stop offset="1" stopColor="#0f8078" />
        </linearGradient>
      </defs>

      <g
        className="bm-figure"
        style={{
          transform,
          transformOrigin: '0 0',
          transition: reduced ? 'none' : 'transform 0.75s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        {/* Base silhouette (also fills the gaps between regions). */}
        <path d={SILHOUETTE} fill="url(#bm-base)" />

        {ordered.map((region) => {
          const selected = selectedId === region.id;
          const label = labelFor(region.id);
          return (
            <g
              key={region.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={label}
              className="bm-region"
              data-selected={selected ? 'true' : 'false'}
              clipPath={`url(#bm-sil-${view})`}
              onPointerDown={ripple}
              onClick={() => onSelect(region.id)}
              onKeyDown={(event) => handleKey(event, region.id)}
              onPointerEnter={() => onHover?.(region.id)}
              onPointerLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(region.id)}
              onBlur={() => onHover?.(null)}
            >
              <title>{label}</title>
              <g clipPath={`url(#bm-r-${view}-${region.id})`}>
                <rect width="240" height="540" fill="url(#bm-base)" />
                <rect className="bm-hi" width="240" height="540" fill="url(#bm-glow)" />
                <rect className="bm-sel" width="240" height="540" fill="url(#bm-selected)" />
                <path d={SILHOUETTE} className="bm-contour" fill="none" vectorEffect="non-scaling-stroke" />
              </g>
              {/* Inner edges between regions, as fine cream seams. */}
              <path d={region.d} className="bm-seam" fill="none" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}

        {/* Anatomical cues, above the fills but never catching a tap. */}
        <g className="pointer-events-none" fill="none" stroke="rgb(var(--c-brand-700))" strokeOpacity="0.28" strokeWidth="1.1" strokeLinecap="round" strokeDasharray={view === 'back' ? '0.5 5' : undefined}>
          {DETAILS[view].map((d) => (
            <path key={d} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        <path d={SILHOUETTE} fill="none" stroke="rgb(var(--c-brand-400))" strokeWidth="1.3" vectorEffect="non-scaling-stroke" className="pointer-events-none" />

        <g clipPath={`url(#bm-sil-${view})`} className="pointer-events-none">
          {ripples.map((r) => (
            <circle key={r.id} cx={r.x} cy={r.y} r="70" className="bm-ripple" />
          ))}
        </g>
      </g>
    </svg>
  );
}
