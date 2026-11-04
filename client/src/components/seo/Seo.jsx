import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BRAND } from '@shared/practice.config.js';
import { useI18n } from '../../i18n/index.jsx';

/**
 * Per-page title, description and canonical URL.
 *
 * React 18 has no built-in document metadata support, and react-helmet is a
 * dependency this site does not otherwise need, so this writes the tags
 * directly. Every page mounts one; the effect cleans up nothing because the
 * next page immediately overwrites the same tags.
 *
 * A crawler has to execute JavaScript to see these, which is true of the whole
 * site — it is a SPA with no server rendering. Google does execute it. If
 * search traffic ever matters more than it does for a practice found mainly by
 * word of mouth and WhatsApp, pre-rendering these routes is the upgrade.
 */
const OG_LOCALE = { en: 'en_IN', hi: 'hi_IN', pa: 'pa_IN', ru: 'ru_RU' };

const setMeta = (selector, attr, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (key) el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

export default function Seo({ title, description, noIndex = false }) {
  const { pathname } = useLocation();
  const { t, language } = useI18n();

  const brand = t('doctor.name');
  const full = title ? `${title} — ${brand}` : `${brand} — ${t('doctor.specialty')}`;
  const desc = description || t('doctor.tagline');

  useEffect(() => {
    document.title = full;
    setMeta('meta[name="description"]', 'content', desc);

    // Open Graph, so a link forwarded on WhatsApp shows the right page.
    setMeta('meta[property="og:title"]', 'content', full);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', `${BRAND.siteUrl}${pathname}`);
    // Open Graph wants language_TERRITORY ("en_IN"), not a bare "en".
    setMeta('meta[property="og:locale"]', 'content', OG_LOCALE[language] || 'en_IN');
    setMeta('meta[name="twitter:title"]', 'content', full);
    setMeta('meta[name="twitter:description"]', 'content', desc);

    // Canonical: the language is a client-side preference, not a separate URL,
    // so every translation of a page points at the same canonical address.
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', `${BRAND.siteUrl}${pathname}`);

    // Booking, confirmation and admin are private or transactional — keeping
    // them out of the index also keeps a patient's booking page out of search.
    setMeta('meta[name="robots"]', 'content', noIndex ? 'noindex, nofollow' : 'index, follow');
  }, [full, desc, pathname, language, noIndex]);

  return null;
}
