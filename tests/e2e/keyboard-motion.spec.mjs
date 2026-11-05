import { test, expect } from '@playwright/test';

/** The element that currently has focus, described briefly. */
const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el?.tagName, label: el?.getAttribute('aria-label') || el?.textContent?.trim().slice(0, 40), ring: getComputedStyle(el).boxShadow !== 'none' || getComputedStyle(el).outlineStyle !== 'none' };
  });

test.describe('keyboard', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('skip link is first and moves focus to the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    expect((await focused(page)).label).toMatch(/Skip to main content/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('reading comfort opens, changes size with the keyboard, closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reading comfort' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Reading comfort' })).toBeVisible();
    await page.getByRole('radio', { name: /Normal/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    expect((await focused(page)).label).toBe('Reading comfort');
  });

  test('body map regions are reachable and operable by keyboard, with a visible focus', async ({ page }) => {
    await page.goto('/');
    const region = page.locator('.bm-region[aria-label="Chest & breathing"]');
    await region.focus();
    const contour = await region.locator('.bm-contour').evaluate((el) => getComputedStyle(el).strokeWidth);
    expect(parseFloat(contour)).toBeGreaterThan(2);
    await page.keyboard.press('Enter');
    await expect(region).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#body-map').getByRole('heading', { name: 'Chest & breathing' })).toBeVisible();
    await page.keyboard.press(' ');
    await expect(region).toHaveAttribute('aria-pressed', 'false');
  });

  test('concierge moves focus to each new question and announces the result', async ({ page }) => {
    await page.goto('/');
    await page.locator('#concierge').getByRole('button', { name: 'Already discussed' }).focus();
    await page.keyboard.press('Enter');
    expect((await focused(page)).label).toBe('Yes');
    await page.keyboard.press('Enter');
    await expect(page.locator('#concierge').getByRole('heading', { name: 'Follow-up Consultation' })).toBeVisible();
    await expect(page.locator('#concierge [aria-live="polite"]')).toContainText('Follow-up Consultation');
  });

  test('every focusable element on the home page shows a focus indicator', async ({ page }) => {
    await page.goto('/');
    const missing = [];
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press('Tab');
      const f = await focused(page);
      if (f.tag && f.tag !== 'BODY' && !f.ring) missing.push(`${f.tag} ${f.label}`);
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });
});

test.describe('prefers-reduced-motion', () => {
  test('ambient loops, split text, ECG draw, zoom and the pinned story are off', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await page.waitForTimeout(50); // one frame: a 0.01 ms animation has finished
    // Content is in its final state immediately.
    const words = await page.locator('#hero-title span[aria-hidden] > span').first().evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(words)).toBe(1);
    const ecg = await page.locator('.ecg-draw').first().evaluate((el) => getComputedStyle(el).strokeDashoffset);
    expect(parseFloat(ecg)).toBe(0);
    // Loops are reduced to a single near-zero run.
    for (const sel of ['.portrait-breathe', '.hero-light', '.portrait-orbit']) {
      const d = await page.locator(sel).first().evaluate((el) => getComputedStyle(el).animationDuration);
      expect(parseFloat(d), sel).toBeLessThan(0.01);
    }
    // The scroll story is a static list, not a pinned section.
    await expect(page.locator('#how-it-works ol li')).toHaveCount(4);
    expect(await page.locator('#how-it-works .sticky').count()).toBe(0);
    // Choosing a body region does not animate the zoom.
    await page.locator('.bm-region[aria-label="Chest & breathing"]').focus();
    await page.keyboard.press('Enter');
    const transition = await page.locator('.bm-figure').evaluate((el) => el.style.transition);
    expect(transition).toBe('none');
    // Scroll reveals never hide content.
    const hidden = await page.evaluate(() => [...document.querySelectorAll('.reveal')].filter((el) => getComputedStyle(el).opacity !== '1').length);
    expect(hidden).toBe(0);
  });
});
