import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA (axe-core) on the public pages, in every comfort mode a patient
 * can choose: day and night, normal and extra-large text, and in Hindi.
 */
const ROUTES = ['/', '/about', '/services', '/faq', '/contact', '/book', '/account', '/privacy', '/no-such-page'];
const MODES = [
  { name: 'day', theme: 'light', text: 'normal', lang: 'en' },
  { name: 'night-xl', theme: 'night', text: 'xl', lang: 'en' },
  { name: 'hindi-night', theme: 'night', text: 'normal', lang: 'hi' },
];

for (const mode of MODES) {
  test(`axe WCAG 2.1 AA — ${mode.name}`, async ({ page }) => {
    await page.addInitScript((m) => {
      localStorage.setItem('clinic-comfort', JSON.stringify({ theme: m.theme, text: m.text }));
      localStorage.setItem('clinic-language', m.lang);
    }, mode);
    const failures = [];
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Let entrance animations settle so contrast is measured on final colours.
      await page.waitForTimeout(1500);
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of violations) {
        failures.push(`${route} [${v.id}] ${v.help}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
}
