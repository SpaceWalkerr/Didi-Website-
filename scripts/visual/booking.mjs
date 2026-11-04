/** Walks the booking flow to the payment screen and captures each step. */
import { chromium } from '@playwright/test';
const [base = 'http://localhost:5173', out = '.', width = '375', theme = 'light', lang = 'en'] = process.argv.slice(2);
const w = Number(width);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 800 : 900 }, deviceScaleFactor: w < 800 ? 2 : 1 });
await ctx.addInitScript(({ theme, lang }) => {
  localStorage.setItem('clinic-comfort', JSON.stringify({ theme }));
  localStorage.setItem('clinic-language', lang);
}, { theme, lang });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto(base + '/book?service=general', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
const tag = `${w}-${theme}-${lang}`;
await p.screenshot({ path: `${out}/book1-${tag}.png` });
const dates = p.locator('[aria-labelledby="date-label"] button');
for (let i = 0; i < 8; i++) {
  await dates.nth(i).click();
  await p.waitForTimeout(1200);
  const slot = p.getByRole('group', { name: /Available times|उपलब्ध|ਉਪਲਬਧ/ }).locator('button:not([disabled])').first();
  if (await slot.count()) { await slot.click(); break; }
}
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/book2-${tag}.png` });
await p.locator('section[aria-labelledby="step1"] button.btn-primary').click();
await p.waitForTimeout(900);
await p.locator('#email').fill('bad');
await p.locator('#name').click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/book3-${tag}.png` });
await p.locator('#name').fill('Asha Verma');
await p.locator('#phone').fill('9876543211');
await p.locator('#email').fill('asha2@example.com');
await p.locator('#symptoms').fill('Design review sandbox booking with enough detail.');
await p.locator('#consent').check();
await p.locator('form button[type=submit]').click();
await p.waitForTimeout(1800);
await p.locator('section[aria-labelledby="step2"]').scrollIntoViewIfNeeded();
await p.screenshot({ path: `${out}/book4-${tag}.png` });
console.log(JSON.stringify({ errors }));
await b.close();
