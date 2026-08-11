/**
 * Customer multi-dish request create against live Railway (shorter than full quote flow).
 */
import { test, expect } from '@playwright/test';
import { applyCustomerAuth, getCustomerSession } from './auth-session';

test.describe('customer request create (live API)', () => {
  test('wizard posts multi-dish request and shows success', async ({ page }) => {
    test.setTimeout(300_000);
    const stamp = Date.now();
    const dishA = `E2E Laksa ${stamp}`;
    const dishB = `E2E Kueh ${stamp}`;

    await getCustomerSession();
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
    expect(page.url()).toMatch(/\/requests\/[^/?]+/);
  });
});
