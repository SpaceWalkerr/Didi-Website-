/**
 * Checks the WCAG contrast of the colour pairs the site actually uses, in both
 * themes. Run: node scripts/check-contrast.mjs
 */
import { THEMES } from '../client/src/design/tokens.js';

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum]
const PAIRS = [
  ['slate-900', 'cream', 4.5], ['slate-700', 'cream', 4.5], ['slate-600', 'cream', 4.5],
  ['slate-500', 'cream', 4.5], ['slate-500', 'paper', 4.5], ['slate-600', 'surface', 4.5],
  ['slate-600', 'sand-100', 4.5], ['slate-500', 'slate-100', 4.5],
  ['brand-700', 'cream', 4.5], ['brand-700', 'paper', 4.5], ['brand-800', 'brand-50', 4.5],
  ['brand-700', 'brand-50', 4.5], ['brand-900', 'brand-100', 4.5], ['brand-600', 'paper', 3],
  ['clay-700', 'cream', 4.5], ['clay-700', 'paper', 4.5], ['clay-700', 'sand-100', 4.5], ['clay-500', 'cream', 3],
  ['amber-900', 'amber-50', 4.5], ['amber-800', 'amber-100', 4.5], ['red-900', 'red-50', 4.5], ['red-700', 'paper', 4.5],
  ['care-900', 'care-50', 4.5], ['care-800', 'care-100', 4.5], ['care-700', 'paper', 4.5],
  ['slate-400', 'paper', 3], ['slate-300', 'paper', 1.3],
];
const CONSTANT = [['#ffffff', '#0f8078', 4.5], ['#ffffff', '#0d6660', 4.5], ['#ffffff', '#0b4a46', 4.5], ['#ffffff', '#0f7a41', 4.5], ['#ffffff', '#16804a', 4.5]];

let bad = 0;
for (const [name, t] of Object.entries(THEMES)) {
  for (const [f, b, min] of PAIRS) {
    const r = ratio(t[f], t[b]);
    const ok = r >= min;
    if (!ok) bad++;
    console.log(`${ok ? '✓' : '✗'} ${name.padEnd(6)} ${f.padEnd(10)} on ${b.padEnd(9)} ${r.toFixed(2)} (min ${min})`);
  }
}
for (const [f, b, min] of CONSTANT) {
  const r = ratio(f, b);
  if (r < min) bad++;
  console.log(`${r >= min ? '✓' : '✗'} both   ${f} on ${b} ${r.toFixed(2)}`);
}
console.log(bad ? `\n${bad} pair(s) below the minimum.` : '\nAll pairs pass.');
process.exit(bad ? 1 : 0);
