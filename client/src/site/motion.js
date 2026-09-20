/**
 * Shared Framer Motion variants.
 *
 * Every component that animates pairs these with `useReducedMotion()` and
 * swaps in `still` when the visitor has asked their OS for reduced motion.
 * Animation here is decorative without exception — nothing appears, moves or
 * becomes readable only because an animation ran, so switching it all off
 * leaves a complete, static page.
 */

/** Used in place of any variant when motion is reduced: renders the final state. */
export const still = {
  hidden: { opacity: 1, y: 0, x: 0, scale: 1 },
  show: { opacity: 1, y: 0, x: 0, scale: 1, transition: { duration: 0 } },
};

const EASE = [0.22, 0.61, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE } },
};

/** Parent wrapper that walks its children in, one shortly after the next. */
export const stagger = (gap = 0.08, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Viewport config shared by scroll-triggered sections. */
export const inView = { once: true, amount: 0.2, margin: '0px 0px -80px 0px' };

/** Picks the real variant, or the inert one when motion is reduced. */
export const maybe = (variant, reduced) => (reduced ? still : variant);
