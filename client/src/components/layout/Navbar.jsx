import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link, NavLink } from '../../lib/router.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { DOCTOR } from '@shared/practice.config.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import ComfortControls from './ComfortControls.jsx';
import { BrandMark } from '../Icons.jsx';

/**
 * Sticky site header.
 *
 * The registration number sits in the header on every page — the
 * Telemedicine Practice Guidelines expect a patient to see who they are
 * dealing with before they commit to anything. The reading-comfort control is
 * here too, on every page, because the people who need it most are the least
 * likely to go looking for it.
 */
export default function Navbar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  // A hairline appears once the page moves under the header. Passive + rAF.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const links = [
    ['/', t('nav.home')],
    ['/about', t('nav.about')],
    ['/services', t('nav.services')],
    ['/faq', t('nav.faq')],
    ['/contact', t('nav.contact')],
    ['/account', t('nav.account')],
  ];

  const linkClass = ({ isActive }) =>
    `relative rounded-full px-3 py-2 text-[0.9375rem] font-medium transition-colors duration-200 ${
      isActive ? 'text-ink after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:bg-clay-500' : 'text-slate-600 hover:text-ink'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || open
          ? 'border-b border-slate-200/70 bg-cream/90 backdrop-blur-md supports-[backdrop-filter]:bg-cream/75'
          : 'border-b border-transparent bg-cream'
      }`}
      style={{ viewTransitionName: 'site-header' }}
    >
      <nav aria-label={t('nav.aria')} className="container-page">
        <div className="flex h-[var(--header-height)] items-center justify-between gap-3">
          <Link to="/" className="group flex min-w-0 items-center gap-2.5 rounded-xl">
            <BrandMark className="h-9 w-9 shrink-0 transition-transform duration-500 ease-calm group-hover:rotate-[-8deg]" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[1.0625rem] font-semibold leading-tight text-ink">
                {t('doctor.name')}
              </span>
              <span className="hidden truncate text-xs text-slate-500 min-[400px]:block">
                {t('doctor.qualification')} · {t('common.regNo', { number: DOCTOR.registrationNumber })}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ComfortControls />
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            <Link to="/book" className="btn-primary ml-1 hidden !min-h-[2.75rem] !px-5 sm:inline-flex">
              {t('common.bookShort')}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700
                         hover:bg-slate-100 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-600 lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h11" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div
            id="mobile-menu"
            className="max-h-[calc(100dvh-var(--header-height))] overflow-y-auto border-t border-slate-200/70 pb-6 pt-3 lg:hidden"
            style={{ animation: 'fade .2s ease-out both' }}
          >
            <ul className="space-y-0.5">
              {links.map(([to, label]) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-2xl px-4 py-3 font-display text-xl ${
                        isActive ? 'bg-brand-50 text-brand-800' : 'text-ink hover:bg-slate-100'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link to="/book" className="btn-primary btn-lg mt-4 w-full">
              {t('common.book')}
            </Link>

            <div className="mt-5 border-t border-slate-200/70 pt-4">
              <LanguageSwitcher variant="mobile" />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
