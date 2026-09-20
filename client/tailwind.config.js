/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}', '../shared/**/*.js'],
  theme: {
    extend: {
      colors: {
        /**
         * Calm clinical teal. The ramp is deliberately darker than Tailwind's
         * stock teal so that `brand-600` clears WCAG AA (4.8:1) as text on
         * white — patients using this site skew older, and a 3:1 accent that
         * looks fine to a designer is genuinely hard for them to read.
         */
        brand: {
          50: '#f2fbf9',
          100: '#d8f3ee',
          200: '#b0e7de',
          300: '#7fd5c9',
          400: '#48bbae',
          500: '#279e92',
          600: '#0f8078', // 4.80:1 on white — AA for body text
          700: '#0d6660', // 6.80:1 on white — AA for everything
          800: '#0f524e',
          900: '#104441',
        },
        /**
         * WhatsApp green, darkened to clear WCAG AA.
         *
         * The official brand green (#25D366) gives white text 1.8:1, and even
         * a first correction to #128C4B only reached 4.3:1 — under the 4.5:1
         * floor. These two clear it at 5.5:1 and 6.9:1 while still reading
         * unmistakably as WhatsApp.
         */
        whatsapp: { DEFAULT: '#0f7a41', dark: '#0c6836' },

        /** Warm off-white section backgrounds — the "not clinical-cold" layer. */
        surface: {
          DEFAULT: '#faf8f4',
          100: '#f5f1ea',
          200: '#ece5d9',
          300: '#dfd4c2',
        },
        /** Soft healing green — confirmations and reassurance only. */
        care: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efb6',
          400: '#4ade8f',
          500: '#22c56e',
          600: '#16a357',
          700: '#158047',
          800: '#16653c',
          900: '#145334',
        },
      },
      fontFamily: {
        /**
         * Inter for Latin/Cyrillic, then the Noto faces so Devanagari and
         * Gurmukhi render in a matching weight rather than a system fallback.
         */
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
         * Warmer display face for headings. Fraunces covers Latin only, so
         * Hindi and Punjabi headings fall through to Noto — deliberate, not a
         * bug: a serif fallback for Devanagari would look far worse.
         */
        display: [
          'Fraunces',
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
        card: '0 1px 2px rgba(16, 40, 38, 0.04), 0 8px 24px rgba(16, 40, 38, 0.06)',
        lift: '0 2px 4px rgba(16, 40, 38, 0.05), 0 16px 40px rgba(16, 40, 38, 0.10)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
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
  plugins: [],
};
