import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class UserSettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'User settings', exact: true });
  }

  get userSettingsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'User details', exact: true });
  }

  get accountRecoveryHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Account recovery', exact: true });
  }

  override async navigate(path = '/app/settings/user'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }
}
