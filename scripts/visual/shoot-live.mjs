import { chromium } from '@playwright/test';
const out = process.argv[2];
const base = 'https://richarani.in';
const routes = ['/', '/about', '/services', '/faq', '/contact', '/book', '/account', '/privacy', '/nope-404'];
const widths = [375, 768, 1440];
const browser = await chromium.launch();
const report = { console: [], stats: [] };
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 812 : 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.console.push(`${w} ${page.url()} ${m.text()}`); });
  for (const r of routes) {
    await page.goto(base + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    if (r === '/') {
      // Above-the-fold stat values before any scroll
      const stats = await page.$$eval('dl dd span:first-child', (els) => els.map((e) => e.textContent.trim()));
      report.stats.push({ w, atLoad: stats.slice(0, 3) });
    }
    const name = (r === '/' ? 'home' : r.slice(1)).replace(/\//g, '_');
    await page.screenshot({ path: `${out}/${name}-${w}.png`, fullPage: w !== 1440 || true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) report.console.push(`OVERFLOW ${w} ${r}`);
  }
  // booking flow
  await page.goto(base + '/book', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const slot = page.locator('button[aria-pressed="false"]:not([disabled])').filter({ hasText: /AM|PM|:/ }).first();
  if (await slot.count()) {
    await slot.click();
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/book-details-${w}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
