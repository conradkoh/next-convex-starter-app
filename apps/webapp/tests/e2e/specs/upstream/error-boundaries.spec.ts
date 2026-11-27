import { expect, test, type Page } from '@playwright/test';

import { TAG_NAV, TAG_UPSTREAM } from '../../support/tags';

/** Makes the throwing test scenarios succeed on the next retry. */
async function allowRecovery(page: Page) {
  await page.evaluate(() => sessionStorage.setItem('test-errors:recover', '1'));
}

test.describe('Error boundaries', { tag: [TAG_UPSTREAM, TAG_NAV] }, () => {
  test('contains a 404 and links back home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Next Convex' })).toBeVisible();

    await page.getByRole('link', { name: 'Go to home' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('replaces a failed route with a focused panel and recovers on retry', async ({ page }) => {
    await page.goto('/test/errors?mode=render');

    const heading = page.getByRole('heading', { name: 'Something went wrong' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    // The navigation header lives outside the segment boundary, so it survives.
    await expect(page.getByRole('link', { name: 'Next Convex' })).toBeVisible();
    await expect(page.locator('main').getByRole('alert')).toHaveCount(1);

    // Recover on a single user-initiated retry. The retry runs in a React transition,
    // so setting the flag before the click keeps this deterministic.
    await allowRecovery(page);
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.locator('main').getByText('Recovered', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Something went wrong' })).toHaveCount(
      0
    );
  });

  test('shows a forbidden error without retry and without navigating away', async ({ page }) => {
    await page.goto('/test/errors?mode=forbidden');

    await expect(page.getByRole('heading', { name: "You don't have access" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Go to home' })).toBeVisible();
    await expect(page).toHaveURL(/\/test\/errors/);
  });

  test('redirects an expired session to the login page', async ({ page }) => {
    await page.goto('/test/errors?mode=auth');

    await expect(page).toHaveURL(/\/login/);
  });

  test('contains a widget failure to its region', async ({ page }) => {
    await page.goto('/test/errors?mode=region');

    const heading = page.getByRole('heading', { level: 2, name: "This section couldn't load" });
    await expect(heading).toBeVisible();
    await expect(heading).not.toBeFocused();
    await expect(page.getByText('Content above the region')).toBeVisible();
    await expect(page.getByText('Content below the region')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Next Convex' })).toBeVisible();

    await allowRecovery(page);
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.locator('main').getByText('Widget recovered', { exact: true })).toBeVisible();
  });
});
