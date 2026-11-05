import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class TelegramSettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Configure Telegram', exact: true });
  }

  get channelIdInput(): Locator {
    return this.page.getByLabel('Channel ID or username', { exact: true });
  }

  get botTokenInput(): Locator {
    return this.page.getByLabel('Bot token', { exact: true });
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save settings', exact: true });
  }

  override async navigate(
    path = '/app/settings/notifications/third-party/telegram'
  ): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }
}
