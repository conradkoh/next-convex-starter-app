import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class AdminUsersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'User Roles' });
  }

  get allUsersCard(): Locator {
    return this.page.getByText('All Users', { exact: true });
  }

  get firstUserRow(): Locator {
    return this.page.locator('.rounded-lg.border.p-3').first();
  }

  override async navigate(path = '/app/admin/users'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
    await expect(this.allUsersCard).toBeVisible();
    await expect(this.firstUserRow).toBeVisible();
  }
}
