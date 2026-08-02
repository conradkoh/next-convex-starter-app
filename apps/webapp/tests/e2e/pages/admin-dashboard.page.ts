import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class AdminDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Admin Dashboard' });
  }

  get systemInformationHeading(): Locator {
    return this.page.getByRole('heading', { name: 'System Information' });
  }

  override async navigate(path = '/app/admin'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }
}
