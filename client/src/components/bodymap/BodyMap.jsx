import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import BodyFigure from './BodyFigure.jsx';
import RegionPanel from './RegionPanel.jsx';
import { getRegion, regionsForView } from './regions.js';

const VIEWS = ['front', 'back'];

/**
 * Interactive body map.
 *
 * Three ways to reach the same content, none of them a fallback for the others:
 *   · tap a region on the figure          (the obvious way on a phone)
 *   · tab to a region and press Enter     (the figure is keyboard-operable)
 *   · press one of the chips below it     (real buttons, comfortable targets,
 *                                          and the whole list is readable at a
 *                                          glance without hunting on a diagram)
 *
 * Switching front/back keeps the selection when that region exists in both
 * views (head, arms, skin) and clears it otherwise, so the panel never
 * describes an area the visitor can no longer see.
 */
export default function BodyMap() {
  const { t } = useI18n();
  const [view, setView] = useState('front');
  const [selectedId, setSelectedId] = useState(null);
  const [topic, setTopic] = useState(null);

  const labelFor = useCallback((id) => t(`bodyMap.regions.${id}.label`), [t]);

  const chips = useMemo(() => regionsForView(view), [view]);
  const selected = getRegion(selectedId);

  const select = useCallback((id) => {
    setSelectedId((current) => {
      // Tapping the selected region again clears it.
      const next = current === id ? null : id;
      setTopic(null);
      return next;
    });
  }, []);

  const switchView = useCallback((next) => {
    setView(next);
    setSelectedId((current) => {
      if (!current) return null;
      const region = getRegion(current);
      return region && region.views.includes(next) ? current : null;
    });
    setTopic(null);
  }, []);

  return (
    <div className="mt-10">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        {/* ── Figure column ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-brand-50/70 to-white p-5 sm:p-7">
          {/* Front / back toggle */}
          <div
            role="radiogroup"
            aria-label={t('bodyMap.viewLabel')}
            className="mx-auto flex w-full max-w-[260px] rounded-xl bg-white p-1 ring-1 ring-slate-200"
          >
            {VIEWS.map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => switchView(v)}
                  className={`min-h-[2.5rem] flex-1 rounded-lg px-4 py-2 text-[15px] font-semibold
                              transition-colors focus-visible:ring-2 focus-visible:ring-brand-600
                              focus-visible:ring-offset-2 ${
                                active
                                  ? 'bg-brand-600 text-white'
                                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'
                              }`}
                >
                  {t(`bodyMap.view.${v}`)}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <BodyFigure
              view={view}
              selectedId={selectedId}
              onSelect={select}
              labelFor={labelFor}
              figureLabel={t('bodyMap.figureLabel', { view: t(`bodyMap.view.${view}`) })}
            />
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">{t('bodyMap.hint')}</p>

          {/* The same regions as ordinary buttons. Not a fallback — on a phone
              this is usually the faster way to pick, and it is the only way to
              reach "skin", which has no single place on the diagram. */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-sm font-semibold text-slate-700">{t('bodyMap.chipsTitle')}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {chips.map((region) => {
                const active = selectedId === region.id;
                return (
                  <li key={region.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => select(region.id)}
                      className={`min-h-[2.5rem] rounded-full border px-3.5 py-2 text-[15px]
                                  transition-colors focus-visible:ring-2 focus-visible:ring-brand-600
                                  focus-visible:ring-offset-2 ${
                                    active
                                      ? 'border-brand-600 bg-brand-600 text-white'
                                      : 'border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                                  }`}
                    >
                      {labelFor(region.id)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ── Detail column ───────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24">
          <RegionPanel region={selected} selectedTopic={topic} onSelectTopic={setTopic} />
        </div>
      </div>

      {/* Announces the change to screen readers, which would otherwise get no
          notice that a panel elsewhere on the page has been replaced. */}
      <p aria-live="polite" className="sr-only">
        {selected ? t('bodyMap.announce', { area: labelFor(selected.id) }) : ''}
      </p>
    </div>
  );
}
