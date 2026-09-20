import { MIRROR_TRANSFORM, VIEWBOX, regionsForView } from './regions.js';

/** Renders one region's geometry. Shapes are plain SVG primitives. */
function Shape({ shape, ...rest }) {
  if (!shape) return null;
  if (shape.type === 'ellipse') return <ellipse {...shape} {...rest} />;
  if (shape.type === 'rect') return <rect {...shape} {...rest} />;
  return <path d={shape.d} {...rest} />;
}

/**
 * The tappable human figure.
 *
 * Each region is a <g role="button">. SVG elements cannot contain a real
 * <button>, so the role, tabIndex and key handling are supplied by hand —
 * and the same regions are ALSO rendered as ordinary HTML buttons in the
 * chip list beside the figure. That pairing is deliberate: the diagram is
 * the pleasant way in, the chips are the reliable way in, and neither is a
 * second-class path to the same content.
 */
export default function BodyFigure({ view, selectedId, onSelect, labelFor, figureLabel }) {
  const regions = regionsForView(view).filter((r) => r.onFigure !== false);

  const handleKey = (event, id) => {
    // Enter and Space are what a real <button> responds to; match it exactly.
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="h-auto w-full max-w-[260px] select-none"
      role="group"
      aria-label={figureLabel}
    >
      {regions.map((region) => {
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
            onClick={() => onSelect(region.id)}
            onKeyDown={(event) => handleKey(event, region.id)}
          >
            {/* A tooltip for pointer users; the aria-label covers everyone else. */}
            <title>{label}</title>
            <Shape shape={region.shape} />
            {region.mirror && <Shape shape={region.shape} transform={MIRROR_TRANSFORM} />}
          </g>
        );
      })}
    </svg>
  );
}
