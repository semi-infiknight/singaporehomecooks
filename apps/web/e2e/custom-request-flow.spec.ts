import { test, expect, request, type Page } from '@playwright/test';

const CUSTOMER_EMAIL = process.env.SHC_CUSTOMER_EMAIL || 'customer@shc.local';
const CUSTOMER_PASSWORD = process.env.SHC_CUSTOMER_PASSWORD || 'customersecret';
const COOK_EMAIL = process.env.SHC_COOK_EMAIL || 'rose@shc.local';
const COOK_PASSWORD = process.env.SHC_COOK_PASSWORD || 'cooksecret';
const API_BASE = process.env.NEXT_PUBLIC_SHC_API_BASE || 'https://medusa-production-d2ba.up.railway.app';
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  'pk_0c98d5a5c7ba76cad2ea42501361d8e29825876bcedb8425a627f35a2c12b9b2';

async function seedCustomerSession(page: Page) {
  const api = await request.newContext({
    extraHTTPHeaders: {
      'content-type': 'application/json',
      'x-publishable-api-key': PUBLISHABLE_KEY,
    },
  });
  const loginRes = await api.post(`${API_BASE}/store/shc/auth/customer/login`, {
    data: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
  });
  expect(loginRes.ok()).toBeTruthy();
  const session = await loginRes.json();
  await page.addInitScript(
    (data) => {
      localStorage.setItem('shc_web_token', data.token);
      localStorage.setItem('shc_web_user', data.userJson);
    },
    { token: session.token as string, userJson: JSON.stringify(session.user) }
  );
}

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
    { token: session.token as string, userJson: JSON.stringify(session.user) }
  );
}

test.describe('custom request web flow', () => {
  test('request wizard → cook quote → partial accept → PayNow panel', async ({ page }) => {
    test.setTimeout(180_000);
    const stamp = Date.now();
    const dishA = `Web Laksa ${stamp}`;
    const dishB = `Web Kueh ${stamp}`;

    await seedCustomerSession(page);
    await page.goto('/request');
    await expect(page.getByTestId('request-dish-screen')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('request-step-occasion')).toBeVisible();

    await page.getByTestId('submit-request-btn').click();
    await expect(page.getByTestId('request-step-dishes')).toBeVisible();

    await page.getByTestId('request-dish-name-0').fill(dishA);
    await page.getByTestId('request-add-dish').click();
    await expect(page.getByTestId('request-dish-name-1')).toBeVisible();
    await page.getByTestId('request-dish-name-1').fill(dishB);
    await page.getByTestId('submit-request-btn').click();

    await expect(page.getByTestId('request-step-gathering')).toBeVisible();
    await page.getByTestId('request-guests-8').click();
    await page.getByTestId('submit-request-btn').click();

    await expect(page.getByTestId('request-step-review')).toBeVisible();
    await page.getByTestId('submit-request-btn').click();

    await expect(page.getByTestId('request-success')).toBeVisible({ timeout: 90_000 });
    await page.getByRole('button', { name: 'View request' }).click();
    await expect(page.getByTestId('custom-request-detail')).toBeVisible({ timeout: 60_000 });
    const requestUrl = page.url();
    const requestId = requestUrl.split('/requests/')[1]?.split('?')[0];
    expect(requestId).toBeTruthy();

    await seedCookSession(page);
    await page.goto('/cook-portal/orders');
    await expect(page.getByTestId('cook-orders-screen')).toBeVisible({ timeout: 90_000 });

    const reqCard = page.getByTestId(`collab-req-${requestId}`);
    await reqCard.scrollIntoViewIfNeeded();
    await expect(reqCard).toBeVisible({ timeout: 120_000 });
    await expect(reqCard.getByText(dishA).first()).toBeVisible();

    const builder = reqCard.getByTestId(`quote-builder-${requestId}`);
    const priceInputs = builder.locator('[data-testid^="quote-price-"]');
    await priceInputs.nth(0).fill('45');
    await priceInputs.nth(0).blur();
    await priceInputs.nth(1).fill('35');
    await priceInputs.nth(1).blur();
    await builder.getByTestId(`quote-builder-${requestId}-send`).click();
    await expect(reqCard.getByTestId(`bid-success-${requestId}`)).toBeVisible({ timeout: 90_000 });

    await seedCustomerSession(page);
    await page.goto(`/requests/${requestId}`);
    await expect(page.getByTestId('custom-request-detail')).toBeVisible({ timeout: 60_000 });

    const quoteCard = page.locator('li[data-testid^="quote-"]').first();
    await expect(quoteCard).toBeVisible({ timeout: 60_000 });

    const lineChecks = quoteCard.locator('input[type="checkbox"]');
    if ((await lineChecks.count()) > 1) {
      await lineChecks.nth(1).uncheck();
    }
    const acceptBtn = quoteCard.getByRole('button', { name: /Accept selected/i });
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    await expect(page.getByTestId('order-tracking-screen')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(new RegExp(`/orders/[^/?]+\\?pay=1`));
    await expect(page.getByTestId('order-paynow-panel')).toBeVisible({ timeout: 60_000 });
  });
});
