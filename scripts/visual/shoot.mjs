/**
 * Screenshots for design review.
 *
 *   node scripts/visual/shoot.mjs --base http://localhost:5173 --out docs/screens/after \
 *        --routes /,/book --widths 375,1440 [--lang hi] [--theme night] [--text xl] [--full] [--wait 3500]
 *
 * Also reports horizontal overflow and console errors for every page it opens.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]]] : acc), []),
);
const base = args.base || 'http://localhost:5173';
const out = args.out || 'docs/screens/after';
const routes = String(args.routes || '/').split(',');
const widths = String(args.widths || '375,1440').split(',').map(Number);
const wait = Number(args.wait || 3200);
const suffix = [args.lang, args.theme, args.text].filter(Boolean).join('-');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const problems = [];
for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w < 800 ? 800 : 900 },
    deviceScaleFactor: w < 800 ? 2 : 1,
    reducedMotion: args.reduced ? 'reduce' : 'no-preference',
  });
  await ctx.addInitScript(({ lang, theme, text }) => {
    try {
      if (lang) localStorage.setItem('clinic-language', lang);
      localStorage.setItem('clinic-comfort', JSON.stringify({ theme: theme || 'light', text: text || 'normal' }));
    } catch {}
  }, { lang: args.lang, theme: args.theme, text: args.text });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`console ${w} ${page.url()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror ${w} ${page.url()}: ${e.message}`));
  for (const r of routes) {
    await page.goto(base + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait);
    const name = `${(r === '/' ? 'home' : r.slice(1).replace(/[/?=&]/g, '_'))}-${w}${suffix ? '-' + suffix : ''}`;
    await page.screenshot({ path: `${out}/${name}.png` });
    if (args.full) {
      // Scroll-driven reveals render as "not yet entered" in a stitched capture.
      await page.addStyleTag({ content: '.reveal{animation:none!important;opacity:1!important}' });
      // Scroll through so scroll-triggered sections reveal before the full capture.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
    }
    const overflow = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('[data-allow-overflow]');
      }).slice(0, 4).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
      return { scroll: document.documentElement.scrollWidth > vw, wide };
    });
    if (overflow.scroll) problems.push(`OVERFLOW ${w} ${r} ${suffix}: ${overflow.wide.join(' | ')}`);
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'no overflow, no console errors');
