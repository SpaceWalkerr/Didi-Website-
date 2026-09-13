/**
 * Verifies every language file has exactly the same keys as en.js.
 *
 *   node scripts/check-translations.mjs
 *
 * Missing keys fall back to English at runtime rather than breaking, but a
 * missing key still means a patient sees English on an otherwise translated
 * page — so this should stay at zero. Run it after editing any translation.
 */
const LANGS = ['hi', 'pa', 'bho', 'bgc', 'ru'];

const load = async (code) => (await import(`../client/src/i18n/${code}.js`)).default;

const paths = (node, prefix = '') =>
  Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value) ? paths(value, path) : [path];
  });

const en = await load('en');
const expected = new Set(paths(en));
let failed = false;

for (const code of LANGS) {
  const dict = await load(code);
  const actual = new Set(paths(dict));
  const missing = [...expected].filter((k) => !actual.has(k));
  const extra = [...actual].filter((k) => !expected.has(k));

  // Arrays must match in length too — a short list silently drops content.
  const shortLists = [...expected].filter((path) => {
    const a = path.split('.').reduce((n, k) => n?.[k], en);
    const b = path.split('.').reduce((n, k) => n?.[k], dict);
    return Array.isArray(a) && Array.isArray(b) && a.length !== b.length;
  });

  const ok = !missing.length && !extra.length && !shortLists.length;
  failed = failed || !ok;

  console.log(`${ok ? '✓' : '✗'} ${code.padEnd(4)} ${actual.size} keys`);
  if (missing.length) console.log(`    missing: ${missing.join(', ')}`);
  if (extra.length) console.log(`    unknown: ${extra.join(', ')}`);
  if (shortLists.length) console.log(`    list length differs: ${shortLists.join(', ')}`);
}

console.log(failed ? '\nTranslations are out of sync.' : '\nAll translations are in sync.');
process.exit(failed ? 1 : 0);
