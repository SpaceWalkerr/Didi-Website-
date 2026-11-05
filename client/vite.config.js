import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildPracticeSchema } from '../shared/schema.js';
import { BRAND } from '../shared/practice.config.js';
import en from './src/i18n/en.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..');

/**
 * Writes the schema.org JSON-LD into index.html at build (and dev) time, from
 * the same config the server reads. `<` is escaped so the JSON can never close
 * the script element early.
 */
const practiceSchema = () => ({
  name: 'practice-schema',
  transformIndexHtml(html) {
    const json = JSON.stringify(buildPracticeSchema()).replace(/</g, '\\u003c');
    return html.replace('</head>', `    <script type="application/ld+json">${json}</script>\n  </head>`);
  },
});

/**
 * Per-page heads for link previews.
 *
 * WhatsApp, Facebook and most chat apps read the HTML without running
 * JavaScript, so every shared link used to preview as the home page. After the
 * build this writes dist/.heads/<route>.html: the same app shell with that
 * page's English title, description, Open Graph, canonical and robots tags.
 * The server sends it for that route instead of index.html; the app itself is
 * unchanged. The folder starts with a dot so express.static never serves it
 * at a second URL.
 */
const PAGE_HEADS = {
  about: ['about.eyebrow', 'doctor.shortBio'],
  services: ['services.title', 'services.description'],
  faq: ['faq.title', 'faq.lede'],
  contact: ['contact.title', 'contact.description'],
  privacy: ['legal.privacy.title', 'legal.privacy.lede'],
  terms: ['legal.terms.title', 'legal.terms.lede'],
  refund: ['legal.refund.title', 'legal.refund.lede'],
  book: ['booking.title', 'booking.description', { noIndex: true }],
  account: ['account.title', 'account.signInBody', { noIndex: true }],
};

const lookup = (key) => {
  const value = key.split('.').reduce((node, part) => node?.[part], en);
  if (typeof value !== 'string') throw new Error(`page heads: missing English string ${key}`);
  const text = value.replace(/\{(doctor|name)\}/g, en.doctor.name);
  if (/[{}]/.test(text)) throw new Error(`page heads: unfilled placeholder in ${key}`);
  return text;
};
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pageHeads = () => ({
  name: 'page-heads',
  apply: 'build',
  closeBundle() {
    const dist = path.join(here, 'dist');
    const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    const outDir = path.join(dist, '.heads');
    fs.mkdirSync(outDir, { recursive: true });
    for (const [route, [titleKey, descKey, opts = {}]] of Object.entries(PAGE_HEADS)) {
      const title = escapeHtml(`${lookup(titleKey)} — ${en.doctor.name}`);
      const desc = escapeHtml(lookup(descKey));
      const url = `${BRAND.siteUrl}/${route}`;
      const setMeta = (html, attr, key, value) => {
        const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
        if (!re.test(html)) throw new Error(`page heads: index.html has no ${key} tag`);
        return html.replace(re, `$1${value}$2`);
      };
      let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
      html = setMeta(html, 'name', 'description', desc);
      html = setMeta(html, 'property', 'og:title', title);
      html = setMeta(html, 'property', 'og:description', desc);
      html = setMeta(html, 'property', 'og:url', url);
      html = setMeta(html, 'name', 'twitter:title', title);
      html = setMeta(html, 'name', 'twitter:description', desc);
      html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
      if (opts.noIndex) html = html.replace('</head>', '  <meta name="robots" content="noindex, nofollow" />\n  </head>');
      fs.writeFileSync(path.join(outDir, `${route}.html`), html);
    }
  },
});

export default defineConfig({
  plugins: [react(), practiceSchema(), pageHeads()],
  resolve: {
    // Practice facts live outside client/ because the server imports the same
    // module — one file to edit, and the server stays authoritative on fees.
    alias: { '@shared': path.join(repoRoot, 'shared') },
  },
  server: {
    port: 5173,
    // Keeps API calls same-origin in development, so no CORS surprises.
    proxy: { '/api': 'http://localhost:4000' },
    fs: { allow: [repoRoot] },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * React and the router go in one long-lived chunk — they change with
         * upgrades, not with content, so they stay cached across deploys.
         * Framer Motion is deliberately not listed: LazyMotion + `m` lets
         * Rollup tree-shake it to the features actually imported.
         */
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
