import { expect } from '@playwright/test';

import { test } from '../../fixtures/auth.fixture';
import { NotificationsPage } from '../../pages/notifications.page';
import { TelegramSettingsPage } from '../../pages/telegram-settings.page';
import { ThirdPartyIntegrationsPage } from '../../pages/third-party-integrations.page';
import { TAG_NAV, TAG_UPSTREAM } from '../../support/tags';

test.describe('Notifications Settings', { tag: [TAG_UPSTREAM, TAG_NAV] }, () => {
  test('configures and removes a Telegram integration when authenticated', async ({
    authenticatedPage,
  }) => {
    const notificationsPage = new NotificationsPage(authenticatedPage);
    const integrationsPage = new ThirdPartyIntegrationsPage(authenticatedPage);
    const telegramPage = new TelegramSettingsPage(authenticatedPage);

    await notificationsPage.navigate();
    await expect(notificationsPage.browseIntegrationsLink).toBeVisible();
    await notificationsPage.browseIntegrationsLink.click();

    await expect(integrationsPage.heading).toBeVisible();
    await expect(integrationsPage.availableHeading).toBeVisible();
    await integrationsPage.configureTelegramLink.click();

    await expect(telegramPage.heading).toBeVisible();
    await telegramPage.channelIdInput.fill('@e2e_notifications');
    await telegramPage.botTokenInput.fill('123456:e2e-test-token');
    await expect(telegramPage.saveButton).toBeEnabled();
    await telegramPage.saveButton.click();

    await authenticatedPage.waitForURL('**/app/settings/notifications/third-party');
    await expect(integrationsPage.connectedHeading).toBeVisible();
    await expect(authenticatedPage.getByText('@e2e_notifications', { exact: true })).toBeVisible();

    await integrationsPage.openActions();
    await integrationsPage.deleteMenuItem.click();

    const dialog = authenticatedPage.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('removes the Telegram channel configuration');
    await integrationsPage.deleteConfirmationButton.click();

    await expect(integrationsPage.availableHeading).toBeVisible();
    await expect(authenticatedPage.getByRole('status')).toContainText(
      'Telegram connection removed.'
    );
  });
});
