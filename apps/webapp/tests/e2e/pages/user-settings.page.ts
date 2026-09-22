import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class UserSettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'User', exact: true }).first();
  }

  get userSettingsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'User', exact: true }).nth(1);
  }

  get profileSettingsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Profile', exact: true });
  }

  override async navigate(path = '/app/settings/user'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }
}
