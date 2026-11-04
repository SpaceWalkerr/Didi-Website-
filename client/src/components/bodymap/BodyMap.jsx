import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { usePrefersReducedMotion } from '../../lib/hooks.js';
import BodyFigure from './BodyFigure.jsx';
import RegionPanel from './RegionPanel.jsx';
import { getRegion, regionsForView } from './regions.js';
import { ZoomOutIcon } from '../Icons.jsx';

const VIEWS = ['front', 'back'];

/**
 * Signature moment 2 — the body map.
 *
 * Three ways to reach the same content, none of them a fallback:
 *   · tap a region on the figure   (zooms toward it, result card slides up)
 *   · Tab to a region, press Enter (every region is a labelled button)
 *   · press a chip in the list     (real buttons; the only way to reach "skin")
 *
 * Switching front/back keeps the selection when that region exists in both
 * views and clears it otherwise, so the card never describes an area the
 * visitor can no longer see.
 */
export default function BodyMap() {
  const { t } = useI18n();
  const reduced = usePrefersReducedMotion();
  const [view, setView] = useState('front');
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [topic, setTopic] = useState(null);
  const panelRef = useRef(null);
  const pendingScroll = useRef(false);

  const labelFor = useCallback((id) => t(`bodyMap.regions.${id}.label`), [t]);
  const chips = useMemo(() => regionsForView(view), [view]);
  const selected = getRegion(selectedId);

  const select = useCallback((id) => {
    setSelectedId((current) => (current === id ? null : id));
    setTopic(null);
    pendingScroll.current = true;
  }, []);

  // On a phone the card sits under the figure: bring it just into view.
  useEffect(() => {
    if (!selectedId || !pendingScroll.current) return undefined;
    pendingScroll.current = false;
    if (window.matchMedia('(min-width: 1024px)').matches) return undefined;
    const id = setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }, 380);
    return () => clearTimeout(id);
  }, [selectedId, reduced]);

  const switchView = useCallback((next) => {
    setView(next);
    setSelectedId((current) => {
      if (!current) return null;
      const region = getRegion(current);
      return region && region.views.includes(next) ? current : null;
    });
    setTopic(null);
  }, []);

  const zoom = selected?.zoom && selected.views.includes(view) ? selected.zoom : null;
  const caption = hoverId || selectedId;

  return (
    <div className="mt-12 sm:mt-14">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-12 lg:gap-y-6">
        {/* ── Figure ───────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-4xl border border-slate-200/80 bg-paper p-4 shadow-card sm:p-6 lg:row-span-2 lg:sticky lg:top-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_45%,rgb(var(--c-brand-50)),transparent)]" aria-hidden="true" />

          <div className="relative flex items-center justify-between gap-3">
            <div role="radiogroup" aria-label={t('bodyMap.viewLabel')} className="flex rounded-full bg-slate-100 p-1">
              {VIEWS.map((v) => {
                const active = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => switchView(v)}
                    className={`min-h-[2.75rem] rounded-full px-5 text-[0.9375rem] font-semibold transition-[background-color,color,box-shadow] duration-300
                                focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                                  active ? 'bg-paper text-ink shadow-card' : 'text-slate-600 hover:text-ink'
                                }`}
                  >
                    {t(`bodyMap.view.${v}`)}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className={`btn-ghost !min-h-[2.75rem] !px-3 text-sm transition-opacity duration-300 ${
                zoom ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              tabIndex={zoom ? 0 : -1}
              aria-hidden={!zoom}
            >
              <ZoomOutIcon />
              <span className="hidden min-[400px]:inline">{t('bodyMapPlus.zoomOut')}</span>
            </button>
          </div>

          <div className="relative mx-auto mt-3 aspect-[240/540] h-[min(58vh,28rem)] max-w-full sm:h-[32rem]">
            <div key={view} className="h-full w-full" style={{ animation: reduced ? undefined : 'fade .45s ease-out both' }}>
              <BodyFigure
                view={view}
                selectedId={selectedId}
                onSelect={select}
                onHover={setHoverId}
                labelFor={labelFor}
                figureLabel={t('bodyMap.figureLabel', { view: t(`bodyMap.view.${view}`) })}
                zoom={zoom}
                reduced={reduced}
              />
            </div>
          </div>

          {/* Live caption: names the area under the finger or cursor. */}
          <p className="relative mt-2 min-h-[1.75rem] text-center font-display text-lg text-ink" aria-hidden="true">
            {caption ? labelFor(caption) : <span className="font-sans text-sm text-slate-500">{t('bodyMap.hint')}</span>}
          </p>

        </div>

        {/* ── Chip list: under the figure on phones, under the card on desktop ── */}
        <div className="order-3 rounded-4xl border border-slate-200/80 bg-paper p-5 sm:p-6 lg:order-none lg:col-start-2 lg:row-start-2">
          <p className="text-sm font-semibold text-slate-700">{t('bodyMap.chipsTitle')}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {chips.map((region) => (
              <li key={region.id}>
                <button type="button" aria-pressed={selectedId === region.id} onClick={() => select(region.id)} className="chip">
                  {labelFor(region.id)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Result card ──────────────────────────────────────────────── */}
        <div ref={panelRef} className="order-2 scroll-mt-24 lg:order-none lg:col-start-2 lg:row-start-1">
          <RegionPanel region={selected} selectedTopic={topic} onSelectTopic={setTopic} />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {selected ? t('bodyMap.announce', { area: labelFor(selected.id) }) : ''}
      </p>
    </div>
  );
}
