/** Opens the sandbox clinic dashboard with a token session and captures it. */
import { chromium } from '@playwright/test';
const [base = 'http://localhost:5173', out = '.', token = 'local-sandbox-token', theme = 'light'] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(({ token, theme }) => {
  localStorage.setItem('clinic-comfort', JSON.stringify({ theme }));
  sessionStorage.setItem('clinic-admin-session', token);
}, { token, theme });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto(base + '/admin', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/admin-dash-${theme}.png` });
console.log(JSON.stringify({ errors }));
await b.close();
