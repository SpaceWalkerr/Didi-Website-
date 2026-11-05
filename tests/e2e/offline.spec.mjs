import { test, expect } from '@playwright/test';

/**
 * "My bookings" offline: the service worker serves the app shell, and the page
 * falls back to the copy it saved on this phone. The account API is stubbed so
 * no real sign-in email is needed; everything else is the real build.
 */
const EMAIL = 'offline-test@example.com';
const OFFLINE_KEY = 'clinic-bookings-offline';
const DAY = 24 * 60 * 60 * 1000;

const booking = (id, startsAt, extra = {}) => ({
  id,
  status: 'confirmed',
  date: '2099-01-01',
  time: '10:00',
  when: `Slot ${id}`,
  startsAt,
  serviceId: 'general',
  serviceName: 'General Consultation',
  durationMinutes: 20,
  amount: 500,
  followUpDate: null,
  paymentSubmitted: false,
  canCancel: false,
  canReschedule: false,
  whatsappLink: 'https://wa.me/919117851233?text=test',
  ...extra,
});

const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), OFFLINE_KEY);

test('My bookings keeps working offline, keeps only upcoming bookings, and forgets them on sign-out', async ({ page, context }) => {
  const now = Date.now();
  const me = {
    email: EMAIL,
    name: 'Offline Patient',
    phone: '9876543210',
    clinic: { whatsapp: '919117851233' },
    bookings: [booking('UPCOMING1', now + 2 * DAY), booking('PAST0001', now - 3 * DAY, { whatsappLink: null })],
  };
  await context.route('**/api/account/me', (route) => route.fulfill({ json: me }));
  await page.addInitScript((email) => {
    localStorage.setItem('clinic-language', 'en');
    if (!sessionStorage.getItem('signed-out')) localStorage.setItem('clinic-patient-session', JSON.stringify({ token: 'test-token', email }));
  }, EMAIL);

  // First visit installs the service worker; the second runs under it, so the
  // account page's code is cached too.
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto('/account');
  await expect(page.getByText('ID UPCOMING1')).toBeVisible();

  const copy = await stored(page);
  expect(copy.me.bookings.map((b) => b.id)).toEqual(['UPCOMING1']);
  expect(copy.me.phone).toBeUndefined();

  // No signal: shell from the service worker, list from the saved copy.
  await context.unroute('**/api/account/me');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/You are offline\. Showing your bookings as last saved/)).toBeVisible();
  await expect(page.getByText('ID UPCOMING1')).toBeVisible();
  await expect(page.getByText('ID PAST0001')).toHaveCount(0);

  // Sign out deletes it.
  await page.evaluate(() => sessionStorage.setItem('signed-out', '1'));
  await page.getByRole('button', { name: 'Sign out' }).click();
  expect(await stored(page)).toBeNull();
  await context.setOffline(false);
});

test('a saved copy whose bookings have all passed is deleted, not shown', async ({ page, context }) => {
  // The bookings request fails as it does with no signal, so the page reaches
  // for the saved copy, which holds only a booking from two days ago.
  await context.route('**/api/account/me', (route) => route.abort('internetdisconnected'));
  await page.addInitScript(
    ({ email, key, copy }) => {
      localStorage.setItem('clinic-language', 'en');
      localStorage.setItem('clinic-patient-session', JSON.stringify({ token: 'test-token', email }));
      localStorage.setItem(key, JSON.stringify(copy));
    },
    {
      email: EMAIL,
      key: OFFLINE_KEY,
      copy: { email: EMAIL, at: Date.now() - DAY, me: { email: EMAIL, bookings: [booking('OLD00001', Date.now() - 2 * DAY)] } },
    },
  );
  await page.goto('/account');
  await expect(page.getByText('We could not load your bookings. Please try again.')).toBeVisible();
  await expect(page.getByText('ID OLD00001')).toHaveCount(0);
  expect(await stored(page)).toBeNull();
});
