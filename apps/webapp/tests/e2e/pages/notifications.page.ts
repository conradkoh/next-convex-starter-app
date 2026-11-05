import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class NotificationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Notifications', exact: true });
  }

  get browseIntegrationsLink(): Locator {
    return this.page.getByRole('link', { name: 'Browse integrations', exact: true });
  }

  override async navigate(path = '/app/settings/notifications'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }
}
