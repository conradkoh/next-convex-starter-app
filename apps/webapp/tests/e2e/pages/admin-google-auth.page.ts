import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class AdminGoogleAuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Google Authentication Configuration' });
  }

  get loadedSignal(): Locator {
    return this.page.getByText('Google Authentication Control', { exact: true });
  }

  override async navigate(path = '/app/admin/google-auth'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
    await expect(this.loadedSignal).toBeVisible();
  }
}
