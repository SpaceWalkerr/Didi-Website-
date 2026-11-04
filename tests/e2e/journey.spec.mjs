import { test, expect } from '@playwright/test';

/** Fail the test on any uncaught page error or console error. */
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

test('home → body map → concierge → book → slot → details → payment screen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => localStorage.setItem('clinic-language', 'en'));
  await page.goto('/');

  // Hero
  await expect(page.getByRole('heading', { level: 1 })).toContainText('time to listen');
  await expect(page.getByText('Reg. No. 52532').first()).toBeVisible();

  // Body map: choose an area from the list, the result card appears with a booking route.
  const map = page.locator('#body-map');
  await map.getByRole('button', { name: 'Chest & breathing' }).last().click();
  await expect(map.getByRole('heading', { name: 'Chest & breathing' })).toBeVisible();
  await expect(map.getByText('Not for emergencies.')).toBeVisible();
  await expect(map.getByRole('link', { name: /Book for this/ })).toHaveAttribute('href', /\/book\?area=chest/);

  // Concierge: new problem, no existing diagnosis → General Consultation.
  const concierge = page.locator('#concierge');
  await concierge.scrollIntoViewIfNeeded();
  await concierge.getByRole('button', { name: 'Something new' }).click();
  await concierge.getByRole('button', { name: 'No', exact: true }).click();
  await expect(concierge.getByRole('heading', { name: 'General Consultation' })).toBeVisible();
  await expect(concierge.getByText('₹500')).toBeVisible();
  await concierge.getByRole('link', { name: /Book this consultation/ }).click();

  // Booking: the type is preselected from the concierge.
  await expect(page).toHaveURL(/\/book\?service=general/);
  await expect(page.getByRole('radio', { name: /General Consultation/ })).toBeChecked();

  // Slot: first free time on the first date that has one.
  const times = page.getByRole('group', { name: /Available times/ });
  let picked = false;
  const dates = page.getByRole('group', { name: 'Date' }).getByRole('button');
  for (let i = 0; i < Math.min(await dates.count(), 10) && !picked; i++) {
    await dates.nth(i).click();
    await page.waitForTimeout(400);
    const free = times.locator('button:not([disabled])');
    if (await free.count()) {
      await free.first().click();
      picked = true;
    }
  }
  expect(picked, 'a free slot exists in the next ten open days').toBe(true);
  await page.getByRole('button', { name: 'Continue' }).click();

  // Details: inline validation appears on blur, before anything is sent.
  await page.getByLabel(/Email/).fill('not-an-email');
  await page.getByLabel(/Email/).blur();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();

  await page.getByLabel(/Full name/).fill('Test Patient');
  await page.getByLabel(/Mobile number/).fill('9876543210');
  await page.getByLabel(/Email/).fill('test.patient@example.com');
  await page.getByLabel(/What would you like to discuss/).fill('A cough that has lasted two weeks, worse at night.');
  await page.getByLabel(/I consent to an online consultation/).check();
  await expect(page.getByText('Please enter a valid email address.')).toBeHidden();

  await page.getByRole('button', { name: /Continue to UPI payment/ }).click();

  // Payment screen (UPI, as in production). Stop here: no money moves.
  // exact: the UPI hold note below also starts with "Your slot is held …".
  await expect(page.getByText('Your slot is held', { exact: true })).toBeVisible();
  await expect(page.getByText('demo-clinic@upi')).toBeVisible();
  await expect(page.getByLabel(/UTR/)).toBeVisible();

  expect(errors, errors.join('\n')).toEqual([]);
});

test('comfort controls: night mode and large text persist across pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reading comfort' }).click();
  await page.getByText('Night', { exact: true }).click();
  await page.getByText('Extra large', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'xl');
  await page.goto('/services');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test('language switch to Hindi and Punjabi keeps the page intact', async ({ page }) => {
  for (const [code, word] of [['hi', 'सुनने'], ['pa', 'ਸੁਣਨ']]) {
    await page.addInitScript((c) => localStorage.setItem('clinic-language', c), code);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(word);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe(code);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }
});

test('unknown routes show the designed 404', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res.status()).toBe(404);
  await expect(page.getByRole('link', { name: /Book Consultation/ }).first()).toBeVisible();
});
