import { test, expect, request, type Page } from '@playwright/test';

const COOK_EMAIL = process.env.SHC_COOK_EMAIL || 'rose@shc.local';
const COOK_PASSWORD = process.env.SHC_COOK_PASSWORD || 'cooksecret';
const API_BASE = process.env.NEXT_PUBLIC_SHC_API_BASE || 'https://medusa-production-d2ba.up.railway.app';
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  'pk_0c98d5a5c7ba76cad2ea42501361d8e29825876bcedb8425a627f35a2c12b9b2';

async function seedCookSession(page: Page) {
  const api = await request.newContext({
    extraHTTPHeaders: {
      'content-type': 'application/json',
      'x-publishable-api-key': PUBLISHABLE_KEY,
    },
  });
  const loginRes = await api.post(`${API_BASE}/store/shc/auth/cook/login`, {
    data: { email: COOK_EMAIL, password: COOK_PASSWORD },
  });
  expect(loginRes.ok()).toBeTruthy();
  const session = await loginRes.json();
  await page.addInitScript(
    (data) => {
      localStorage.setItem('shc_cook_token', data.token);
      localStorage.setItem('shc_cook_user', data.userJson);
      localStorage.setItem('shc_cook_onboarding_seen_v1', '1');
    },
    { token: session.token as string, userJson: JSON.stringify(session.user) },
  );
  await page.goto('/cook-portal/dashboard');
  await expect(page.getByTestId('cook-dashboard')).toBeVisible({ timeout: 90_000 });
}

test.describe('cook portal smoke', () => {
  test('login screen renders', async ({ page }) => {
    await page.goto('/cook-portal/dashboard');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await expect(page.getByTestId('cook-login-screen')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('cook-login-email')).toBeVisible();
    await expect(page.getByTestId('cook-login-submit')).toBeVisible();
  });

  test('dashboard → settings → batches → earnings → orders', async ({ page }) => {
    await seedCookSession(page);

    await page.getByTestId('cook-kitchen-settings-link').click();
    await expect(page.getByTestId('cook-settings-screen')).toBeVisible();
    await page.getByTestId('cook-settings-display-name').fill('Rose Web E2E');
    await page.getByTestId('cook-settings-save-btn').click();
    await expect(page.getByTestId('cook-settings-screen')).toBeVisible();

    await page.goto('/cook-portal/batches');
    await expect(page.getByTestId('cook-batches-page')).toBeVisible();
    await page.getByTestId('batch-title').fill('Web smoke batch');
    await page.getByTestId('batch-price').fill('9.90');
    const slot = page.getByTestId('batch-slot-18:00-19:00');
    if (await slot.isVisible().catch(() => false)) {
      await slot.click();
    } else {
      await page.getByTestId(/^batch-slot-/).first().click();
    }
    await page.getByTestId('batch-submit').click();

    await page.goto('/cook-portal/earnings');
    await expect(page.getByTestId('cook-earnings-screen')).toBeVisible();
    await page.getByTestId('expense-amount-input').fill('12.50');
    await page.getByTestId('expense-category-input').fill('ingredients');
    await page.getByTestId('expense-submit-btn').click();

    await page.goto('/cook-portal/orders');
    await expect(page.getByTestId('cook-orders-screen')).toBeVisible();
  });
});
