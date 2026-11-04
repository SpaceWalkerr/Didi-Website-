import { useEffect, useRef, useState } from 'react';

/** True when the visitor has asked the OS for reduced motion. Live-updating. */
export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(query).matches,
  );
  useEffect(() => {
    const q = window.matchMedia?.(query);
    if (!q) return undefined;
    const on = (e) => setReduced(e.matches);
    q.addEventListener?.('change', on);
    return () => q.removeEventListener?.('change', on);
  }, []);
  return Boolean(reduced);
}

/**
 * Pauses CSS animation inside an element while it is off-screen, so ambient
 * loops (breathing, drifting light) cost nothing when nobody can see them.
 */
export function usePauseOffscreen() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle('paused', !entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Runs `fn` once the browser is idle (or after a short delay where unsupported). */
export function onIdle(fn, timeout = 2500) {
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 1200);
  return () => clearTimeout(id);
}

/** Fine pointer (mouse/trackpad) — magnetic effects are off for touch. */
export const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
