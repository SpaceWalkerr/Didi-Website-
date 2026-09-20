import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/index.jsx';
import { DOCTOR } from '@shared/practice.config.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { StethoscopeIcon } from '../Icons.jsx';

/**
 * Sticky site header.
 *
 * The registration number sits in the header on every page, not just the
 * footer — the Telemedicine Practice Guidelines expect a patient to be able to
 * see who they are dealing with before they commit to anything.
 */
export default function Navbar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile menu on navigation, otherwise it stays open over the new page.
  useEffect(() => setOpen(false), [pathname]);

  // Lock background scrolling while the mobile sheet is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the sheet — expected of anything modal.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    ['/', t('nav.home')],
    ['/about', t('nav.about')],
    ['/services', t('nav.services')],
    ['/faq', t('nav.faq')],
    ['/contact', t('nav.contact')],
  ];

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
      isActive ? 'text-brand-800' : 'text-slate-600 hover:text-brand-800'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav aria-label={t('nav.aria')} className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <StethoscopeIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[16px] font-semibold leading-tight text-slate-900 sm:text-[17px]">
                {t('doctor.name')}
              </span>
              {/* Hidden on the narrowest phones, where it only ever rendered
                  as "MBBS · Reg. No. …". The registration still appears in the
                  hero, on the About page and in the footer of every page. */}
              <span className="hidden truncate text-xs text-slate-500 min-[400px]:block">
                {t('doctor.qualification')} · {t('common.regNo', { number: DOCTOR.registrationNumber })}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            <Link to="/book" className="btn-primary hidden sm:inline-flex">
              {t('common.bookShort')}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700
                         hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-600 lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" className="border-t border-slate-200 py-3 lg:hidden">
            <ul className="space-y-1">
              {links.map(([to, label]) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `block rounded-xl px-3 py-3 text-base font-medium ${
                        isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link to="/book" className="btn-primary mt-3 w-full">
              {t('common.book')}
            </Link>

            <div className="mt-2 border-t border-slate-200 pt-2">
              <LanguageSwitcher variant="mobile" />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
