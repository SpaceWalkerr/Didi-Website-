import { useEffect, useRef } from 'react';
import { hasFinePointer, usePrefersReducedMotion } from '../lib/hooks.js';

/**
 * Lets a primary call-to-action lean a few pixels toward the cursor.
 *
 * Mouse and trackpad only — on touch there is no hover to respond to — and off
 * under reduced motion. The transform is on a wrapper, so the button keeps its
 * own press feedback (scale on :active).
 */
export default function Magnetic({ children, strength = 0.22, className = '' }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !hasFinePointer()) return undefined;
    let frame = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.style.transform = '';
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(frame);
    };
  }, [reduced, strength]);

  return (
    <span ref={ref} className={`inline-flex transition-transform duration-500 ease-calm ${className}`}>
      {children}
    </span>
  );
}
