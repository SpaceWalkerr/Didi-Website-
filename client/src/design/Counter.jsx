import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Counts up to `value` the first time it scrolls into view.
 *
 * Accessibility: the animating digits are hidden from assistive technology and
 * the finished value is exposed once, as a label. Without that, a screen
 * reader announces every intermediate number — genuinely unusable. With
 * reduced motion the final value is painted immediately and never animates.
 */
export default function Counter({
  value,
  prefix = '',
  suffix = '',
  duration = 1100,
  className = '',
}) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!seen) return undefined;
    if (reduced) {
      setShown(value);
      return undefined;
    }

    let frame;
    const start = performance.now();
    // easeOutCubic — fast first, settling gently, so the last digits are readable.
    const ease = (t) => 1 - (1 - t) ** 3;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setShown(Math.round(ease(progress) * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, value, duration, reduced]);

  const label = `${prefix}${value}${suffix}`;

  return (
    <span ref={ref} className={className} aria-label={label} role="text">
      <span aria-hidden="true">
        {prefix}
        {shown}
        {suffix}
      </span>
    </span>
  );
}
