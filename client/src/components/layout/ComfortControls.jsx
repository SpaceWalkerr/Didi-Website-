import { useEffect, useId, useRef, useState } from 'react';
import { useComfort } from '../../lib/comfort.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { MoonIcon, PhoneAutoIcon, SunIcon, TextSizeIcon } from '../Icons.jsx';

const SIZES = ['normal', 'large', 'xl'];
const THEMES = [
  ['auto', PhoneAutoIcon],
  ['light', SunIcon],
  ['night', MoonIcon],
];

/** Segmented radio group — real radios, so arrow keys and screen readers work. */
function Segmented({ legend, name, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{legend}</legend>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
        {options.map(({ value: v, label, icon: Icon, preview }) => (
          <label
            key={v}
            className={`relative flex min-h-[2.75rem] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 text-center text-[0.8125rem] font-medium leading-tight transition-[background-color,color,box-shadow] duration-200
                        focus-within:ring-2 focus-within:ring-brand-600 ${
                          value === v ? 'bg-paper text-ink shadow-card' : 'text-slate-600 hover:text-ink'
                        }`}
          >
            <input
              type="radio"
              name={name}
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              className="sr-only"
            />
            {Icon && <Icon className="h-4 w-4" />}
            {preview && (
              <span aria-hidden="true" className={`font-display leading-none ${preview}`}>
                Aa
              </span>
            )}
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * "Aa" — reading comfort. Text size (100 / 112.5 / 125%) and night mode, in
 * the header on every page, because the patients who need them most are the
 * least likely to hunt through a settings page.
 */
export default function ComfortControls({ inline = false }) {
  const { t } = useI18n();
  const comfort = useComfort();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const panel = (
    <div className="space-y-4">
      <Segmented
        legend={t('comfort.textSize')}
        name={`text-size-${panelId}`}
        value={comfort.text}
        onChange={(text) => comfort.update({ text })}
        options={SIZES.map((v, i) => ({
          value: v,
          label: t(`comfort.sizes.${v}`),
          preview: ['text-base', 'text-lg', 'text-xl'][i],
        }))}
      />
      <Segmented
        legend={t('comfort.appearance')}
        name={`theme-${panelId}`}
        value={comfort.theme}
        onChange={(theme) => comfort.update({ theme })}
        options={THEMES.map(([v, icon]) => ({ value: v, label: t(`comfort.themes.${v}`), icon }))}
      />
      <p className="text-xs text-slate-500">{t('comfort.note')}</p>
    </div>
  );

  if (inline) return panel;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('comfort.button')}
        title={t('comfort.button')}
        className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition-[background-color,transform] duration-200
                   hover:bg-slate-100 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <TextSizeIcon className="h-[1.35rem] w-[1.35rem]" />
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('comfort.title')}
          className="absolute right-0 top-full z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] origin-top-right rounded-3xl border border-slate-200 bg-paper p-4 shadow-lift"
          style={{ animation: 'fade .18s ease-out both' }}
        >
          {panel}
        </div>
      )}
    </div>
  );
}
