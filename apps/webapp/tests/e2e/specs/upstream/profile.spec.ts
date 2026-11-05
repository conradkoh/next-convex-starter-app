import { expect } from '@playwright/test';

import { test } from '../../fixtures/auth.fixture';
import { UserSettingsPage } from '../../pages/user-settings.page';
import { TAG_NAV, TAG_UPSTREAM } from '../../support/tags';

test.describe('User Settings Page', { tag: [TAG_UPSTREAM, TAG_NAV] }, () => {
  test('shows user and recovery settings when authenticated', async ({ authenticatedPage }) => {
    const userSettingsPage = new UserSettingsPage(authenticatedPage);
    await userSettingsPage.navigate();

    await expect(userSettingsPage.heading).toBeVisible();
    await expect(userSettingsPage.userSettingsHeading).toBeVisible();
    await expect(userSettingsPage.accountRecoveryHeading).toBeVisible();
  });
});
