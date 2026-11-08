/**
 * Run after `npm run build`, by vercel.json's buildCommand — never by Render.
 *
 * The client build writes each page's own title and link-preview tags to
 * client/dist/.heads/<route>.html (see page-heads in client/vite.config.js).
 * WhatsApp and Facebook read the HTML without running JavaScript, so a shared
 * /about link must carry /about's tags, not the home page's.
 *
 * Render's Express server picks the right file per request. Vercel serves static
 * files straight from the CDN, so here the same files are copied up one level as
 * <route>.html; with `cleanUrls` in vercel.json, /about is then answered by
 * about.html directly. They are not copied on Render, where express.static would
 * serve them at a second URL.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
const heads = path.join(dist, '.heads');

const fail = (message) => {
  console.error(`vercel-pages: ${message}`);
  process.exit(1);
};

if (!fs.existsSync(heads)) fail('client/dist/.heads is missing — did `npm run build` run first?');

const pages = fs.readdirSync(heads).filter((f) => f.endsWith('.html'));
if (!pages.length) fail('client/dist/.heads has no pages in it.');

for (const file of pages) {
  const target = path.join(dist, file);
  // A real file already there would be silently replaced by a page-head variant.
  if (fs.existsSync(target)) fail(`client/dist/${file} already exists; refusing to overwrite it.`);
  fs.copyFileSync(path.join(heads, file), target);
}

// Unknown URLs get this (with a 404 status) instead of Vercel's bare error page.
if (!fs.existsSync(path.join(dist, '404.html'))) fail('client/dist/404.html is missing.');

console.log(`vercel-pages: ${pages.length} page(s) → ${pages.map((p) => p.slice(0, -5)).join(', ')}`);
