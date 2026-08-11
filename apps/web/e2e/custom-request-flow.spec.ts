import { test, expect } from '@playwright/test';
import {
  applyCustomerAuth,
  applyCookAuth,
  reapplyCustomerAuth,
  getCustomerSession,
  getCookSession,
} from './auth-session';

test.describe('custom request web flow', () => {
  // Serial: shared login cache must not race
  test.describe.configure({ mode: 'serial' });

  test('request wizard → cook quote → partial accept → PayNow panel', async ({ page }) => {
    test.setTimeout(420_000);
    const stamp = Date.now();
    const dishA = `Web Laksa ${stamp}`;
    const dishB = `Web Kueh ${stamp}`;

    // Warm auth cache once (disk + memory) before any UI
    await getCustomerSession();
    await getCookSession();

    await applyCustomerAuth(page);
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

    // Cook portal — set prices on per-dish pages (hideDishRows on builder)
    await applyCookAuth(page);
    await page.goto('/cook-portal/requests');
    await expect(page.getByTestId('cook-custom-requests-screen')).toBeVisible({ timeout: 90_000 });

    const openCard = page.getByTestId(`cook-open-request-${requestId}`);
    await openCard.scrollIntoViewIfNeeded();
    await expect(openCard).toBeVisible({ timeout: 120_000 });
    await openCard.click();

    await expect(page.getByTestId('cook-custom-request-detail')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(dishA).first()).toBeVisible();

    // Price each dish via line detail screens
    const dishRows = page.locator('[data-testid^="cook-request-dish-"]');
    const dishCount = await dishRows.count();
    expect(dishCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < dishCount; i++) {
      // Re-query after each navigation
      const row = page.locator('[data-testid^="cook-request-dish-"]').nth(i);
      await row.click();
      const price = page.locator('[data-testid^="quote-price-"]').first();
      await expect(price).toBeVisible({ timeout: 30_000 });
      await price.fill(i === 0 ? '45' : '35');
      await price.blur();
      await page.getByTestId('cook-request-dish-done').click();
      await expect(page.getByTestId('cook-custom-request-detail')).toBeVisible({ timeout: 30_000 });
    }

    // Unique builder test id (section wrapper is quote-builder-section-*)
    const builder = page.getByTestId(`quote-builder-${requestId}`);
    await expect(builder).toBeVisible({ timeout: 30_000 });
    await page.getByTestId(`quote-builder-${requestId}-send`).click();
    await expect(page.getByTestId(`cook-saved-quote-${requestId}`)).toBeVisible({ timeout: 90_000 });

    // Customer accepts partial quote
    await reapplyCustomerAuth(page);
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
