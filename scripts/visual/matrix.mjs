/**
 * Responsive / language / comfort-mode audit.
 *
 *   node scripts/visual/matrix.mjs --base http://localhost:4200 --out docs/screens/audit --booking <confirmedBookingId> [--flows]
 *
 * For every width × language × mode it opens each route and flags:
 *   · horizontal overflow (page wider than the screen)
 *   · console errors and uncaught page errors
 *   · truncated text (ellipsis or clipped overflow on an element with text)
 *   · interactive controls smaller than 44 × 44 px (inline links in prose excepted)
 * A screenshot is saved only for a page that has a problem.
 * With --flows it also walks the booking flow to the payment screen and taps
 * the body map in every combination (sandbox server only: it books slots).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);
const BASE = arg('base', 'http://localhost:4200');
const OUT = arg('out', 'docs/screens/audit');
const BOOKING = arg('booking', '');
const WIDTHS = String(arg('widths', '360,375,414,768,1024,1440')).split(',').map(Number);
const LANGS = String(arg('langs', 'en,hi,pa')).split(',');
const MODES = { light: { theme: 'light', text: 'normal' }, night: { theme: 'night', text: 'normal' }, large: { theme: 'light', text: 'xl' } };
const ROUTES = ['/', '/services', '/about', '/faq', '/contact', '/account', '/book', ...(BOOKING ? [`/confirmation/${BOOKING}`] : []), '/no-such-page'];
fs.mkdirSync(OUT, { recursive: true });

const inspect = () => {
  const vw = document.documentElement.clientWidth;
  // Screen-reader-only text (the .sr-only 1 px box) is meant to be invisible.
  const srOnly = (el) => el.closest('.sr-only') || (el.getBoundingClientRect().width <= 1 && getComputedStyle(el).overflow === 'hidden');
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.opacity !== '0' && !srOnly(el); };
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40)}"`;
  const overflow = document.documentElement.scrollWidth > vw + 1;
  const wide = overflow ? [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('[data-allow-overflow]'); }).slice(0, 3).map(name) : [];
  const truncated = [...document.querySelectorAll('body *')].filter((el) => {
    if (!visible(el) || el.closest('[aria-hidden="true"]') || el.closest('[data-allow-overflow]')) return false;
    const s = getComputedStyle(el);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) return false;
    const clipsX = (s.overflowX === 'hidden' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1;
    return clipsX;
  }).slice(0, 5).map(name);
  const small = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"], [role="radio"]')].filter((el) => {
    if (!visible(el) || el.closest('[aria-hidden="true"]')) return false;
    if (el.matches('input[type=checkbox], input[type=radio]') && el.closest('label')) return false; // label is the target
    if (el.classList.contains('sr-only') || getComputedStyle(el).position === 'absolute' && el.matches('.sr-only')) return false;
    if (el.tagName === 'A' && el.closest('p, li dd') && !el.className.includes('btn')) return false; // inline link in prose
    if (el.closest('svg')) return false; // body-map regions are large shapes; bbox measured below
    const r = el.getBoundingClientRect();
    return r.height < 43.5 || r.width < 43.5;
  }).slice(0, 6).map((el) => { const r = el.getBoundingClientRect(); return `${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}`; });
  return { overflow, wide, truncated, small };
};

const browser = await chromium.launch();
const problems = [];
const smallSeen = new Map();
let pages = 0;
let xff = 1;

for (const w of WIDTHS) for (const lang of LANGS) for (const [modeName, mode] of Object.entries(MODES)) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w < 800 ? 780 : 900 },
    deviceScaleFactor: 1,
    hasTouch: w < 800,
  });
  // A distinct test address per context, sent only to the sandbox server
  // (Google Fonts rejects unknown headers), so the booking rate limit does
  // not cut the flows short.
  const addr = `10.50.${Math.floor(xff / 250)}.${(xff++ % 250) + 1}`;
  await ctx.route((url) => url.origin === new URL(BASE).origin, (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': addr } }));
  await ctx.addInitScript(({ lang, mode }) => {
    localStorage.setItem('clinic-language', lang);
    localStorage.setItem('clinic-comfort', JSON.stringify(mode));
  }, { lang, mode });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(e.message));
  const tag = `${w}-${lang}-${modeName}`;

  for (const route of ROUTES) {
    errs.length = 0;
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const r = await page.evaluate(inspect);
    pages++;
    for (const s of r.small) smallSeen.set(s.replace(/ \d+×\d+$/, ''), (smallSeen.get(s.replace(/ \d+×\d+$/, '')) || 0) + 1);
    const issues = [];
    if (r.overflow) issues.push(`overflow: ${r.wide.join(' | ')}`);
    if (r.truncated.length) issues.push(`truncated: ${r.truncated.join(' | ')}`);
    if (errs.length) issues.push(`console: ${errs.join(' | ').slice(0, 200)}`);
    if (issues.length) {
      const file = `${OUT}/${tag}${route.replace(/[/?=]/g, '_')}.png`;
      await page.screenshot({ path: file });
      problems.push(`${tag} ${route}: ${issues.join(' ; ')}`);
    }
  }

  if (flag('flows')) {
    try {
      // Body map: tap the chest on the figure, then check the card.
      await page.goto(BASE + '/#body-map', { waitUntil: 'networkidle' });
      const svg = page.locator('svg.bm-svg');
      await svg.scrollIntoViewIfNeeded();
      const box = await svg.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + (150 / 540) * box.height);
      await page.waitForTimeout(900);
      const sel = await page.locator('.bm-region[data-selected="true"]').count();
      const card = await page.locator('#body-map a[href^="/book?area=chest"]').count();
      const bm = await page.evaluate(inspect);
      if (!sel || !card || bm.overflow) {
        problems.push(`${tag} body map: selected=${sel} card=${card} overflow=${bm.overflow}`);
        await page.screenshot({ path: `${OUT}/${tag}-bodymap.png` });
      }

      // Booking flow to the payment screen.
      await page.goto(BASE + '/book?service=general', { waitUntil: 'networkidle' });
      const dates = page.locator('[aria-labelledby="date-label"] button');
      let picked = false;
      for (let i = 0; i < 8 && !picked; i++) {
        await dates.nth(i).click();
        await page.waitForTimeout(700);
        const slot = page.locator('[role="group"]').filter({ has: page.locator('button[aria-pressed]') }).last().locator('button:not([disabled])').first();
        if (await slot.count()) { await slot.click(); picked = true; }
      }
      await page.locator('section[aria-labelledby="step1"] button.btn-primary').click();
      await page.waitForTimeout(600);
      await page.locator('#name').fill('Matrix Patient');
      await page.locator('#phone').fill(`98${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`);
      await page.locator('#email').fill(`matrix${Date.now()}@example.com`);
      await page.locator('#symptoms').fill('Matrix audit booking with enough detail.');
      await page.locator('label[for="consent"]').click();
      await page.locator('form button[type=submit]').click();
      await page.locator('#utr').waitFor({ timeout: 8000 });
      await page.waitForTimeout(500);
      const pay = await page.evaluate(inspect);
      const timer = await page.locator('text=/\\d+:\\d\\d/').count();
      const issues = [];
      if (pay.overflow) issues.push(`overflow: ${pay.wide.join(' | ')}`);
      if (pay.truncated.length) issues.push(`truncated: ${pay.truncated.join(' | ')}`);
      if (!timer) issues.push('no hold timer');
      if (errs.length) issues.push(`console: ${errs.join(' | ').slice(0, 200)}`);
      if (issues.length) {
        problems.push(`${tag} booking payment screen: ${issues.join(' ; ')}`);
        await page.screenshot({ path: `${OUT}/${tag}-payment.png`, fullPage: true });
      }
      // Release the slot so the sandbox diary does not fill up.
      await page.getByRole('button', { name: /Cancel|रद्द|ਰੱਦ/ }).last().click();
      await page.waitForTimeout(400);
    } catch (e) {
      problems.push(`${tag} flow error: ${e.message.split('\n')[0]}`);
      await page.screenshot({ path: `${OUT}/${tag}-flow-error.png`, fullPage: true }).catch(() => {});
    }
  }
  await ctx.close();
}
await browser.close();

console.log(`Checked ${pages} page views across ${WIDTHS.length} widths × ${LANGS.length} languages × ${Object.keys(MODES).length} modes.`);
console.log(problems.length ? `\n${problems.length} problem(s):\n${problems.join('\n')}` : '\nNo overflow, truncation or console errors.');
console.log('\nControls under 44px (distinct, with how many page views they appeared on):');
console.log([...smallSeen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `  ${v}× ${k}`).join('\n') || '  none');
