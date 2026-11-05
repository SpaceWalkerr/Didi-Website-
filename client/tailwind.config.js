/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';
import { THEMES } from './src/design/tokens.js';

/**
 * Colours are CSS custom properties holding RGB channels ("15 128 120"), so a
 * single `data-theme="night"` on <html> re-themes every utility on the site,
 * including pages that were written before night mode existed. The values
 * live in src/design/tokens.js (one table per theme) and are checked for
 * contrast by scripts/check-contrast.mjs.
 */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const ramp = (name, steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) =>
  Object.fromEntries(steps.map((s) => [s, v(`${name}-${s}`)]));

const toVars = (table) =>
  Object.fromEntries(
    Object.entries(table).map(([key, hex]) => {
      const n = parseInt(hex.slice(1), 16);
      return [`--c-${key}`, `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`];
    }),
  );

export default {
  content: ['./index.html', './src/**/*.{js,jsx}', '../shared/**/*.js'],
  theme: {
    extend: {
      colors: {
        /** Calm clinical teal. brand-600 is the action colour in both themes. */
        brand: ramp('brand'),
        slate: ramp('slate'),
        care: ramp('care'),
        amber: ramp('amber'),
        red: ramp('red'),
        /** Warm surfaces — the "not clinical-cold" layer. */
        surface: { DEFAULT: v('surface'), 100: v('surface-100'), 200: v('surface-200'), 300: v('surface-300') },
        /** The one warm accent. Decoration first; text only via clay-700. */
        clay: { 100: v('clay-100'), 300: v('clay-300'), 500: v('clay-500'), 700: v('clay-700') },
        sand: { 100: v('sand-100'), 200: v('sand-200') },
        cream: v('cream'),
        paper: v('paper'),
        ink: v('ink'),
        /** Constant deep teal for bold panels; white text on it in both themes. */
        deep: { DEFAULT: '#0a5550', 700: '#0d5a55', 900: '#08302d' },
        /** Constant action teal: buttons keep white text in both themes. */
        action: { DEFAULT: '#0f8078', hover: '#0d6660' },
        /**
         * WhatsApp green, darkened to clear WCAG AA with white text (5.5:1 and
         * 6.9:1). The official #25D366 gives 1.8:1.
         */
        whatsapp: { DEFAULT: '#0f7a41', dark: '#0c6836' },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans Devanagari',
          'Noto Sans Gurmukhi',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        /**
         * Fraunces for Latin; Noto Serif for Devanagari and Gurmukhi so Hindi
         * and Punjabi headings keep a serif voice instead of dropping to sans.
         */
        display: [
          'Fraunces',
          'Noto Serif Devanagari',
          'Noto Serif Gurmukhi',
          'Noto Sans Devanagari',
          'Noto Sans Gurmukhi',
          'ui-serif',
          'Georgia',
          'serif',
        ],
      },
      fontSize: {
        // Body floor is 16px — never smaller for readable content.
        base: ['1rem', { lineHeight: '1.65' }],
        lg: ['1.0625rem', { lineHeight: '1.7' }],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--c-shadow) / 0.05), 0 10px 30px -12px rgb(var(--c-shadow) / 0.14)',
        lift: '0 2px 6px rgb(var(--c-shadow) / 0.06), 0 24px 60px -20px rgb(var(--c-shadow) / 0.28)',
        glow: '0 0 0 1px rgb(var(--c-brand-200) / 0.6), 0 18px 50px -18px rgb(var(--c-brand-500) / 0.55)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(.22,.61,.36,1)',
        breathe: 'cubic-bezier(.65,0,.35,1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...toVars(THEMES.light), colorScheme: 'light' },
        ':root[data-theme="night"]': { ...toVars(THEMES.night), colorScheme: 'dark' },
      });
    }),
  ],
};
