import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** React Router keeps the scroll position between routes; patients expect a reset. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  // Block body on purpose: a concise arrow would return scrollTo's value, and
  // React would try to call it as the effect's cleanup function.
  useEffect(() => {
    // 'instant' overrides the global `scroll-behavior: smooth`, which is meant
    // for in-page anchors — a smooth scroll here animates through the new page
    // and can be interrupted mid-way, leaving the patient part-scrolled.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
