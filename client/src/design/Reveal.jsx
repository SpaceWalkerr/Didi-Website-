import { m, useReducedMotion } from 'framer-motion';
import { fadeUp, inView, maybe, stagger } from '../site/motion.js';

/**
 * Fades and lifts its children into view once, on scroll.
 *
 * Purely decorative: with reduced motion, or with JavaScript animation
 * disabled, the content renders in its final position immediately. Nothing on
 * this site is revealed *only* by an animation.
 */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  className = '',
  ...rest
}) {
  const reduced = useReducedMotion();
  const Tag = m[as] || m.div;

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      variants={maybe(
        delay
          ? { ...fadeUp, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay } } }
          : fadeUp,
        reduced,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Parent that walks its `<Reveal>` children in one after another. Children use
 * `variants={fadeUp}` with no `whileInView` of their own — the parent drives.
 */
export function RevealGroup({ children, as = 'div', gap = 0.08, delay = 0, className = '', ...rest }) {
  const reduced = useReducedMotion();
  const Tag = m[as] || m.div;

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      variants={reduced ? { hidden: {}, show: {} } : stagger(gap, delay)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A single item inside a RevealGroup. */
export function RevealItem({ children, as = 'div', className = '', ...rest }) {
  const reduced = useReducedMotion();
  const Tag = m[as] || m.div;

  return (
    <Tag className={className} variants={maybe(fadeUp, reduced)} {...rest}>
      {children}
    </Tag>
  );
}
