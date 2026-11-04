import { forwardRef } from 'react';
import { Link as RRLink, NavLink as RRNavLink } from 'react-router-dom';

/**
 * Router links with view transitions switched on.
 *
 * React Router wraps the navigation in document.startViewTransition() where
 * the browser supports it (Chrome / Android WebView, Safari 18+). Elsewhere
 * the route simply changes and <main> plays a short CSS fade instead. The CSS
 * for both lives in index.css, and both are disabled under reduced motion.
 */
export const Link = forwardRef(function Link(props, ref) {
  return <RRLink ref={ref} viewTransition {...props} />;
});

export const NavLink = forwardRef(function NavLink(props, ref) {
  return <RRNavLink ref={ref} viewTransition {...props} />;
});
