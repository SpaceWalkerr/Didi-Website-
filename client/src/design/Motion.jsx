import { LazyMotion, domAnimation } from 'framer-motion';

/**
 * Wraps the app once, at the root.
 *
 * LazyMotion + the `m` component (rather than `motion`) is what keeps Framer
 * off the critical path: `m` ships the minimal renderer and `domAnimation`
 * loads the DOM feature set, roughly halving what the full `motion` import
 * costs. Every animated component in this app imports `m`, never `motion` —
 * mixing them silently pulls the whole bundle back in.
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
