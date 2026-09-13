/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Calm clinical blue — primary actions, links, headings.
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc6fb',
          400: '#36a9f6',
          500: '#0d8de4',
          600: '#0270c2',
          700: '#02599d',
          800: '#064c81',
          900: '#0b406b',
        },
        // Soft healing green — confirmations, reassurance, accents.
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
        // Inter first for Latin/Cyrillic, then the Noto faces so Devanagari and
        // Gurmukhi text renders in a matching weight instead of a system fallback.
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
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 40, 64, 0.04), 0 8px 24px rgba(16, 40, 64, 0.06)',
      },
    },
  },
  plugins: [],
};
